# Teslimat ve kabul planı — v1.0

Tarih: 21 Eylül 2026. Planlama baz çizgisi kapatıldı; uygulama geliştirmesi başlamadı. Bu belge çalıştırılmış test raporu değildir.

## Teslim sırası

1. Teknik kanıtlar: tenant izolasyonu, SCORM 1.2 import/export, isEazy örnek paket, kuyruk ve worker.
2. B1: EP01–EP15; SaaS temeli → öğrenme çekirdeği → rol deneyimleri → GoAuthoring → pilot sertleştirme.
3. B2: EP16–EP18; sağlayıcı API'leri, SSO, gelişmiş sosyal/AI/raporlama ve geniş standart desteği.
4. G: EP19; ticaret ve kurumsal ölçek. S: EP20; otelcilik ve sektör paketleri.

Kesin bağımlılıklar, görev sahipleri, tahminler ve kabul çıktıları [iş paketlerinde](14-is-paketleri.md); teknik seçimler [final kararlarında](08-final-kararlar.md); maliyet ve işletim [13 numaralı belgede](13-maliyet-ve-isletim.md) tutulur. B1 için 158–237 mühendislik kişi-günü tahmini, içerik ve tasarım emeğinden ayrıdır. Takvim taahhüdü değildir.

## Plan kapanışı ve yayın ayrımı

Kapsam/fazlar, veri sözlüğü, izinler, API, ekran davranışları, asset üretim planı, sağlayıcı seçimleri, maliyet senaryoları ve kabul tasarımı tamamlandı. Kapalı portal, 500 kayıtlı/100 eşzamanlı kullanıcı ve marka çalışma adı plan varsayımlarıdır; müşteri teyidi gibi sunulmaz.

Gerçek hesaplar, içerik hakları, marka dosyaları, sözleşmeler, aktarım değerlendirmesi ve entegrasyon lisansları EXT01–EXT10 yayın kapılarıdır. Sentetik verili geliştirmeye engel olmayan bu girdiler, ilgili canlı özelliği açmadan sağlanır. Ayrıntı: [final kontrol](15-final-kontrol.md).

## Pilot kabul testleri

| Test | Senaryo | Geçme ölçütü |
|---|---|---|
| T01 | Tenant A kullanıcı token'ı ile B kaydı/dosyası/raporu/arama/realtime/API | Hiçbir veri sızıntısı; uygun 403/404, audit; service/worker yolları da test |
| T02 | Öğrenen not/puan/rol/tenant payload'ını değiştirir | Sunucu reddeder; kayıtlarda yükselme yok |
| T03 | Manager kapsamı ve instructor atanmış sınıf | Yalnızca izinli ekip/sınıf; transfer/rol iptali hemen etkili |
| T04 | Portal kurulum isteği iki kez / ara adımda hata | Tek tenant ve tek davet; güvenle devam/geri alma |
| T05 | Davet → onboarding → yol → sınav → sertifika | Beş rol arasında uçtan uca tutarlı görünüm |
| T06 | SCORM resume, score, status, süre, interactions, ağ kesintisi | Fixture beklenen değerleriyle eşleşir; kayıt onayı doğru |
| T07 | Yayın sonrası kurs/program sürümü değişir | Eski atama/kanıt değişmez; taşıma yalnızca açık işlem |
| T08 | Aynı completion/webhook/job 10 kez teslim edilir | Tek tamamlanma/sertifika/XP; bildirim tekrar yönetimi |
| T09 | Quiz eşiği, deneme limiti, süre, açık uçlu rubrik | Sunucu puanlar; geçme/tamamlama ayrımı doğru |
| T10 | Sertifika süresi dolumu/iptal/dış belge reddi | Güncel durum ve geçmiş kanıt doğru; doğrulama sayfası minimum veri |
| T11 | ZIP traversal/bomb, SVG script, kötü ek, HTML XSS, URL SSRF | Karantina/reddetme; sunucu/başka tenant etkilenmez |
| T12 | GoAuthoring quiz/anket/eşleme yayınla ve tekrar aç | Olaylar doğru version/attempt'a bağlı, sonuç raporda görülür |
| T13 | Dışa verilen SCORM bağımsız doğrulanmış LMS'de | Başlatma, resume, completion ve score gerçekten çalışır |
| T14 | Provider duplicate/geç/sırasız event, guest, rate limit, token iptali | Yanlış yoklama yok; uzlaştırma ve hata görünümü |
| T15 | Anonim anket ve küçük grup raporu | Bireysel yanıtla kimlik ilişkilendirilemez; eşik altı sonuç gösterilmez |
| T16 | Rapor zamanlama, yetkisi kaldırılan alıcı, tekrar cron | Yetkisiz indirme/gönderim yok; tek planlı işlem |
| T17 | Ticket learner/admin/platform iç notları ve ekler | İç not sızıntısı yok; aktarım/audit doğru |
| T18 | Açık/koyu, mobil/desktop, %200 zoom, klavye, reduced motion | Kritik akışlarda WCAG hedefi; görünür odak/kontrast/erişilebilir alternatif |
| T19 | 500 kayıt/100 eşzamanlı önerilen pilot yükü | Ölçülmüş performans hedefleri; rapor işleri öğrenmeyi kilitlemez |
| T20 | DB ve dosya yedeğinden temiz ortama restore | Hedef RPO/RTO içinde tutarlı belge ve progress; işlem tutanağı |
| T21 | AI yetki dışı rapor ve prompt injection isteği | Yetki genişlemez; hatalı metrik uydurulmaz, fallback çalışır |
| T22 | Demo süresi/lisans bitişi ve satın alma durumu | Veri silinmez; özellik hakları server'da doğru; ücretliymiş gibi davranmaz |
| T23 | İkinci sektör/tenant kurulumu | Hukuk kelimeleri kod sabiti değil; veri/tema/mesaj izolasyonu korunur |
| T24 | Kullanıcı ayrılır, yeniden katılır, iki tenantı vardır | Doğru üyelik kapanır; diğer tenant ve tarihsel kanıt etkilenmez |

| T25 | Mekân/ekipman rezervasyonu ve maliyet | Çakışan rezervasyon atomik reddedilir; iptal kapasiteyi serbest bırakır; maliyet yalnızca yetkiliye görünür |
| T26 | Bilgi bankası arama ve ticket önerisi | Rol/tenant dışı taslak ve makale görünmez; yayımlanan sürüm ve çözüm bağlantısı doğru |
| T27 | Geçmiş eğitim ve sertifika importu | Önizleme, satır hatası, tekrar import ve kanıt kaynağı korunur; kendiliğinden XP üretilmez |
| T28 | Hatırlatma, tercih ve iptal | Atama iptali/tamamlanması bekleyen hatırlatmayı durdurur; zorunlu/isteğe bağlı mesaj politikası ve zaman dilimi doğru |
| T29 | Sipariş, ödeme callback, iade | İmza/tutar/para birimi doğrulanır; tekrarlı callback tek hak üretir; iade mutabakatı ve erişim kararı audit edilir |

B1 için yalnızca B1 özelliklerinin testleri yürütülür; sonraki faz testleri “geçti” sayılmaz. Teknik test araçları: domain için Vitest; DB/RLS için pgTAP/Supabase test; UI için Playwright ve axe; yük için k6; restore ve içerik uyumu için kayıtlı senaryo seti. Uygulama olmadığı için bu testler henüz çalıştırılmadı.

UAT pilot seti: 2 sentetik tenant, 1 super admin, 1 destek operatörü, 2 kurum admini, 2 eğitmen, 2 manager, 20 sentetik learner; ardından müşteri onaylı sınırlı gerçek kullanıcı. En az 3 yol, 1 zorunlu atama döngüsü, 1 dış sertifika, 1 vaka değerlendirmesi, 1 canlı oturum ve 1 üst desteğe aktarım.

Yayın engelleyici: tenant sızıntısı, rol yükseltme, ilerleme kaybı, yanlış zorunlu başarı/sertifika, tekrarlı ücret/puan, iç destek notu ifşası, doğrulanamayan restore. Kritik/yüksek güvenlik açığı kapatılmadan pilot gerçek veriye açılmaz.


## Değişiklik yönetimi

Yeni gereksinimde R kaydı, EP kapsamı, UX akışı, veri/API etkisi, güvenlik, maliyet ve kabul testleri birlikte güncellenir. Başarısız teknik kanıt mimari karar kaydına işlenir; uyumluluk iddiası daraltılmadan başarısız entegrasyon yayımlanmaz. Kritik/yüksek açık, izolasyon kaybı veya geri yükleme başarısızlığı yayın engelidir.
