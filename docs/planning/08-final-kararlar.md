# Final plan v1.0 — bağlayıcı uygulama kararları

Tarih: 21 Eylül 2026. Bu belge v0.1'deki “öneri/açık teknik seçim” ifadelerini aşağıdaki sınırlar içinde kapatır. Planın tamamlanması, yazılımın çalıştırılmış, güvenlik testlerinin geçmiş veya müşteri/satıcı onaylarının alınmış olduğu anlamına gelmez. Bunlar adı, sorumlusu ve engellediği yayın kapısı tanımlanmış uygulama işleridir.

## Öncelik ve değişiklik yönetimi

Çelişki sırası: kullanıcının güncel talebi → bu belge → 09–15 sözleşmeleri → 01–07 ürün açıklamaları. R01–R40 kapsamı korunur. Yeni istek geldiğinde gereksinim, veri, ekran, test, maliyet ve faz etkisi birlikte güncellenir; sessiz kapsam genişletilmez. Her release ayrı kabul edilir. Sürüm sınırları “gelecekte yapılır” belirsizliği yerine iş paketlerine bağlanmıştır.

## Ürün ve yayın kararları

| Karar | Sabit başlangıç |
|---|---|
| Platform adı | Respongo Learning; çalışma markası, hukuki marka tescili iddiası yok |
| İlk tenant | Oguz Law Academy; industry `legal`, public segment `avukat`, slug `oguzlawacademy` |
| İlk URL | `https://lms.respongo.com/avukat/oguzlawacademy` |
| İlk kitle | Davetli kurum kullanıcıları; açık kayıt kapalı; dış katılımcı admin davetiyle olabilir |
| İlk kapasite | 500 kayıtlı / 100 eşzamanlı; yük test hedefi, mevcut kapasite garantisi değil |
| Dil/zaman | Türkçe varsayılan, İngilizce UI çevirileri G; i18n B1'den; Europe/Istanbul, UTC depolama |
| Arayüz | Responsive web; kurulum yapılabilir PWA B2; native/offline SCORM G sonrası |
| Kimlik | Supabase Auth, email/parola + davet, admin MFA; B2 SAML; G SCIM |
| Kurum/lisans | Tenant başına bir portal B1; çoklu üyelik; Demo/Academy/Enterprise hak setleri; parasal fiyat henüz satış teklifi değildir |
| GoAuthoring B1 | Blok editörü, yerel yayın, SCORM 1.2 tek SCO çıktı, ayrıntılı yerel quiz/eşleme/anket analitiği |
| Toplantılar | B1 link + manuel yoklama; B2 Teams/Zoom/GoToTraining ayrı gerçek adaptörler |
| Satın alma | B1 kurumsal teklif/satın alma talebi ve manuel lisans aktivasyonu; G gerçek checkout |
| Beta sosyal | Haber/kaynak/video paylaşımı, yorum ve moderasyon; B2 topluluklar ve sohbet |
| Beta rapor | Hazır rapor + filtre + export; B2 özel rapor, otomatik dağıtım, AI taslak |
| Pilot içerik | 12 onaylı içerik, 3 yol; eksik içerik sentetik demo etiketiyle test edilir, canlı başarı kanıtı olmaz |

Kullanıcı yanıtı olmayan ticari tercihleri gerçek müşteri bilgisi diye kabul etmedik; bu tablodakiler finalize talebi kapsamında uygulanabilir plan varsayılanlarıdır. Yeni bilgi gelirse ilgili karar sürümlenir. İlk beta bütün genel sürüm modüllerini aynı gün teslim etme taahhüdü taşımaz.

## Teknik seçimler

- **Web:** Next.js App Router + TypeScript + React, pnpm workspace; Tailwind ve Radix tabanlı erişilebilir bileşenler, Lucide; Zod kontratları. Grafikler Recharts, tablo TanStack Table, form React Hook Form. Major sürümler uygulama başında resmî destek/güvenlik kontrolüyle sabitlenir; `latest` floating dependency bırakılmaz.
- **Veri:** Supabase Postgres SQL migration'ları, RLS, Auth, private Storage ve Queues. İş transaction'ları dar izinli SQL RPC; normal sorgular kullanıcı JWT'siyle. ORM'nin service role ile bütün politikaları aşması yok.
- **Dağıtım:** GitHub private repo + GitHub Actions; Vercel Pro web, `fra1` server region; Supabase prod Small ve staging Micro Frankfurt. Bölge uygunluğu hesap açılışında doğrulanır. [Supabase bölgeler](https://supabase.com/docs/guides/platform/regions)
- **Worker:** Google Cloud Run Jobs `europe-west3`, 2 vCPU/4 GiB başlangıç; scheduler dakikalık kuyruk uyandırma, authenticated execution; DB job lease/fencing ana doğruluk kaynağı. Her container yürütmesinde en fazla 10 dakika iş partisi; timeout yeniden denenir. [Cloud Run bölgeler](https://docs.cloud.google.com/run/docs/locations)
- **Medya:** video için Cloudflare Stream, orijinaller ve PDF/asset için Supabase private Storage. Stream global CDN/işleme altyapısıdır; Frankfurt DB seçimi bütün verinin Almanya'da kaldığı iddiası değildir. [Stream](https://developers.cloudflare.com/stream/pricing/)
- **Eposta:** Resend Pro, platform doğrulanmış gönderici; B2 özel tenant domain. Eposta içeriğinde hassas eğitim/anket cevabı yok. [Resend](https://resend.com/pricing)
- **AI B2:** Anthropic API `claude-haiku-4-5-20251001`, yalnızca rapor şeması/anonim özet ve editörün gönderdiği taslak; maksimum 8.000 input/2.000 output token/istek, tenant başına günlük 50 istek, tenant bütçesi 10 USD/ay başlangıç. Secret yokken özellik kapalı; model başarısızlığı temel ürünü kapatmaz. Yayına alma tarihinde model destek durumu yeniden kontrol edilir. [Model kaynağı](https://platform.claude.com/docs/en/models/overview)
- **Arama B1:** Postgres full-text + normalize edilmiş Türkçe arama alanı/trigram; ayrı arama SaaS'ı yok. B2 öneriler kural/beceri açığı temelli; embedding zorunlu değildir.
- **SCORM B1:** sınırları tanımlı kendi tek-SCO 1.2 runtime ve GoAuthoring export; SCORM 2004/cmi5 engine yazımı B1 işi değildir.
- **Geniş standartlar B2/G:** SCORM Cloud API adaptörü + sağlayıcının LRS'si; 2004/multi-SCO/xAPI/cmi5 için seçilen ticari yol budur. Müşteriye Respongo içinden sunulur. Lisans/aktarım kabul edilmezse modül kapalı kalır ve ADR ile değişir; implementer kendiliğinden yeni LRS yazmaz. Sağlayıcının destek beyanı bizim tüm uyum testlerimizin geçtiği anlamına gelmez. [Rustici ürün kapsamı](https://rusticisoftware.com/products/scorm-cloud/)
- **Online ticaret G:** iyzico Checkout Form sandbox → canlı üye işyeri; ödeme kayıtları sağlayıcı webhook'u ve sunucu doğrulamasıyla. Kart verisi platforma girmez. Vergi/fatura/iade gereksinimleri işletme sahibinin kabul kapısıdır; yazılım içinde ürün/hak/ödeme ayrımı şimdiden tanımlıdır.
- **Test:** Vitest, Playwright, axe, pgTAP, k6. SAST/secret/dependency taraması GitHub iş akışında; ClamAV worker taraması ve kontrollü ZIP çıkarma.

Son madde dışındaki sağlayıcı fiyatları araştırıldı; iyzico güncel sözleşme/teklif koşulları G öncesi doğrulanacak ve satış açılmadan kayıtlı kapıya bağlanacak. Hesap açma, ücretli hizmet satın alma veya bağlantı kurma bu planlama turunda yapılmadı.

## Standartların ürün davranışı

İçerik sürümünde `runtime_profile` saklanır: `native_v1`, `scorm12_single_v1`, `rustici_scorm2004`, `rustici_xapi`, `rustici_cmi5`. Profil import sırasında seçilir ve atama sonrası sessizce değiştirilmez. `reported` paket iddiası ve `verified` sunucu değerlendirmesi aynı başarı kanıtı değildir.

GoAuthoring dışa aktarılmış paketi bağımsız kullanılabilir; orijinal video/asset lisansı dışa aktarmaya izin vermiyorsa yayın engellenir. Paket içinde uzun ömürlü LMS anahtarı bulunmaz. Harici paketin anket/soru detayları desteklediği standart ve hedef LMS'ye göre sınırlanır; yerel analytics daha zengindir.

## Üretim öncesi dış girdiler

| Kapı | Gerekli girdi / sorumlu | Yoksa yapılacak |
|---|---|---|
| EXT01 | Gerçek logo, marka ve iletişim; ürün sahibi | Metinsel demo kimliğiyle geliştirme; müşteri canlı marka yayını bekler |
| EXT02 | Domain DNS erişimi; platform işletmecisi | Local/staging geliştirme; canlı URL açılmaz |
| EXT03 | Supabase/Vercel/GitHub ve bütçe sahibi | Yerel/test kontratları; ücretli hesap otomatik açılmaz |
| EXT04 | Veri sözleşmesi, işleme/aktarım ve saklama; müşteri hukuk sorumlusu | Sentetik demo; gerçek kişisel veri yüklenmez |
| EXT05 | isEazy lisans ve örnek paket; içerik sahibi | GoAuthoring test fixture'ları; gerçek isEazy uyumu iddia edilmez |
| EXT06 | Teams/Zoom/GoToTraining hesap/izin; kurum IT | B1 link/manuel; ilgili API adaptörü production-ready işaretlenmez |
| EXT07 | SCORM Cloud lisans/aktarım; platform sahibi | B1 sınırlı profil; geniş profil özelliği kapalı |
| EXT08 | 12 içerik hakları ve uzman onayı; içerik yöneticisi | Sentetik pilot; gerçek uyumluluk sertifikası üretilmez |
| EXT09 | Ödeme üye işyeri/fatura/iade; işletme sahibi | Satın alma talebi; canlı checkout kapalı |
| EXT10 | Operasyon sorumlusu/çalışma saati; platform sahibi | Yalnızca planlı pilot; 24/7 SLA ilan edilmez |

Bu kapılar eksik mimari karar değil, tedarik/işletme girdileridir. Başarıları kanıt dosyasıyla işaretlenir; “varsayılan onay” yok. Kodlama başlangıcı kullanıcının sonraki açık talebidir; gerçek verili yayın bu kapılara ayrıca bağlıdır.
