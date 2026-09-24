# Uygulama iş paketleri ve teslim planı v1.0

Kodlamaya başlanınca iş sırası bu belgeyi izler. Tarihler bağlayıcı değil; kişi-gün aralıkları mühendislik tahminidir ve araç/ajan hızını garanti etmez. Her paket çalışma yazılımı + test + işletim notuyla kapanır.

## Bağımlılık ve efor

| Paket | Faz | İş | Bağımlılık | Kişi-gün | Sorumlu rol | Bitiş |
|---|---|---|---|---:|---|---|
| EP01 | B1 | Teknik kanıt ve monorepo | — | 8–12 | Mühendislik | tenant/RLS, SCORM wrapper ve kuyruk kanıtları |
| EP02 | B1 | Kimlik ve organizasyon | EP01 | 12–18 | Backend | davet, MFA, üyelik, scope, CSV |
| EP03 | B1 | UI sistemi ve marka | EP01 | 10–15 | UX + Frontend | beş rol shell, tema, logo/banner, responsive |
| EP04 | B1 | Portal ve lisans fabrikası | EP02,EP03 | 8–12 | Full-stack | demo/tam kurulum, entitlement, quota |
| EP05 | B1 | Katalog, asset ve runtime | EP01,EP02 | 14–22 | Backend + Frontend | upload güvenliği, video/PDF/SCORM, resume |
| EP06 | B1 | Program, atama ve uyumluluk | EP05 | 12–18 | Full-stack | sürüm, preview/apply, zorunluluk |
| EP07 | B1 | Sınav, vaka ve yetkinlik | EP05,EP06 | 12–18 | Full-stack | server grade, rubrik, claims |
| EP08 | B1 | Sertifika ve gamification | EP07 | 10–15 | Full-stack | snapshot PDF, dış belge, tekil XP |
| EP09 | B1 | GoAuthoring | EP03,EP05,EP07 | 18–25 | Full-stack | blok editörü, local publish, SCORM ZIP |
| EP10 | B1 | LXP ve sosyal temel | EP05 | 8–12 | Frontend + Backend | öneri/listeler, feed, yorum, moderation |
| EP11 | B1 | Eposta ve hazır otomasyon | EP02,EP06 | 8–12 | Backend | outbox, template, retry, preferences |
| EP12 | B1 | Destek ve bilgi bankası | EP02,EP03 | 8–12 | Full-stack | tenant/platform ticket, grant, iç not, SSS |
| EP13 | B1 | Rapor ve içerik operasyonu | EP06,EP07 | 10–15 | Backend + Frontend | report datasets, checklist, tedarik |
| EP14 | B1 | Manuel canlı eğitim | EP02,EP06 | 4–7 | Full-stack | takvim, kontenjan, kayıt, manuel yoklama |
| EP15 | B1 | Pilot sertleştirme | EP04–EP14 | 16–24 | QA + Güvenlik | UAT, yük, restore, release, açık hatalar |
| EP16 | B2 | Canlı API, SSO ve kurum bağlayıcıları | EP15 | 18–28 | Backend | Teams/Zoom/GoTo, SAML, venue/equipment |
| EP17 | B2 | Rapor/workflow/AI ve sosyal genişleme | EP15 | 20–32 | Full-stack | builder, schedule, push, chat, anonymous forms |
| EP18 | B2 | Geniş öğrenme standartları | EP15 + EXT07 | 10–18 | Backend | SCORM Cloud + xAPI/LRS profile, 2004 |
| EP19 | G | Ticaret ve kurumsal ölçek | EP16–EP18 | 25–45 | Ürün + Mühendislik | checkout, SCIM/HRIS, özel roller/domain, kapasite |
| EP20 | S | Otelcilik paketi | EP15 | 8–15 | Ürün + İçerik | şablon/terminoloji/vardiya/işbaşı akışı |

B1 mühendislik/QA temel tahmini **158–237 kişi-gün**. Hukuk içerik üretimi/uzman onayı 20–35 ve ayrıntılı UX/asset tasarımı 12–18 kişi-gün ayrıca; gerçek katalog satın alımı bu eforu azaltabilir, lisans maliyetini artırabilir. İki full-stack, yarı zamanlı QA ve yarı zamanlı tasarım/içerik koordinasyonu varsayımıyla bağımlılıklar ve geri bildirim dahil yaklaşık 16–24 hafta planlama bandı kullanılır; takvim taahhüdü değildir. Tek uygulayıcıda süre bu ekip varsayımından türetilmez.

## İlk uygulama dilimleri

1. EP01: proje/araç sürümleri, iki tenant fixture, RLS negatif test, package runtime tehdit testi, tek job retry kanıtı. Çıkış: teknoloji riskleri ve ölçüm kanıtı; henüz müşteri yayını yok.
2. EP02–EP04: davet → role giriş → markalı portal. Çıkış: sentetik tenant onboarding.
3. EP05–EP08: eğitim yükle → ata → öğren → değerlendir → belge/XP. Çıkış: tek gerçek uçtan uca dikey dilim.
4. EP09–EP14: üretim stüdyosu ve bütün rol operasyonları. Çıkış: müşteri kabul senaryoları çalışıyor.
5. EP15: test/güvenlik/restore/içerik kapıları; kontrollü pilot. Çıkış: imzalı release manifest ve bilinen limitler.
6. B2/G/S: feature flag ile tenant bazlı açılım, her modülün EXT girdisi tamamlandığında kendi kanıt seti.

Her iş paketi beş alt görev olarak açılır: (a) veri+izin, (b) domain/API, (c) UX durumları, (d) kabul/negatif test, (e) release/operasyon. Tek dev PR'a bütün SaaS doldurulmaz; PR mümkün olduğunca tek davranış kümesini içerir.

## Gereksinim izlenebilirliği

[requirements-traceability.csv](contracts/requirements-traceability.csv) her R01–R40 satırını faz, ana paket, ekran aileleri, testler ve somut kabule bağlar. Bir modülün sonraki sürüm ayrıntıları 02 kapsam tablosundadır. İlk teslim eşlemesi sonraki geliştirmeyi silmez.

Teslim panosu durumları: planned → ready → in_progress → review → verified → released. "Verified" için kabul kanıtı URL/dosya, tester ve tarih gerekir. Bu planlama sırasında bütün uygulama paketleri **planned** durumundadır.

## Riskli işlerin hata politikası

- SCORM fixture başarısızsa destek profili genişletilmez; EP01 bulgusu ADR'ye işlenir, içerik doğru profille yeniden test edilir.
- Provider hesap/izin yoksa adaptör testleri mock olarak işaretlenir; gerçek entegrasyon kabulü geçmez.
- İçerik/marka eksikse sentetik demo; gerçek kullanıcıya sahte sertifika/kurum onayı yok.
- RLS, progress veya ödeme bütünlüğü hatası varsa ilgili release durur. Kozmetik hata önemine göre kayıtla ertelenebilir, kritik akış erişilebilirliği ertelenmez.
- Kapsam artışı R/EP/test/maliyet matrislerini birlikte değiştirir; takvim aynıymış gibi tutulmaz.

## Asset ve içerik tesliminin iş paketlerine bağlanması

04'teki her varlık üretim kaydı `planned / in_design / review / approved / exported` durumlarıyla izlenir. B1 marka/logolar ve beş rol shell EP03; 12 kapak ve oynatıcı EP05; 12 rozet ve 3 sertifika EP08; yazar şablonları EP09; 14 eposta şablonu EP11; SSS ve empty state EP12. Video kaynakları/altyazılar LEG01–LEG12 içerik sahiplerine atanır. Asset registry lisans/alt metin/boyut/format/onay olmadan approved olamaz.

Özel kişisel görev ataması henüz yapılmadı; sorumlular fonksiyonel rollerdir. Proje başlatılırken bu rolleri üstlenen kişiler release sorumluluk kaydına yazılır.
