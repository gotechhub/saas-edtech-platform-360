# Respongo Learning / Oguz Law Academy — final plan

**v1.0 · 21 Eylül 2026 · Planlama tamamlandı.** Sonraki kullanıcı talebiyle uygulama başladı; güncel durum [uygulama kaydındadır](../implementation/STATUS.md). Bu dosyalar planlama baz çizgisini korur.

İlk portal: `https://lms.respongo.com/avukat/oguzlawacademy`. Hukuk sektörüne özel LMS + LXP + gamification çekirdeği; aynı mimaride sonraki sektör paketleri. İlk beta davetli kurum portalı ve 500 kayıtlı/100 eşzamanlı kullanıcı hedefiyle planlandı. Bunlar müşteri teyidi yerine geçen bilgiler değil, açık plan varsayımlarıdır.

## Önce okunacaklar

- [Final kararlar ve dış bağımlılıklar](08-final-kararlar.md): teknoloji, sağlayıcılar, faz sınırları ve EXT01–EXT10.
- [Uygulama iş paketleri](14-is-paketleri.md): 20 paket, bağımlılık, sorumlu ve efor.
- [Final kontrol tutanağı](15-final-kontrol.md): tamamlanan plan, gerçek doğrulama kanıtları ve canlı yayın kapıları.

## Planın tamamı

| Belge | İçerik |
|---|---|
| [01 Araştırma](01-arastirma.md) | Rakipler, resmî kaynaklar, referans ekranlar ve farklılaşma |
| [02 Ürün kapsamı](02-urun-kapsami.md) | R01–R40, roller, modüller ve sürüm sınırları |
| [03 Mimari](03-mimari.md) | SaaS, tenant izolasyonu, servisler ve güvenlik |
| [04 Deneyim ve asset](04-deneyim-ve-assets.md) | UX01–UX26, dashboardlar, tema, ikon ve görsel üretimi |
| [05 Entegrasyon ve GoAuthoring](05-entegrasyon-ve-goauthoring.md) | SCORM/xAPI, isEazy, toplantılar, yazarlık ve AI |
| [06 Sektör ve akışlar](06-sektorler-ve-akislar.md) | Hukuk, otelcilik, içerik hazırlığı ve iş akışları |
| [07 Teslimat ve kabul](07-teslimat-ve-kararlar.md) | 29 kabul senaryosu, UAT ve yayın engelleri |
| [08 Final kararlar](08-final-kararlar.md) | Bağlayıcı plan tercihleri ve dış girdiler |
| [09 Veri sözleşmesi](09-veri-sozlesmesi.md) | Tablolar, alanlar, ilişkiler, durumlar ve saklama |
| [10 Yetki ve tehdit modeli](10-yetki-ve-tehdit-modeli.md) | Roller, kapsamlar, destek erişimi ve SEC senaryoları |
| [11 API ve olay sözleşmesi](11-api-ve-olay-sozlesmesi.md) | İstekler, olaylar, tekrar güvenliği ve raporlar |
| [12 Ekran ve akış sözleşmesi](12-ekran-akis-sozlesmesi.md) | Rol görevleri, ekran davranışları ve hata durumları |
| [13 Maliyet ve işletim](13-maliyet-ve-isletim.md) | Üç maliyet senaryosu, yedekleme, alarmlar ve destek |
| [14 İş paketleri](14-is-paketleri.md) | EP01–EP20 uygulama sırası ve kabul çıktıları |
| [15 Final kontrol](15-final-kontrol.md) | Plan kapanışı ve kanıt sınırları |

## Makine tarafından okunabilir sözleşmeler

- [Gereksinim izlenebilirliği](contracts/requirements-traceability.csv)
- [İzin matrisi](contracts/permissions.csv)
- [OpenAPI 3.1 çekirdek sözleşmesi](contracts/openapi.json)
- [Statik plan doğrulama sonucu](research/plan-validation.json)
- [Kavramsal rol önizlemesi kontrolü](research/preview-validation.json)

## Uygulamaya geçiş

İlk geliştirme EP01 teknik kanıtlarla başlar. B1 kullanılabilir beta, B2 gelişmiş entegrasyonlar, G genel ticari sürüm, S sektör ölçeklemesidir. Gerçek içerik hakları, hesaplar, sözleşmeler ve müşteri kabulü ilgili yayın kapılarında sağlanır. Planın kapanması testlerin geçtiği veya sistemin yayında olduğu anlamına gelmez.

Kullanıcının güncel talebi önceliklidir; ardından 08, sonra 09–15 sözleşmeleri, sonra 01–07 açıklamaları gelir. Değişikliklerde gereksinim, iş paketi, ekran, veri/API, güvenlik, maliyet ve kabul ölçütü birlikte güncellenir.
