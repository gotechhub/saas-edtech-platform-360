# İçerik standartları, entegrasyonlar ve GoAuthoring

> v1.0 baz çizgisi, 21 Eylül 2026. Nihai teknik seçim ve faz sınırları için [08 — Final kararlar](08-final-kararlar.md), uygulama sözleşmeleri için 09–14 geçerlidir.

## Desteklenen formatlar ve doğrulama sınırı

| Format | B1 yaklaşımı | Sonraki kapı |
|---|---|---|
| Yerel metin/video/PDF/quiz | Tam yönetilen içerik; kendi olay/sonuç modeli | Medya dönüştürme ve büyük ölçek streaming maliyeti |
| SCORM 1.2 | Doğrulanmış tek-SCO profil; initialize/get/set/commit/finish, resume, score/status/time/interactions | Çok-SCO ve farklı üreticiler; uyumluluk test koleksiyonu |
| SCORM 2004 | B1'de destekleniyor etiketi yok | B2 teknik deneme; runtime ile sequencing/navigation kapsamını ayır; engine/geliştirme kararı |
| xAPI | İç event modeli xAPI değildir; eşleme için hazır tutulur | B2 sürümlü statement/state/launch profili; tam LRS iddiası bağımsız doğrulama ister |
| cmi5 | Yol haritası | Ayrı launch/session/moveOn kuralları ve test; xAPI desteği otomatik cmi5 desteği değildir |
| AICC / LTI / H5P | Veri/adapter sınırları hazır, B1 taahhüdü yok | G müşteri ihtiyacı, lisans, güvenlik ve ölçüm matrisiyle |
| Dış web/YouTube/Vimeo | Bağlantı/izinli embed, erişim açıklaması | İzlenebilirlik sağlayıcının sunduğu veriye bağlı; tıklama başarı değildir |

Kaynaklar: [isEazy export](https://www.iseazy.com/author/features/scorm/), [ADL xAPI](https://github.com/adlnet/xAPI-Spec), [cmi5](https://aicc.github.io/CMI-5_Spec_Current/). SCORM standardı ayrıntıları ve oynatıcı uyumluluğu henüz teknik denemeyle doğrulanmadı.

## SCORM güvenliği ve oynatıcı

Paket yükleme → özel karantina → dosya/manifest/ZIP limit kontrolü → tarama → sürüm artifact'ı → admin test başlatma → yayın onayı. Desteklenmeyen sürüm/manifest ve hatalı paket açık hata verir; sessizce video ya da HTML sayfasına çevrilmez.

Paketler uygulamanın origin'inde çalıştırılmaz. Öneri: uygulamadan farklı, kuruma ait bir içerik domain'i ve paket sürümüne özel origin; portal auth çerezi/anahtarları bu alana gönderilmez. Domain sahipliği ve wildcard DNS/TLS kodlama öncesi teknik kapıdır.

SCORM'un senkron API beklentisi için SCO ile aynı origin'de çalışan güvenilir runtime wrapper API shim sağlar. Wrapper portal ile `postMessage` köprüsünde kesin origin/source kontrolü ve session nonce kullanır. `*` hedefi veya gelen tenant/user değerine güvenme yok. Sunucuya dar kapsamlı, süreli öğrenme session credential ile gider; gerçek Supabase token'ı pakete verilmez.

Başka origin'e taşıma tek başına çözüm sayılmaz: API discovery, iç pencere, popup, CSP, sandbox, resume ve storage davranışı örnek paketlerle denenmelidir. Güvenilmeyen paket kendi oturumu için yanlış skor bildirebilir; yüksek güven gerektiren değerlendirmeler sunucu puanlamalı yerel sınavla doğrulanır.

Runtime ilk yüklemede mevcut CMI durumunu alır; lokal senkron shim, asenkron kalıcılaştırma ve commit durum göstergesi. Yeniden bağlanma/sekme kapanması kayıtları sırayla tekrarlar; “sunucuda kaydedildi” yalnızca sunucu onayından sonra gösterilir. Aynı denemede paralel yazan sekmeler session sürümüyle kontrol edilir. Offline tamamlama B1'de yok.

## GoAuthoring mini beta

Hedef: adminin kısa, ölçülebilir hukuk eğitimi üretip aynı LMS'de sürümlü yayınlaması. isEazy'nin bütün yazarlık yeteneklerini kopyalamak veya kaynak dosyalarını otomatik düzenlemek hedeflenmez.

### Editör

- Projeler: başlık, hedef kitle, beceri, dil, süre, kapak, sahip, inceleyen, lisans.
- Sol panel bölüm/sayfa ağacı; orta canvas; sağ panel blok ayarları; üstte kayıt/önizleme/yayın durumu.
- Bloklar: başlık/zengin metin, görsel, video, PDF/kaynak, bilgi kartı, accordion, flashcard, tek/çok seçenekli quiz, doğru-yanlış, sıralama/eşleştirme, anket, kısa vaka/serbest yanıt.
- Sürükle-bırak etkileşiminin klavye ve dokunmatik alternatifi bulunur. Beta soru tipleri açık listeyle sınırlanır; desteklenmeyen karmaşık dallanma sonradan eklenir.
- Otomatik kayıt, geri al/yeniden yap, taslak revision; eşzamanlı edit çatışmasında son yazan sessizce ezmez. B1 tek aktif editör kilidi, gerçek zamanlı ortak düzenleme sonraki sürüm.
- Hazır şablon: avukat onboarding, kısa mevzuat güncellemesi, vaka çözümü, siber güvenlik farkındalığı, müşteri görüşmesi becerisi.

### Yayın ve SCORM çıktısı

1. Şema/asset/alt metin/erişim/lisans ve soru kontrolleri.
2. Onaylanan revision snapshot'ı; yayın işi ve outbox.
3. Aynı snapshot'tan yerel LMS artifact'ı ve istenirse SCORM artifact'ı üretimi.
4. Teknik doğrulama başarılı olunca yeni `course_version` atomik olarak etkinleşir.
5. Mevcut atamalar eski sürümde kalır; admin yeni sürüme taşıma/yeniden atama önizlemesi kullanır.

B1 hem yerel yayını hem kullanıcının istediği **SCORM 1.2 ZIP dışa aktarımını** kapsar. Dışa aktarılan paketin başka LMS'de gerçekten açılması/raporlanması kabul koşuludur; yalnızca ZIP üretmek yeterli değildir. SCORM 2004/xAPI çıktıları sonraki doğrulanmış profil kapsamına alınır.

Yerel LMS içinde yayın otomatik senkrondur: ikinci kez dosya yüklemek gerekmez. SCORM taşınabilir çıktısı standart alanların desteklediği veriyi taşır; başka LMS'ye aktarıldığında bütün ayrıntıların görüleceği garanti edilmez. Geniş ölçüm istenirse uyumlu xAPI uç noktası ve launch koşulları gerekir.

### Ölçüm sözleşmesi

Olay türleri: `content.started`, `block.viewed`, `interaction.submitted`, `assessment.submitted`, `attempt.graded`, `content.completed`. Her olay immutable content version, block/question ID, attempt, sequence, süre ve session'a bağlıdır. Görsel blok açmak tek başına beceri kanıtı değildir.

Quiz sonucu ve doğruluk sunucuda hesaplanır. Sürükle-bırak sonucu son eşleme/sıra, deneme sayısı ve rubrik sonucu olarak tutulur; her fare hareketi toplanmaz. Serbest cevap PII içerebilir; rol bazlı erişim ve saklama politikası gerekir. Anket skorlanmaz; anonim modda bireysel yanıt raporlanmaz.

Gerçek anonim anket B2'de ayrı yanıt deposuyla tasarlanır: yanıt üzerinde kullanıcı/enrollment/session kimliği tutulmaz, katılım kaydı cevapla eşlenmez, yanıt içeriği log/event'e girmez. Tek kullanımlık katılım hakkı ile yanıtın bağlanamaması ayrıca tehdit modelinde doğrulanır. En az 5 yanıt ve küçük grup ayrıştırmasını engelleyen filtre kuralı olmadan sonuç açılmaz. Bu koşullar sağlanmadan özellik “anonim” diye etiketlenmez; B1 anketleri erişimi kısıtlı kimlikli anketlerdir.

Raporlar: soru bazlı başarı/çeldirici dağılımı, terk edilen bölüm, deneme dağılımı, süre, içerik sürümleri arasında sonuç; örneklem düşükse aşırı yorum yapılmaz. AI ders taslağı/quiz önerisi üretse de uzman yayın onayı gerekir.

### Ticari yaşam döngüsü

Öneri: 14 günlük deneme, en fazla 3 proje ve 1 yayımlı demo eğitim; değerler super admin ürün ayarlarında. Deneme bitiminde taslaklar silinmez; düzenleme/yeni yayın kapanır, mevcut öğrenen erişimi kurum lisans politikasına göre açıkça yönetilir. Demo hiçbir zaman sessizce ücretli aboneliğe dönüşmez.

B1 “satın alma talebi → platform lisans açma” kurumsal satış akışı; gerçek checkout G fazı varsayımı. Online satın alma zorunluysa ödeme sağlayıcısı, vergi/fatura/iade ve ödeme webhook testleri B1 kapısına eklenir. Sadece buton göstermek satın alma işlevi sayılmaz.

## isEazy import

Kurum admini lisanslı paketi yükler; format algılama, tarama, launch testi, tamamlanma/score/resume testi, soru verisi önizlemesi. Paket kaynak projesinin içe aktarılması/editlenmesi vaat edilmez. isEazy xAPI yardımına göre soru yanıtı izleri Enterprise hesap gerektirebilir; mevcut müşteri planı ve örnek artifact doğrulanacaktır. [Resmî tracking açıklaması](https://help-author.iseazy.com/hc/pt-br/articles/19453321997842-xAPI)

Veri gelmediğinde rapor hücresi `0 yanlış cevap` değil “Kaynak paket bu veriyi iletmedi” olur. Desteklenmeyen interaction ham güvenli event olarak karantinada tutulabilir; bilinen profile dönüşmeden başarı hesaplamaz.

## Canlı eğitim sağlayıcıları

Ortak sözleşme: `connect`, `health`, `createSession`, `updateSession`, `cancelSession`, `registerLearner`, `getJoinLink`, `fetchAttendance`, `disconnect`. Sağlayıcı kimliği + tenant + occurrence benzersiz; refresh token şifreli.

| Sağlayıcı | Doğrulanan temel | Uygulama öncesi kanıt |
|---|---|---|
| Teams | Graph katılım raporu uç noktası | Müşteri Microsoft 365 planı, organizer, delegated/application izin modeli, tenant onayı ve gerekli politikalar |
| Zoom | Meeting API ve katılım webhook'ları | OAuth app türü, scopes, ücretli hesap gereksinimi, geçmiş rapor erişimi, webhook doğrulaması |
| GoToTraining | Eğitim ve rapor API'si | Organizatör hesabı, güncel auth ve endpoint sözleşmesi, rate limits, test etkinliği |

Kaynaklar: [Teams](https://learn.microsoft.com/en-us/graph/api/meetingattendancereport-get?view=graph-rest-1.0), [Zoom](https://developers.zoom.us/docs/api/meetings/), [Zoom webhook](https://developers.zoom.us/docs/api/webhooks/), [GoToTraining](https://developer.goto.com/GoToTrainingV1/).

Katılım kullanıcı ID/registration eşlemesiyle yapılır; yalnızca ekrandaki ada göre otomatik eşleme yok. Gir-çık aralıkları birleştirilir, paralel cihaz süreleri çifte sayılmaz. Oturum sonunda webhook + gecikmeli sağlayıcı raporu uzlaştırılır. Belirsiz misafir kayıtları manuel incelemeye gider. Eksik rapor yok sayılma değil “doğrulama bekliyor” durumudur.

Katılım için önerilen varsayılan %80; eğitim kuralı farklı olabilir, hukuk/İSG yeterliliği anlamına gelmez. Düzeltme yetkili kişi, gerekçe ve eski/yeni değer audit'i ile yapılır. B1 bağlantı ve manuel yoklama açıkça “manuel” etiketi taşır; API entegrasyonu tamamlanmış gibi gösterilmez.

## Eposta, push, otomasyon, SSO ve AI

- Eposta sağlayıcı adaptörü; SPF/DKIM/DMARC, doğrulanmış gönderici, bounce/complaint/suppression. B1 platform domain'inden tenant markalı gönderim. Kurum SMTP'si sonradan; parola ekran görüntüsü/log ile taşınmaz.
- Hazır otomasyonlar: davet takibi, yeni atama, son tarihe 7/3/1 gün, gecikme, 14 gün hareketsizlik, sertifika yenileme, etkinlik hatırlatma, destek güncelleme. Tekrarlı atama/bildirimleri idempotency önler. Yerel saat ve sessiz saatler; pazarlama ile zorunlu hizmet mesajı ayrılır.
- Zamanlanmış raporda alıcı ve oluşturanın yetkisi gönderim anında tekrar kontrol edilir. Epostaya hassas CSV eklemek yerine süreli, kimlik doğrulamalı indirme bağlantısı varsayılandır.
- Push isteği ilk girişte zorla sorulmaz; kullanıcı değerini gördüğünde ister. Tarayıcı/işletim sistemi destek farkı test edilir; in-app inbox temel kayıttır, push ulaşması garanti edilmez.
- SSO: B1 veri/arayüz altyapısı, B2 pilot SAML bağlantısı. Domain'e sahip olmak otomatik kurum üyeliği sağlamaz; JIT kuralları, eş hesap bağlantısı, çıkış ve acil admin erişimi test edilir. Genel OIDC/SCIM ayrı adaptör ve kapsam kararıdır. [Supabase SAML](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml)
- AI rapor asistanı: kullanıcı isteği → izinli metric/dimension/filter şeması → görünür rapor taslağı → kullanıcı çalıştırır → yetkili sorgu motoru. Model SQL veya tenant seçimini serbest belirlemez. Dış metindeki talimatlar yetkiyi değiştiremez.
- B2 AI sağlayıcısı Anthropic Haiku 4.5 olarak seçildi; model, kota ve veri sınırları 08 belgesindedir. Tenant bazlı kapatma, kota, timeout/fallback, kişisel veri minimizasyonu ve maliyet ölçümü zorunlu. AI çalışmadığında temel rapor/öneri kuralları kullanılabilir kalır.
