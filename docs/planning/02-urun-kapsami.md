# Ürün kapsamı, roller ve gereksinimler

> v1.0 baz çizgisi, 21 Eylül 2026. Nihai teknik seçim ve faz sınırları için [08 — Final kararlar](08-final-kararlar.md), uygulama sözleşmeleri için 09–14 geçerlidir.

Fazlar öneridir: **B1** ilk kullanılabilir beta, **B2** genişletilmiş beta, **G** genel sürüm, **S** sektör ölçeklemesi. Her satır ürün kapsamındadır; bir sonraki faza bırakılan özellik demo ekranıyla tamamlanmış sayılmaz.

## Rol ve yetki modeli

Bir kişi birden fazla kurumda ve bir kurumda birden fazla rolde olabilir. Rol değiştirme görünümü değiştirir; güvenlik kontrolünü değiştirmez. Yetki = aktif kurum üyeliği + işlem izni + kaynak kapsamı + gerekiyorsa ürün lisansı.

| Rol | Yönetebildiği kapsam | Sınır |
|---|---|---|
| Platform super admin | Portal yaşam döngüsü, sektör paketleri, lisanslar, sistem şablonları, platform operasyonu | Tenant öğrenme kayıtlarına erişim ayrıca izlenir; varsayılan sınırsız içerik okuması yok |
| Platform destek operatörü | Kurumlar arası destek kuyruğu, teşhis, aktarılmış talepler | Super admin rolünden ayrı; gerekçeli, süreli destek erişimi |
| Kurum admini | Kendi kurumu, üyeler, içerik, atama, rapor, marka, entegrasyon | Diğer kurumlar ve platform sırları kapalı |
| Instructor | Atandığı eğitim, oturum, değerlendirme ve öğrenen soruları | Diğer eğitmenlerin içeriği ve kurum genel personel verisi kapalı |
| Line manager | Yetkili ekip kapsamı, gelişim, talepler, onaylar | Tüm kurum veya anonim anket yanıtlarını göremez |
| Learner | Kendi öğrenmesi, profili, sertifikaları, izinli topluluklar | Not/sertifika/puanı kendisi kesinleştiremez |

Instructor ve manager kullanıcıları ayrıca learner olarak eğitim alabilir. Yönetici kendi sertifika/istisna başvurusunu onaylayamaz. Üst ekipleri görme ayrı izindir; yalnızca organizasyon ağacındaki konumdan otomatik türemez. B1 hazır roller; G sürümünde izinlerden özel rol üretme.

## Gereksinim kayıt tablosu

| ID | Modül ve asgari davranış | İlk teslim | Sonraki kapsam / kabul odağı |
|---|---|---|---|
| R01 | Portal fabrikası: sektör, kurum, URL, demo/tam, şablon, admin daveti, önizleme, kurulum kontrol listesi | B1 | S: yeni sektör paketleri; başarısız kurulum güvenle devam ettirilir |
| R02 | Paket/lisans: modül yetkileri, kullanıcı/depolama kotası, deneme süresi, yükseltme talebi | B1 | G: otomatik abonelik/ödeme, kullanım faturası; entitlement sunucuda denetlenir |
| R03 | Kimlik: davet, giriş, parola yenileme, MFA, çoklu kurum/rol, oturum kapatma | B1 | B2: gerçek SAML bağlantısı; G: SCIM ve gelişmiş yaşam döngüsü |
| R04 | İlk giriş: aydınlatma kaydı, ayrı izinler, profil, uzmanlık/ilgi, öğrenme hedefi | B1 | Zorunlu başlangıç yolu; pazarlama izni vermeyene öğrenme kapanmaz |
| R05 | Organizasyon: birim, ekip, unvan, manager, grup, CSV içe alma ve sonuç raporu | B1 | G: HRIS bağlayıcıları, tarihli görevlendirme, delegasyon |
| R06 | Katalog: eğitim, sürüm, konu, uzmanlık, seviye, süre, dil, arama, filtre, lisans | B1 | G: federatif katalog ve tedarikçi hak yönetimi |
| R07 | Öğrenme: video, PDF, metin, bağlantı, SCORM 1.2 doğrulanmış profil, yerel quiz | B1 | B2: SCORM 2004 ve xAPI pilotu; G: doğrulanmış geniş uyumluluk/cmi5 |
| R08 | Program/yol: sürükle-bırak sıra, önkoşul, zorunlu/seçmeli adım, tarih, karma eğitim | B1 | B2: dallanma, eşdeğerlik ve dönemsel yeniden atama |
| R09 | Zorunlu eğitim: hedef grup, süre, son tarih, hatırlatma, gecikme, istisna onayı | B1 | B2: kapsamlı tekrar sertifikasyonu ve düzenleyici paketler |
| R10 | Sınav: soru bankası, rastgeleleştirme, geçme eşiği, deneme sayısı, açıklama, rubrik | B1 | B2: gelişmiş analitik; gözetimli sınav ayrı değerlendirme |
| R11 | Yetkinlik: hukuk rol matrisi, hedef seviye, öz değerlendirme, kanıt ve manager onayı | B1 temel | B2: beceri açığı raporu; G: kariyer/succession |
| R12 | Sertifika: kazanım, şablon, PDF, doğrulama kodu, iptal, süre sonu | B1 | B2: gelişmiş tasarım editörü; G: doğrulanmış dış rozet standartları |
| R13 | Dış öğrenme: sertifika yükleme, kurum/eğitim/saat/tarih, onay-red ve gerekçe | B1 | Dış kanıt kendiliğinden zorunlu ders yerine geçmez |
| R14 | LXP: kaldığın yer, sana uygun, ilgi/rol/yetkinlik filtresi, listeye kaydetme | B1 | B2: gelişmiş kişiselleştirme; öneri gerekçesi görünür |
| R15 | Gamification: puan defteri, rozet, seviye, görev, leaderboard, kutlama | B1 | B2: dönemsel takım görevleri; rekabetten çıkma seçeneği |
| R16 | Canlı eğitim: takvim, kontenjan, kayıt/iptal, eğitmen, katılım | B1 bağlantı + manuel yoklama | B2: Teams/Zoom/GoToTraining API; G: bekleme listesi ve gelişmiş kaynak planlama |
| R17 | Sosyal akış: haber, blog, kısa video, kaynak, beğeni, yorum, kaydet, raporla | B1 temel | B2: moderasyonlu topluluklar, konu takibi, gelişmiş akış |
| R18 | Sohbet: öğrenen-eğitmen sorusu ve program tartışması | B1 | B2: kurum içi bireysel/grup sohbeti; engelle/şikayet/saklama |
| R19 | Form/anket: sürümlü form, zorunlu alan, hedef kitle, geri bildirim | B1 | B2: koşullu alan, gerçek anonim anket ve eşik üstü sonuç |
| R20 | Bildirim: uygulama içi, eposta, teslim geçmişi ve tercihler | B1 | B2: web push/PWA; G: mobil push |
| R21 | Otomasyon: tetikleyici-koşul-eylem şablonları, test önizleme, zamanlama | B1 hazır akış | B2: görsel workflow editörü, sürüm ve çalışma geçmişi |
| R22 | Marka: logo, ölçek/kırpma, renk, banner, login şablonu, tema, önizleme | B1 | B2: çoklu şablon ve zamanlanmış kampanya; G: özel domain |
| R23 | Eposta: hazır şablonlar, izinli değişkenler, tema, önizleme, test | B1 | B2: doğrulanmış kuruma özel gönderici; bounce/şikayet takibi |
| R24 | Rapor: ilerleme, başarı, uyumluluk, sertifika, kullanım, içerik hazırlığı | B1 | B2: özel rapor oluşturma ve zamanlanmış dağıtım |
| R25 | AI: açıklanabilir öneri ve izinli rapor şemasından doğal dille taslak rapor | B2 | İnsan onaylı çalıştırma; serbest SQL yok; maliyet/erişim sınırı |
| R26 | Eğitim ihtiyaç/envanter: sahip, üret/satın al, varlık checklist, inceleme tarihi | B1 | B2: talep birleştirme, bütçe ve tedarik takibi |
| R27 | isEazy: dosya içe alma, sürümleme, veri profili ve rapor eşlemesi | B1 SCORM 1.2 | B2: doğrulanmış xAPI; API senkronu satıcı kanıtına bağlı |
| R28 | GoAuthoring: şablon, blok editörü, quiz/anket/sürükle-bırak, yerel yayın ve SCORM 1.2 dışa aktarma | B1 mini beta | B2: gelişmiş analiz/diğer çıktı profilleri; G: geniş yazarlık |
| R29 | GoAuthoring ticari akış: modül denemesi, kota, satın alma talebi, lisans açma | B1 | G: gerçek online satın alma; test ödeme tamamlanmış satış sayılmaz |
| R30 | Kurum destek: talep aç/yanıtla/kapat/yeniden aç, ekler, üst desteğe aktar | B1 | Öğrenen yalnızca kendisine açık mesajları görür |
| R31 | Platform destek: tüm kurum kuyrukları, öncelik, atama, iç not, SLA, teşhis | B1 temel | B2: problem/olay ilişkisi, toplu duyuru, bilgi bankası |
| R32 | Dashboard: rol bazlı iş listeleri, eğilimler, hızlı işlemler, güncellik damgası | B1 | B2: widget yerleşimi ve kaydedilmiş görünümler |
| R33 | Profil: avatar, bio, uzmanlık, hedef, öğrenme geçmişi, tercihler, gizlilik | B1 | B2: doğrulanmış öğrenen pasaportu |
| R34 | Responsive, açık/koyu/sistem tema, erişilebilirlik, animasyon azaltma | B1 | Native iOS/Android ve offline SCORM G sonrası ayrı kapsam |
| R35 | Denetim, yedek, veri dışa aktarımı, silme/saklama, olay müdahalesi | B1 | G: kurumsal denetim paketleri; sertifikasyon iddiası yok |
| R36 | Sektör paketleri: terminoloji, rol, yetkinlik, yol, şablon, checklist | B1 hukuk | S: otelcilik, ardından doğrulanmış diğer sektörler |
| R37 | Açık akademi: kayıt, fiyat, kupon, sipariş, ödeme, iade, fatura, erişim hakkı | G varsayımı | İlk müşterinin B2C tercihi varsa B1'e alınır |
| R38 | Platform işletimi: sağlık, kuyruk, maliyet, kullanım, limit, yedek/restore durumu | B1 | Canlı ziyaretçi göstergesi tanımı ölçülebilir ve yaklaşık olarak sunulur |
| R39 | Yüz yüze eğitim operasyonu: mekan, ekipman, dış eğitmen/tedarikçi, rezervasyon ve maliyet | B2 | Çakışma kontrolü, kontenjan ve katılım; R16/R26 ile ortak kayıt |
| R40 | Bilgi bankası/SSS: kategori, rol bazlı makale, arama, ticket öncesi öneri | B1 | Platform şablonu + tenant özelleştirmesi; yayın/inceleme sürümü |

## B1'in müşteriye gösterilecek tamamlanmış hikâyesi

Super admin hukuk paketinden Oguz Law Academy'yi kurar. Admin kuruma ait marka ve kullanıcıları ekler, ihtiyaç listesinden bir eğitim üretir/yükler, bir program atar. Learner ilk girişten sonra eğitimine devam eder, sınavı geçer, sertifika/puan alır. Eğitmen vaka yanıtını değerlendirir. Manager yalnızca ekibinin durumunu görür. Admin ilerleme ve eksikleri raporlar; çözemediği talebi platform desteğine aktarır.

B1'in dışında önerilen API entegrasyonları ve gelişmiş özellikler yol haritasında görünür; menüde çalışıyormuş gibi sunulmaz. İlk beta kapsamı bu hikâyeye ek zorunluluklar varsa karar kaydında güncellenir.

## Gamification varsayılanları

- Tamamlanan eğitim sürümü/atama döngüsü için 100 XP; program için ayrıca 200 XP; onaylı dış sertifika 50 XP. Admin değişiklikleri ileriye dönük kural sürümü oluşturur.
- Aynı denemenin tekrar bildirimi puan üretmez; aynı dönemde eğitim tekrar oynatma puanı yok. Login, tıklama, video ileri sarma, mesaj sayısı ve beğeni satın alınabilir başarı sayılmaz.
- Rozetler: İlk Adım, İlk Program, Düzenli Öğrenen, Vaka Çözücü, Bilgi Paylaşımı. Vaka ve katkı rozetleri onaylı kanıt ister.
- Leaderboard varsayılanı aylık ve kurum içi; ekip filtresi var. Eşit XP aynı sıradır, alfabetik sıra yalnızca gösterim içindir. Platformlar arası sıralama yok.
- Gecikme ve başarısızlık herkese açık sıralamada teşhir edilmez. Öğrenen isterse görünür sıralamadan çıkar; kurumun zorunlu eğitim raporu bundan etkilenmez.
- XP, eğitim saati ve resmî mesleki gelişim kredisi ayrı alanlardır; birbirine çevrilmez. Resmî kredi için yetkili kurum/akreditasyon kanıtı gerekir.
- Hatalı ödül silinmez, gerekçeli ters kayıtla düzeltilir. Kural değişimi geçmiş sonuçları sessizce yeniden yazmaz.

## Rapor sözlüğü

| Gösterge | Tanım |
|---|---|
| Kullanıcı ilerlemesi | Mevcut atama sürümünde tamamlanan gerekli adım ağırlığı / gerekli toplam ağırlık; seçmeli adımlar paydaya girmez |
| Program başarı durumu | Gerekli adımlar + varsa sınav ve eğitmen onayı; yüzde 100 tek başına geçme anlamına gelmez |
| Atama tamamlama oranı | Filtrelenen aktif atamalarda tamamlanan / aktif toplam; iptal edilenler hariç; muaf olanlar ayrı sayı |
| Uyumluluk | Geçerli kanıtı olan uygulanabilir gereksinimler / uygulanabilir gereksinimler; onaylı muafiyetler ayrı gösterilir |
| İçerik hazırlığı | Gerekli ve onaylı varlık ağırlıkları / gerekli varlık ağırlıkları; video hazır, uzman incelemesi eksikse yayın kapısı kapanabilir |
| Aktif öğrenen | Seçili dönemde geçerli öğrenme etkinliği kaydı olan farklı kullanıcı; yalnızca login değil |
| Şu anda aktif | Son 5 dakikada heartbeat gönderen farklı üyeler; yaklaşık değer, son güncelleme damgasıyla |
| Öğrenme süresi | Ölçülen etkin süre; video ve sekme tekrarları çifte sayılmaz; SCORM tarafından bildirilen süre ayrı kaynak etiketi taşır |
| İçerik güncelliği | Review tarihi geçmemiş ve güncel onaylı sürüm bulunan içerik payı |

Payda sıfırsa yüzde 100 yazılmaz, “Uygulanabilir kayıt yok” gösterilir. Her raporda dönem, timezone, filtre, veri güncelliği, hariç tutulan kayıtlar ve metrik sürümü bulunur.
