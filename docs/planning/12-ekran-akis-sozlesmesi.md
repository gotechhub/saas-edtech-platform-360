# Ekran ve durum sözleşmesi v1.0

26 ekran ailesi 04'teki görsel planı uygular. Burada kullanıcı eylemi, veri kaynağı, hata/kurtarma ve kabul davranışı sabittir. İnteraktif rol önizlemesi sentetik tasarım örneğidir; kullanıcı araştırması ve çalışan yazılım kanıtı değildir.

## Ortak ekran durumları

Her veri ekranı: loading (yer tutucu, 300ms altında parıltı yok), loaded, empty (tek açıklama + yetkili sonraki eylem), filtered_empty (filtre temizle), error (trace + tekrar dene), forbidden (güvenli geri dönüş), offline (son veri ve kaydedilemeyen değişiklik), stale (as_of) durumlarını uygular. 404 tenant/kaynak ayrıntısı ifşa etmez.

Form: pristine → dirty → validating → submitting → saved veya field_error/conflict. Submit sırasında tekrar tıklama kapalı, sunucu idempotent. Autosave'de “Kaydediliyor / Kaydedildi / Bağlantı bekleniyor”; hata durumunda gerçekte kaydedilmemiş değişiklik başarı göstermez. Modal kapatma, geri, refresh ve tenant switch dirty state'te aynı davranış. Draftlar doğru tenant altında kalır.

Toplu işlem öncesi etki sayısı, hariç tutulanlar ve bildirim sayısı; işlem sırasında job progress; sonunda başarılı/atlanan/hatalı satır özeti ve yalnızca hata satırını tekrar deneme. Kırmızı metin tek hata ipucu değildir. Her liste filtre/sıralama/sayfa durumunu URL'de tutar; kişisel veriler URL query'ye yazılmaz.

## Rol ana ekranlarının yerleşimi

### Learner

Üstte logo + arama + bildirim/profil. Birincil sıra: selamlama ve hedef; büyük devam kartı (eğitim adı, sıradaki adım, süre, ilerleme, tek CTA); yanında yakın tarihli zorunlu görevler. İkinci sıra: kişisel yol. Üçüncü sıra: role/ilgiye uygun 4–6 içerik. Alt sıra: yaklaşan canlı oturum ve topluluk özeti. İlk ekranda autoplay video yok.

Devam kartı boşsa atanmış ilk eğitim; hiç atama yoksa ilgi seçimi + katalog. Tüm zorunlular tamamlandıysa başarı mesajı ve seçmeli gelişim; sahte eksik görev yaratılmaz. Kilitli adımda neden ve gereken önkoşula link.

### Admin

Sol menü + üstte kurum/arama/yardım. Üst sıra “Bugün” iş kuyruğu ve birincil “Eğitim ata”. Sonraki sıra dört sayı: aktif öğrenen, yaklaşan/geciken atama, hazır içerik, açık destek. Ardından içerik hazırlık listesi + atama ilerlemesi. Altta entegrasyon/eposta sağlığı. İlk kullanımda kurulum checklist'i ana bölüm; boş grafikleri göstermeye çalışmaz.

### Instructor

Günün oturum kartı → notlanacak teslimler → yanıt bekleyen sorular → kendi eğitimlerinin güncelleme işleri. Değerlendirme iki sütun: solda öğrenci teslimi, sağda rubrik + geri bildirim + kaydet/yayınla. Not taslağı learner'a görünmez; yayın sonrası amendment gerekir.

### Manager

Öncelikli ekip eylemleri → bekleyen onaylar → kişi listesi (gereksinim/gelişim/son aktivite) → beceri açığı özeti. Kişi detayında eğitim geçmişi/uyum; özel mesajlar, anonim anket, sınav doğru cevap anahtarı yok. Önerilen eğitimde “Öner / Talep et”; doğrudan zorunlu atama tenant admin yetkisidir.

### Super admin

Platform sağlık bandı → portal filtre/listesi → destek ve kuyruk sorunları → kullanım/kota. “Portal oluştur” 6 adımlı wizard. Portal detayında Genel bakış / Modüller / Marka / Kullanım / Destek / Audit. Öğrenen verisini görmek için ilgili ticket ve süreli scope açılır; normal portal detayında gereksiz kişisel veri yok.

## Ekran → komut → kurtarma eşlemesi

| UX | Ana eylem / veri | Hata ve tamamlanma |
|---|---|---|
| 01 Giriş | Davet kabul, Auth SDK, MFA | Süresi dolan davette yeni davet talebi; yanlış kimlikte güvenli hesap değiştir |
| 02 Onboarding | Legal version kayıtları, profile.manage, ilgi seçimi | Zorunlu işleme aydınlatması ile isteğe bağlı rıza ayrılır; sonraki girişten devam |
| 03 Ana sayfa | Yetkili read model: assignment + next step + due + suggestions | Empty/stale/suspended; devam CTA doğrudan launch değil önce enrollment kontrolü |
| 04 Katalog | catalog.read, course detail, save item | Erişim yoksa talep et, lisans süresi dolduysa admin bildirimi |
| 05 Yol | Program version ve adım state | Zorunlu/kilitli/seçmeli renk+etiket; version değişimi açık bildirim |
| 06 Oynatıcı | launch → event ACK, native quiz | Ağ yoksa kayıt durumu, SCORM launch hatasında trace ile ticket |
| 07 Sınav | submitAttempt / instructor grade | Gönderim tekrarı idempotent; deneme limiti ve süre dolumu server kararına göre |
| 08 Profil/belge | profile, claim, externalCredential, certificate download | Dosya taranıyor/reddedildi; own-review yok; expired geçmiş korunur |
| 09 Sosyal | feed, comments, report/moderate, conversations | Silinen/engellenen gönderi güvenli placeholder; izin dışı mention yok |
| 10 Takvim | events, register, cancel, attendance | Yerel saat, son kontenjan yarışında tek kazanan, waitlist B2 |
| 11 Destek | createTicket/reply/state | Dosya taraması bekler; iç not public composer'da seçenek değil |
| 12 Marka | brand draft/publish | Logo/renk kontrast uyarısı; mobile preview, rollback önceki brand version |
| 13 Kullanıcılar | import validation/apply, invite, role assignment | Duplicate eposta ve FK hataları satır bazlı, tüm dosya sessizce iptal değil |
| 14 Program editörü | course/program version, publish | Döngü/lisans/onay blokları; drag işleminin klavye eşdeğeri |
| 15 Atama | preview → apply | 15dk preview süresi, stale kitle için yeniden önizleme |
| 16 İhtiyaç | need/tasks/readiness | Yüzdeyle birlikte bloklayıcı varlık listesi; lisans satın alma hazır demek değil |
| 17 Authoring | project lease/save/publish/export | Stale revision, kayıp ağ, export limiti; eski yayın çalışmaya devam |
| 18 Sertifika | template preview/publish | En uzun ad/başlık testleri, QR doğrulama, logo oran koruma |
| 19 Rapor | dataset query/export/schedule | Yetkisiz alan gösterilmez; örneklem yoksa 0 başarı uydurulmaz |
| 20 Workflow | preset configure/test/publish | Cycle, mesaj önizlemesi, sessiz saat, dead letter yeniden dene |
| 21 Değerlendirme | assigned responses/rubric/grade | Taslak ile yayın ayrı, own-grade engeli, itiraz kaydı |
| 22 Ekip | team read/claim review/need create | Kapsam değişince liste yenilenir; eski manager linki erişim açmaz |
| 23 Portal fabrikası | create/provision/activate | Slug collision, job retry, sentetik seed, invite retry |
| 24 Platform destek | global metadata/grant/escalation | Grant expired, iç not izinleri, escalation bağlı trace |
| 25 Lisans | entitlement/trial/purchase request | Trial sonu tarih ve veri politikası; G checkout tutar doğrulaması |
| 26 Operasyon | job/health/usage/audit/retention | Silme/askı etkisi açık, export öncesi plan, kanıt manifesti |

## Ek referans akışları

Başlık taramasında belirlenen mekan/envanter (admin-068..076) R39, SSS/bilgi bankası (admin-087) R40 olarak izlenir. B2 etkinlik detayına Mekan / Eğitmen / Ekipman / Masraf eklenir; bir kaynak aynı zaman aralığında iki etkinliğe ayrılmaz. SSS B1 Destek ana ekranında arama + rol/kategori filtresi + ilgili makaleler; çözülemezse ticket formuna geçer.

Geçmiş eğitim/sertifika toplu taşıma R05/R13/R16/R24 kapsamında: migration kaynağı, kişi eşlemesi, tarih, kanıt ve doğrulayan admin kaydedilir; import edilen geçmiş kayıt yeni tamamlanmış gibi XP veya davet spam'i üretmez. Kayıt/adaylık talepleri R16/R26 onay kuyruğunda. Değerlendirme itirazı: learner ticket kategorisi assessment → instructor dışındaki yetkili reviewer → amendment; eski not ve belge etkisi görünür.

## Tasarım uygulama checklist'i

1600/1920px masaüstü, 1440/1280 dizüstü, 768 tablet, 390/360 mobil; 320px minimum akışın taşmaması. Ana içerik satır uzunluğu 65–80 karakter; tabloda yatay scroll sadece veri alanında. Mobilde primary CTA başparmak erişimli, ekran okuyucu adı görünür metinle uyumlu. Ana aksiyonlar hover'a bağlı değil.

Koyu/açık tokenlar; 3 login + 3 sertifika + 6 kapak şablonu; UX04/06/14/17/19/24 için boş/hata/yükleme tasarımları ve snapshot fixture'ları. Sentetik uzun Türkçe isim, dar ekran, %200 zoom, reduced motion test verisi. B1 UI geçişi tasarım gözden geçirmesiyle, gerçek müşteri UAT'si ayrı yayın kapısıyla tamamlanır.
