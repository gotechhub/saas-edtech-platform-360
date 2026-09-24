# Deneyim, ekran ve görsel varlık planı

> v1.0 baz çizgisi, 21 Eylül 2026. Nihai teknik seçim ve faz sınırları için [08 — Final kararlar](08-final-kararlar.md), uygulama sözleşmeleri için 09–14 geçerlidir.

Bu belge tasarım spesifikasyonudur; henüz yüksek çözünürlüklü tasarım, ikon seti veya marka görseli üretilmedi. Rakip görselleri ve kişisel veriler yeni ürün varlığı olarak kullanılmaz.

## Tasarım yönü

Netflix'ten alınacak ilke: az karar, güçlü içerik görseli, belirgin “Devam et”, kolay keşif. Öğrenenin zorunlu eğitimlerini sonsuz akışa gömmeyiz. Admin için aynı kalite korunur ancak işlevler görev listesi, okunabilir tablo, toplu işlem ve kılavuzlu kurulumla sunulur.

Önerilen hukuk görsel dili: koyu lacivert, sıcak nötr yüzeyler, ölçülü altın vurgu; başarı için yeşil, uyarı amber, hata kırmızı. Altın renk uzun metin veya düşük kontrastlı buton metni olarak kullanılmaz. Marka renkleri henüz Oguz Law Academy'nin onaylı kimliği değildir.

Türkçe destekli tek sans-serif aile (öneri Inter, lisansı kaydedilecek), 8px aralık sistemi, 16px taban metin, 12/16px köşeler; yoğun admin tablosunda minimum okunabilir satır ve odak göstergesi. İkonlar tek SVG ailesi (öneri Lucide); karışık stroke/dolgu ve emoji tabanlı menü yok.

Tema: sistem/açık/koyu; tenant renkleri semantik tokenlara uygulanır. Learner tercihi tenant varsayılanını geçersiz kılabilir. Marka rengi kontrastı sağlamıyorsa erişilebilir eşleşme önerilir; kullanıcıya okunamayan kombinasyon yayımlatılmaz. Hedef [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/); yalnızca otomatik tarama ile uyum ilan edilmez.

## Rol bazlı bilgi mimarisi

| Rol | Birincil menü | İkincil alanlar |
|---|---|---|
| Learner | Ana sayfa, Öğrenmem, Keşfet, Topluluk, Takvim | Öğrenmem: yollar/uyum/sertifika; Profil: beceri/başarı/tercih; sürekli Destek düğmesi |
| Instructor | Çalışma alanım, Eğitimlerim, Oturumlar, Değerlendirme, Sorular | İçerik revizyonu, rubrik, anket sonuçları, katılım |
| Line manager | Ekip özeti, Gelişim, Onaylar, Raporlar | Eğitim talebi, dış sertifika, ekip hedefi, duyuru |
| Admin | Genel bakış, İnsanlar, Öğrenme, İçerik stüdyosu, Etkileşim, Analiz, Yönetim | Öğrenme: katalog/yol/uyum/canlı eğitim; stüdyo: GoAuthoring/kaynak/ihtiyaç; yönetim: marka/entegrasyon/bildirim/destek |
| Super admin | Operasyon, Portallar, Sektör paketleri, Ürünler ve lisanslar, Sistem şablonları, Destek merkezi, Platform | Güvenlik/audit, entegrasyon sağlığı, işler/kotalar, faturalama, sürüm/feature flag |

Üst çubuk: arama, bildirim, yardım, profil; çoklu role sahip kullanıcıda çalışma alanı seçimi. Yönetim masaüstünde kalıcı sol menü ve breadcrumb; mobilde uygun çekmece. Learner mobil alt menü en fazla beş öğe. Yetkisiz alanlar yalnızca gizlenmez, doğrudan URL'de de korunur.

## Dashboardlar

| Rol | Öncelik sırasıyla widget'lar | Ana eylem |
|---|---|---|
| Learner | Devam et; yaklaşan zorunlular; kişisel yol; yaklaşan oturum; ilgili kısa içerik; hedef/rozet; topluluk özeti | Öğrenmeye devam et |
| Instructor | Bugünkü oturum; değerlendirilecek yanıt; cevap bekleyen soru; güncellenecek ders; sınıf ilerlemesi | Öncelikli işi tamamla |
| Manager | Geciken/yaklaşan zorunluluklar; onay kuyruğu; ekip gelişimi; yetkinlik açıkları; eğitim talepleri | İlgili kişiye/işe müdahale |
| Admin | Kurulum hazırlığı; eylem kuyruğu; atama/uyum; içerik eksikleri; yaklaşık aktif kullanıcı; yaklaşan etkinlik; destek; gönderim/entegrasyon sorunu | Eksik adımı tamamla |
| Super admin | Portal sağlığı; demo dönüşümleri; açık kritik talepler; başarısız işler; maliyet/kota; aktif portal/kullanıcı eğilimi; güvenlik olayları | Etkilenen portalı/işi incele |

Her widget'ta boş/yükleniyor/hata/yetki yok/veri eski durumları; son güncelleme ve filtre bağlamı bulunur. Boş grafiğe sahte sayı verilmez. “Aktif kullanıcı” gerçek zamanlı garanti değil, ölçüm tanımıyla yaklaşık değer olarak sunulur.

## Kritik ekran envanteri

Her satır bir ekran ailesidir; detail/create/edit durumları gerektiğinde aynı tasarım kalıbını paylaşır.

| ID | Aile | Kritik tasarım koşulu |
|---|---|---|
| UX01 | Markalı giriş, davet kabulü, parola yenileme, MFA | Yanlış portal/davet süresi/SSO hatası için kurtarma yolu |
| UX02 | İlk giriş ve kısa onboarding | Aydınlatma/izin ayrımı; role göre 3–5 adım, sonra devam edebilme |
| UX03 | Learner ana sayfa ve arama | Zorunlular görünür; tek ana devam eylemi; farklı içerik türü işaretleri |
| UX04 | Katalog ve eğitim detay | Süre, seviye, dil, eğitmen, önkoşul, kazanım, lisans/erişim durumu |
| UX05 | Öğrenme yolu haritası | Gerekli/seçmeli, kilit nedeni, tamamlanan, geciken, sıradaki |
| UX06 | Video/PDF/SCORM/yerel içerik oynatıcı | Not, transkript/altyazı, ilerleme, kaydetme durumu, bağlantı kopması |
| UX07 | Sınav ve vaka teslimi | Süre, kalan deneme, gönderim onayı, geri bildirim politikası |
| UX08 | Profil, yetkinlik ve sertifikalar | Öz beyan/onaylı kanıt ayrımı, dış belge yükle/onay durumu |
| UX09 | Akış, topluluk, gönderi, sohbet | Raporla/engelle, yorum görünürlüğü, gizlilik ve moderasyon |
| UX10 | Takvim ve oturum detayı | Saat dilimi, kayıt/iptal, katıl, kontenjan, yoklama durumu |
| UX11 | Destek liste/detay/yeni talep | Ek dosya, mesaj görünürlüğü, aktarıldı durumunun anlaşılması |
| UX12 | Admin kurulum ve marka stüdyosu | Masaüstü/mobil + açık/koyu önizleme; taslak/yayın ayrımı |
| UX13 | Kullanıcılar, organizasyon, CSV import | Alan eşleştir, önizle, hatalı satırı düzelt, sonuç indir |
| UX14 | Eğitim/program editörü | İçerik ekle, yeniden sırala, zorunluluk, önkoşul, sürüm yayınla |
| UX15 | Toplu atama ve uyum kuralı | Önce kimin etkilendiğini göster; sonra atama ve bildirim planı |
| UX16 | İçerik ihtiyaç/üretim merkezi | Sahip, son tarih, eksik asset, lisans, inceleme, hazır yüzdesi |
| UX17 | GoAuthoring proje/editör/önizleme/yayın | Otomatik kayıt, sürüm çakışması, erişilebilir blok, yayın kontrolü |
| UX18 | Sertifika editörü | Alanlar, güvenli alan, uzun ad testi, QR, PDF önizleme |
| UX19 | Rapor kataloğu/oluşturucu/dağıtım | Metrik tanımı, filtre, zamanlama, alıcı, yetki ve veri güncelliği |
| UX20 | Bildirim ve workflow stüdyosu | Olay/koşul/eylem, örnek kullanıcıyla simülasyon, gönderim geçmişi |
| UX21 | Eğitmen değerlendirme çalışma alanı | Kuyruk, rubrik, kayıt taslağı, geri bildirim, itiraz |
| UX22 | Ekip gelişimi ve onaylar | Sadece yetkili kapsam; kişi ve ekip kırılımı |
| UX23 | Super admin portal kurulum/detay | Sektör/paket/marka/limit, kurulum işi, demo → tam dönüşüm |
| UX24 | Platform destek/olay merkezi | Kurumlar arası kuyruk, iç not, SLA, izinli teşhis, audit |
| UX25 | Ürün/deneme/satın alma | Mevcut haklar, deneme bitişi, kota, talep/gerçek ödeme ayrımı |
| UX26 | Platform sağlık/güvenlik/işler | Kuyruk yeniden deneme, portal kapatma etkileri, audit, maliyet |

Ekran tasarımında 360/390, 768, 1280, 1440 ve 1920px kontrol edilir. Learner içerik alanı yaklaşık 1440px maksimum, yönetim tabloları 1920px'e uyumlu; ultrawide ekranda metin satırları sınırsız uzamaz. Zoom %200, klavye, ekran okuyucu ve yüksek kontrast durumları kontrol edilir.

## Temel bileşenler

App shell, rol seçici, command search, içerik kartı, devam kartı, journey step, veri tablosu, filtre çekmecesi, toplu eylem çubuğu, görev kutusu, timeline, metric card, empty state, toast/inline alert, wizard, upload/progress, approval drawer, consent panel, certificate canvas, block palette, activity feed, ticket thread, audit viewer.

Tabloda filtre URL'ye yansır; filtre temizle belirgin olur. Form değişiklikleri kaybolmadan uyarı; autosave görünür durum; silme etkisi önizlenir. Başarı toast'ı erişilebilir canlı bölgeye duyurulur; hata yalnızca renkle anlatılmaz.

Animasyon: mikro geçiş 150–220ms, kazanım 400–700ms; tüm ekranı durduran efekt yok. `prefers-reduced-motion` destekli. Düşük donanımda pahalı blur/video arka plan kapalı. Otomatik ses veya zorunlu arka plan videosu yok.

## Asset klasör tasarımı

Planlanan klasörler; henüz üretim asset'i oluşturulmadı:

```text
assets/
  brand/platform/{logos,wordmarks,favicons}
  industry-packs/legal/{heroes,covers,illustrations,badges}
  industry-packs/hospitality/{heroes,covers,illustrations,badges}
  templates/login/{editorial,split,immersive}
  templates/banners/{announcement,journey,event}
  templates/certificates/{classic,modern,minimal}
  templates/email/{system,learning,support}
  ui/{icons,empty-states,onboarding,achievement}
  motion/{completion,badge,progress}
  demo/{synthetic-avatars,course-covers,sample-documents}
  manifests/{asset-registry,licenses,production-backlog}
```

Müşteri yüklemeleri repo'ya konmaz; özel Storage'da tenant bazlı tutulur. Kaynak dosya, yayımlanmış türev ve sürüm ayrılır. Her asset: ID, amaç, sektör, sahip, lisans/kaynak, üretim aracı, boyut, format, alt metin, light/dark varyant, odak noktası, sürüm ve onay durumu.

## İlk üretim listesi

| Varlık | Başlangıç miktarı | Teknik/art direction ölçütü |
|---|---:|---|
| Platform logo kilidi | 3 varyant | Yatay, kompakt, tek renk; SVG + PNG fallback; marka adı kullanıcıyla kilitlenecek |
| Müşteri logo uygulaması | 4 görünüm | Açık/koyu header, login, sertifika; gerçek logo müşteri girdisi |
| Login şablonu | 3 | Editorial, split, immersive; mobil crop ve görselsiz fallback |
| Hukuk hero görseli | 4 | Öğrenme/mentorluk/vaka/mesleki gelişim; 2400×1000 kaynak, ayrı mobil crop |
| Eğitim kapak şablonu | 6 | 16:9 1280×720; başlık görüntüye gömülmez, UI katmanında |
| Pilot eğitim kapağı | 12 | Onaylı ders listesine göre; klişe tokmak tekrarına dayanmayan tutarlı görsel dil |
| Menü/işlem ikonları | 40–60 eşleme | Tek aile 20/24px; aria-label, lisans ve ikon sözlüğü |
| Empty state çizimi | 10 | Eğitim, arama, rapor, destek, kullanıcı, bildirim, hata, erişim, bakım, başarı |
| Onboarding çizimi | 5 | Rol/ilgi/hedef/ilk eğitim/başlangıç tamam |
| Rozet | 12 | SVG, 64–512px; kilitli/kazanılmış durum ve metin açıklaması |
| Sertifika taslağı | 3 | A4 yatay; basılabilir PDF, uzun Türkçe ad, QR ve imza alanları |
| Eposta taslağı | 14 | Davet, reset, atama, yaklaşan/geciken, tamamlandı, belge, oturum, iptal, destek ve deneme |
| Mikro animasyon | 3 | Tamamlama, rozet, hedef; reduced-motion statik karşılık |
| Sosyal şablon | 4 | Haber, kaynak, kısa video, etkinlik; 1:1/16:9/9:16 varyant |

Web görsellerinde AVIF/WebP + uygun fallback, responsive boyut ve lazy loading; hero için öncelikli yükleme. SVG içinde script/uzak referans yok. Eposta HTML'si ayrı istemci testinden geçer; UI komponentini doğrudan epostaya kopyalama yok.

## Logo/banner ve sertifika editörleri

- Logo: yükle → güvenlik kontrolü → arka plan/kontrast önizleme → sığdır/ölçek → güvenli boşluk → yayınla. En-boy oranı korunur, kaynak dosya üzerine yazılmaz.
- Banner: başlık, açıklama, CTA, görsel, odak noktası, hedef kitle, tarih ve öncelik. Dar ekran önizlemesi zorunlu; metin görselin okunamayan bölümüne gömülmez.
- Sertifika B1: onaylı üç şablonda logo, imza görseli, metin/alan ve renk düzenleme; serbest tasarım B2. Yayınlanan şablon değişmez. Üretilen PDF template version, belge ID ve kazanım snapshot'ını taşır.
- Tasarım aracı gerçek e-imza/akreditasyon sağlayıcısı değildir. İmza görseli ve elektronik imza farklı özellikler olarak adlandırılır.

## Tasarım kabulü

Nihai UI üretiminde beş rolün ana ekranı ve üç uçtan uca akış ayrıntılandırılır: ilk öğrenme, içerik üretip atama, destek aktarımı. İlk müşteriyle en az beş temsilî kullanıcı görevleri yardımsız dener; başarısız adımlar revize edilir. Beş rol için etkileşimli kavramsal önizleme ve otomatik tarayıcı kontrolleri üretildi (research/preview-validation.json). Gerçek müşteri kullanılabilirlik araştırması ve nihai görsel kalite kabulü uygulama fazında yapılır.
