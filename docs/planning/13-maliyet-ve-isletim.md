# Maliyet ve işletim planı v1.0

Fiyat incelemesi: 20 Eylül 2026; USD, vergiler/kur/insan emeği/özel sözleşmeler hariç. Aşağıdakiler planlama senaryosudur, satın alma veya fiyat garantisi değildir. Altyapı bütçesi yanıtlanmadığı için önerilen pilot harcama sınırı **500 USD/ay**, sağlayıcı ücretli aktivasyonu ayrıca hesap sahibi tarafından yapılır.

## Doğrulanan birim fiyatlar

| Sağlayıcı | İncelenen fiyat / plan |
|---|---|
| Supabase | Pro 25 USD/ay; 10 USD compute kredisi; Small 15, Micro 10 USD/ay; prod Small + staging Micro toplam başlangıç 40 USD/ay |
| Vercel | Pro 20 USD/ay başlangıç ve 20 USD kullanım kredisi; ek developer seat/kullanım ayrıca |
| Resend | Pro 20 USD/ay, 50.000 email; aşım 0,90 USD/1.000 |
| Cloudflare Stream | Her 1.000 saklama dakikası için 5 USD/ay kapasite; teslim edilen 1.000 dakika için 1 USD |
| Anthropic Haiku 4.5 | 1M input token 1 USD, 1M output 5 USD; B2 isteği 2.000 input + 500 output varsayımıyla 1.000 istek ≈4,50 USD |
| SCORM Cloud | Bir registration kullanıcı×kurs ilişkisidir; örnek 4.000 yeni registration/ay planı 1.100 USD, 10.000 için 2.000 USD; B1 temel bütçeye dahil değil |

Kaynaklar: [Supabase](https://supabase.com/pricing), [Vercel](https://vercel.com/pricing), [Resend](https://resend.com/pricing), [Stream](https://developers.cloudflare.com/stream/pricing/), [Anthropic](https://platform.claude.com/docs/en/models/overview), [SCORM Cloud](https://rusticisoftware.com/products/scorm-cloud/).

Supabase dashboard SSO ile son kullanıcı SAML MAU fiyatı farklı kalemlerdir; Enterprise plan fiyatını sırf kullanıcı SSO'su var diye otomatik bütçeye koyma. Gerçek SAML kullanım ve egress fiyatları B2 aktivasyonunda tekrar hesaplanır.

## Senaryolar

| Varsayım/kalem | Pilot | Büyüme | Ölçek |
|---|---:|---:|---:|
| Kayıtlı / eşzamanlı hedef | 500 / 100 | 5.000 / 500 | 50.000 / 5.000 |
| Aktif video izleyici | 500 | 5.000 | 50.000 |
| İzleme / kişi / ay | 240dk | 240dk | 240dk |
| Teslim edilen dakika | 120.000 | 1.200.000 | 12.000.000 |
| Video kütüphanesi | 6.000dk | 30.000dk | 60.000dk |
| Stream saklama + teslim | 150 USD | 1.350 USD | 12.300 USD |
| Supabase başlangıç model ödeneği | 40 | 85–250 | 250–1.500 |
| Vercel/seat/kullanım ödeneği | 20–60 | 60–200 | 300–1.500 |
| Eposta ödeneği | 20 | 20–65 | 65–500 |
| Worker/backup/log ödeneği | 30–65 | 100–250 | 300–1.500 |
| AI ödeneği | 0 B1 | 25–100 | 100–500 |
| Temel altyapı ara toplam | 260–335 | 1.640–2.215 | 13.315–17.800 |
| %30 ihtiyat dahil bütçe aralığı | 338–436 | 2.132–2.880 | 17.310–23.140 |

Ara toplamların Stream dışındaki büyüme/ölçek rakamları ölçüm öncesi mühendislik ödeneğidir, sağlayıcı resmi teklifi değildir. Kaynakların bu eşzamanlı sayıyı kaldırdığı test edilmedi. Kütüphane saklama kapasitesi yukarı yuvarlanır; buffer/prefetch trafik de faturaya girebilir. Öğrenen başına 4 saat yerine 1 saat izleme, teslim maliyetini dörtte bire indirir.

Geniş SCORM kullanan örnek pilot: 500 kişi × 4 yeni kurs = 2.000 registration. Seçilen SCORM Cloud 4.000 planıyla yaklaşık +1.100 USD/ay; temel 500 USD hedefi bu ek modülü kapsamaz. Bu yüzden bütçe kapısı gerçek bir aktivasyon koşuludur. Kullanıcıya kayıt adedi ile aktif kullanıcı farklı gösterilir. Aynı registration resume yeniden kayıt oluşturmaz; yeni dönem/sürüm eşlemesi uygulama politikasına bağlı ölçülür.

Hariç: eğitim satın alma/üretimi, isEazy lisansı, toplantı hesapları, ödeme komisyonu, dış güvenlik incelemesi, hukuki inceleme, vergi, alan adı, tasarım/geliştirme emeği. Bunların yok sayılması toplam sahip olma maliyetini gizler.

## Kuyruk ve arka plan işletimi

DB outbox → durable queue → Cloud Run Job. Scheduler yalnızca uyandırıcıdır; aynı işi birden fazla container alabilir, lease/fencing + unique source tek iş etkisini sağlar. Lease 120sn, heartbeat 30sn; her job çalışması tenant başına en fazla bir ağır iş, global 4 eşzamanlı pilot. Hatalı ZIP/network işlemi container'ın tüm tenant kuyruğunu tüketmesine izin verilmez.

Paket tarama/decode, sertifika PDF, export, eposta, provider reconciliation ve retention işlerinin ayrı job kind/kuyruk önceliği. Öncelik: progress persist web transaction → kritik bildirim/cert → import/publish → büyük rapor → bakım. Öğrenme kaydı asenkron kuyruğa düşmeden server'da kalıcılaşır; sadece türev işler kuyruğa gider.

## Gözlemlenebilirlik ve alarmlar

| Sinyal | Pilot alarm eşiği | Eylem |
|---|---|---|
| API 5xx | 5dk boyunca >%2, min 20 istek | Rollout durdur, trace incele |
| Progress commit hata | 5dk >%1 | Öğrenme incident; yanlış başarı UI'ını engelle |
| Critical queue yaşı | >5dk | Worker/lease/scheduler sağlığı |
| Bulk queue yaşı | >30dk | Kota/kapasite, admin iş durumu |
| Eposta bounce | 1saat >%5 ve min 20 gönderim | Kampanya durdur, gönderici/kalite kontrolü |
| DB bağlantı/kaynak | 15dk >%80 | Ağır report sınırla, kapasite incele |
| Aylık maliyet tahmini | Bütçenin %80 / %100 | Platform uyarı; yeni pahalı üretimi sınırla |
| Yedek yaşı | >26saat | Backup incident |
| Tenant deny anomalisi | 5dk >20 farklı kaynak denemesi | Güvenlik olay incelemesi/rate limit |

Bu alarmlar scheduler/monitoring sistemiyle uygulamada kurulacak; bu turda alarm veya otomasyon oluşturulmadı. Beklenen destek zamanı: pilot iş günleri 09:00–18:00 Europe/Istanbul; P1 için mesai içi 1 saat ilk yanıt hedefi, P2 4 iş saati, P3 1 iş günü, P4 3 iş günü. Bunlar ticari SLA değil işletim planıdır; EXT10 sorumlusu kabul etmeden müşteriye garantili süre verilmez.

## Ortamlar ve yayın

Local Supabase + sentetik seed; staging ayrı proje; prod ayrı proje ve secrets. GitHub CI service token'ı environment-scoped; prod secret PR/preview'a verilmez. Preview erişim koruması, X-Robots noindex ve sentetik veri. Tenant B1 feature flag'leri DB entitlement ile birlikte; yalnızca frontend env üzerinden açılmaz.

Release manifest: git SHA, migration listesi/checksum, paket sürümleri, schema/API sürümü, feature flags, asset manifest, içerik seed sürümü, kanıt raporu. Migration expand→backfill→read switch→contract; eski app sürümü en az bir release boyunca schema ile çalışır. Geri alma önce flag/deploy, gerekli veri düzeltmesi ayrı forward migration. Destructive migration ve cascade purge normal deployment'tan ayrıdır.

## Yedek, restore ve veri talebi

DB günlük yedek + immutable içerik/object sürümleri; asset metadata'yı yedeklemek dosyayı yedeklemek değildir. Kritik asset orijinallerinin günlük manifest/checksum ve ikinci bağımsız korumalı kopyası. Worker provider medya UID'lerini manifestte saklar. RPO≤24saat/RTO≤8saat hedefi gerçek restore tatbikatıyla ölçülür.

Restore runbook: olay scope'u → yazma dondurma → hedef yedek seçimi → izole DB restore → dosya manifest eşlemesi → Auth/üyelik/sertifika/ilerleme sayım+hash kontrolü → integration dispatch kapalı smoke test → onaylı cutover → queued idempotent replay → incident kapanışı. Yedekten dönüş silinmiş kişisel veriyi yeniden görünür yapmamalı; deletion ledger restore sonrası tekrar uygulanır.

İlgili kişi talebi: kimlik doğrula → tenant veri sorumlusuna görev → export kapsamı → diğer kişilerin verisini ayır → süreli teslim; silme talebi otomatik tüm kanıtı yok etmez, retention/hold değerlendirmesi ile gerekçeli karar. Tenant offboarding aynı pipeline'ın kurum kapsamlı hâlidir; başka tenant membership'i korunur.

## Tedarik ve ticaret

isEazy entegrasyonu lisanslı export dosyasıdır; kaynak düzenleme veya API publish senkronu satıcı sözleşmesi olmadan yok. Eğitim tedarik kaydı lisans kapsamı/sona erme/export hakkını içerir. Öğrenen/admin hiçbir altyapı sağlayıcısını ayrı yönetmek zorunda değildir; platform kendi bağlayıcılarını işletir.

G ticaret: iyzico Checkout Form üzerinden başlat → provider token server'da kaydet → callback yalnızca işaret → sağlayıcıdan ödeme sonucu doğrula → tutar/para birimi/sipariş kontrolü → entitlement transaction → eposta. İade ödeme doğrulaması + entitlement policy; ödeme kayıtları silinmez. Pazaryeri/alt satıcı settlement kapsam dışı, tek satıcı platform modeli. [iyzico dokümanları](https://docs.iyzico.com/)
