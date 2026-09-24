# Araştırma ve kanıt kaydı

> v1.0 baz çizgisi, 21 Eylül 2026. Nihai teknik seçim ve faz sınırları için [08 — Final kararlar](08-final-kararlar.md), uygulama sözleşmeleri için 09–14 geçerlidir.

İnceleme tarihi: 20 Eylül 2026. Resmî ürün sayfaları, resmî teknik dokümanlar ve kullanıcının yerel ekranları esas alındı. Bu çalışma tüm küresel LMS pazarını tüketen bir inceleme değildir; üç talep edilen ürün ile dört tamamlayıcı yaklaşımı kapsayan başlangıç karşılaştırmasıdır.

## Rakip karşılaştırması

| Ürün | Kaynakta görülen yetenek | Bizim ürün kararımız | Doğrulanmamış alan |
|---|---|---|---|
| UpsideLMS | Öğrenme yolları, sanal sınıf, içerik yazarlığı, sınav/anket, yetkinlik, puan/rozet, SSO, markalama ve raporlama | Temel LMS kapsamını karşıla; görev odaklı arayüzle yönetim yükünü azalt | Ayrıntılı etkileşim dışa aktarımı ve müşteri sözleşmesindeki modül sınırları |
| Invince LXP | Beceri açığı, role göre gelişim, kanıt temelli beceri profili, öğrenen pasaportu ve AI önerileri | Öz beyanı ve doğrulanmış yetkinliği ayrı göster; açıklanabilir öneriler üret | Hukuk sektörüne özel veri modeli ve Türkiye uyumluluk içeriği |
| Docebo | Otomasyon, AI içerik üretimi, raporlama, farklı hedef kitleler, topluluklar ve entegrasyon ekosistemi | Çoklu hedef kitleye hazır çekirdek; içerik, ölçüm ve destek aynı deneyimde | Teklif kapsamı, derinlik ve gerçek hesapla API yetkileri |
| 360Learning | İşbirlikçi öğrenme yaklaşımı | İç uzmanın içerik önerme, inceleme ve güncelleme döngüsünü kolaylaştır | Bizim hedef içeriklerimizde inceleme/veri dışa aktarımı ayrıntıları |
| TalentLMS | Özel ve zamanlanmış raporlar; bağımsız eğitim alanları ve gamification | Kurulum kolaylığı ve hazır raporlar beta standardı olsun | Büyük organizasyon ve sektör paketleri sınırları |
| Moodle Workplace | Çoklu tenant, program/sertifikasyon ve dinamik kurallar | Tek çekirdek, ayrı kurum yetkisi ve tekrar kullanılabilir kurallar | Kullanılacak dağıtımın lisans/işletim koşulları |
| Degreed | LXP, beceri gelişimi ve mevcut öğrenme/İK araçlarına bağlantılar | Dış öğrenme kanıtları ve yetkinlik gelişimini yalnızca kurum içi derslere bağlama | Yerel hukuk akreditasyonu ve içerik lisansları |

Kaynaklar: [UpsideLMS](https://www.invince.ai/upsidelms), [Invince LXP](https://www.invince.ai/invince-lxp-ai-powered-learning-experience-platform), [Docebo](https://www.docebo.com/learning-platform/), [360Learning](https://360learning.com/), [TalentLMS raporlama](https://www.talentlms.com/features/lms-reporting), [Moodle Workplace](https://moodle.com/news/moodle-workplace-4-multi-tenancy/), [Degreed LXP](https://degreed.com/experience/lxp/).

Fiyat ve pazarlama performans yüzdeleri karşılaştırmaya alınmadı; sözleşme ve ölçüm yöntemleri olmadan bütçe/başarı taahhüdü oluşturmazlar. Kaynakta özellik görülmemesi yokluğunu kanıtlamaz.

## Farklılaşma hipotezleri

Bunlar rakiplerde kesinlikle bulunmayan özellik iddiaları değil, birlikte iyi uygulandığında ürünün değer önerisidir:

1. **Sektöre hazır akademi:** hukuk rol/yetkinlik ağacı, işe giriş yolları, örnek vaka şablonları ve içerik ihtiyaç kontrol listesi birlikte kurulur.
2. **İçerik hazırlık merkezi:** satın al/üret/lisans yenile/uzman incelemesi bekliyor adımları ile eğitim envanterini yönetir. Yayınlamak ve gerçekten kullanıma hazır olmak ayrılır.
3. **Kanıtlı gelişim:** ders bitirme, sınav, vaka rubriği, dış sertifika ve yönetici onayı ayrı kanıt türleridir.
4. **Ölçülebilir yazarlık:** GoAuthoring blok ve soru kimlikleri öğrenme analitiğine doğrudan bağlanır; sonuçların hangi içerik sürümüne ait olduğu kaybolmaz.
5. **İşe dönük dashboard:** her rol “Bugün ne yapmalıyım?” sorusunun cevabını bulur; sayı kartları uygun eyleme açılır.
6. **Tek destek zinciri:** öğrenen → kurum yöneticisi → platform destek; bağlam ve dosyalar izin sınırları içinde taşınır.
7. **Hukukta içerik güncelliği:** inceleme tarihi, yetkili editör, kaynak ve içerik sürümü; değişiklikten etkilenen programların listesi.

## isEazy hakkında kritik düzeltme

Resmî yardım sayfası xAPI çıktısında değerlendirme soruları için `answered`, yanıt/başarı ve etkileşim türü alanlarını tarif ediyor; yanıt gönderme özelliğinin Enterprise hesaplarla sınırlı olduğunu belirtiyor. Dolayısıyla “isEazy etkileşimleri raporlayamaz” kabulü doğru başlangıç değildir. Sorun paket formatı, plan, LMS'nin veriyi saklaması veya raporlaması olabilir. Her etkileşim türünün gönderildiği ayrıca test edilmelidir. [isEazy xAPI](https://help-author.iseazy.com/hc/pt-br/articles/19453321997842-xAPI)

İlk entegrasyon yolu dosya dışa aktarımı ve içe alımıdır. Doğrudan API ile otomatik senkronizasyon, yayımlama webhook'u veya kaynak proje erişimi bu araştırmada doğrulanmadı; satıcı dokümanı/sözleşmesi olmadan vaat edilmez. [isEazy dağıtım seçenekleri](https://www.iseazy.com/author/features/scorm/)

## Ekran referansları

| Klasör | Dosya | Örneklem | Görülen işlevler |
|---|---:|---:|---|
| admin | 248 | 6 | Dış sertifika, kısa yanıt değerlendirme, rozetler, birleşik sınav raporu, markalama/eposta ayarları |
| super-admin | 181 | 6 | Portal yönetimi, soru oluşturma, otomatik eposta önizlemeleri, destek listesi |
| learner | 47 | 6 | Eğitim kartları, bildirim çekmecesi, etkinlik paylaşımı, uyum durumu, profil, destek talebi |
| instructor | 12 | 6 | Oturumlar, sınavlar, öğrenen soruları, içerik listesi, anket/medya |
| line-manager | 11 | 6 | Eğitim önerisi/talebi, ekip duyurusu ve destek görünümü |
| mobile-app | 48 | 6 | Mobil öğrenme, menü, mesleki gelişim puanları, leaderboard, sosyal bağlantı, video |
| **Toplam** | **547** | **36** | Örneklem incelemesi; tüm formlar/alanlar doğrulanmadı |

Dosya listesi: [envanter](research/screenshot-inventory.csv). Örnekler: [admin](research/contact-sheets/admin.jpg), [super admin](research/contact-sheets/super-admin.jpg), [learner](research/contact-sheets/learner.jpg), [instructor](research/contact-sheets/instructor.jpg), [line manager](research/contact-sheets/line-manager.jpg), [mobil](research/contact-sheets/mobile-app.jpg).

Uzun ekranların küçültülmüş örnekleri alan düzeyinde okunabilir değil; bunların ayrıntılı analizi açık iştir. Ekranlar tarihsel bir ürün sürümünü gösterebilir. İsimler/epostalar örnek veri olarak yeniden kullanılmaz.

## Teknik ve düzenleyici kaynaklar

| Kaynak | Plan kararına etkisi |
|---|---|
| [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Tenant ve rol izinleri veritabanında da uygulanır; ayrıcalıklı anahtarın RLS'yi aşması özel risk olarak ele alınır |
| [Storage erişimi](https://supabase.com/docs/guides/storage/security/access-control) | Dosya izinleri de tenant sınırına dahildir |
| [Supabase SAML](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml) | Kurumsal SSO için sağlayıcı/tenant eşlemesi tasarlanır |
| [Supabase Queues](https://supabase.com/docs/guides/queues) | Kalıcı arka plan işleri için kuyruk temeli değerlendirilir |
| [Vercel Functions sınırları](https://vercel.com/docs/functions/limitations) | Uzun paket işleme işlerini tek HTTP isteğine bağlamama; plan/süre limitleri satın alma öncesi tekrar doğrulanır |
| [Microsoft katılım raporları](https://learn.microsoft.com/en-us/graph/api/meetingattendancereport-get?view=graph-rest-1.0) | Katılım verisi izin ve hesap önkoşullarıyla gelir |
| [Zoom API](https://developers.zoom.us/docs/api/meetings/) ve [webhook](https://developers.zoom.us/docs/api/webhooks/) | Toplantı yaşam döngüsü ve gecikmeli katılım uzlaştırması |
| [GoToTraining API](https://developer.goto.com/GoToTrainingV1/) | Eğitim ve katılım işlemlerini ayrı sağlayıcı adaptörüyle ele alma |
| [ADL xAPI](https://github.com/adlnet/xAPI-Spec) ve [cmi5](https://aicc.github.io/CMI-5_Spec_Current/) | xAPI olay alımı, tam LRS uyumu ve başlatma standardını birbirine karıştırmama |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Erişilebilirlik kabul hedefi AA |
| [KVKK aydınlatma tebliği](https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig) | Aydınlatma ve açık rıza ayrı işlerdir; tek zorunlu “KVKK onayı” kutusu tasarlanmaz |
| [KVKK yurt dışı aktarım](https://www.kvkk.gov.tr/Icerik/2053/Yurtdisina-Aktarim) | Bulut bölgesi seçimi tek başına hukuki aktarım uygunluğu sağlamaz; aktarım mekanizması incelenir |
| [ÇSGB SSS](https://www.csgb.gov.tr/sikca-sorulan-sorular/is-sagligi-ve-guvenligi-genel-mudurlugu/) | İSG içeriğinin uzaktan sunumu, eğitmen ve uygulama şartları eğitim türüne göre doğrulanır |

ADL SCORM proje sayfasına erişim bu turda hata verdi; SCORM standardı düzeyindeki uyumluluk incelemesi açık tutuldu. xAPI deposunun sürümü ile uygulanacak sürüm teknik denemede sabitlenecek.

## Final araştırma kapanışı — 21 Eylül 2026

547 görselin tamamının üst başlık bölgesinde otomatik OCR taraması tamamlandı; sonuç 547 kayıt, sıfır OCR işlem hatasıdır. Bu, metnin hatasız tanındığı veya bütün ekranların ayrıntılı incelendiği anlamına gelmez. Manuel görsel örneklem 36 ekrandır. Kanıt: research/screenshot-inventory.csv ve research/screenshot-header-triage.csv. Olası kişisel veri içeren referanslar dışarı yayımlanmaz.

Başlık taramasından gelen ek kapsam: mekân/ekipman/tedarikçi/rezervasyon/maliyet R39; bilgi bankası ve SSS R40. Geçmiş eğitim importu, aday gösterme ve sınav itirazı mevcut kapsamın ekran/veri sözleşmelerine işlendi. SMS/WhatsApp ve özel HRMS ürün bağlantıları, kullanıcının istediği her bağlantı varmış gibi gösterilmedi; genel entegrasyon genişletme alanıdır, B1 teslim taahhüdü değildir.

Worker/medya/eposta/AI seçimleri ve SCORM Cloud yönetilen standart motoru kararı 08'de; resmî fiyat kaynakları ve üç senaryo 13'tedir. isEazy etkileşim raporlamasının tamamen bulunmadığı iddiası doğrulanmadı: resmî xAPI belgesi soru yanıtlarını tarif eder; lisans, format ve gerçek paket çıktısı ayrıca doğrulanmalıdır. Ürünün farklılaşması yerel etkileşim verisi, hukuk vaka akışı, içerik hazırlık takibi ve tek rol deneyiminde bu kanıtların birleşmesidir; rakiplerde olmadığı kanıtlanmış bir özellik listesi değildir.

Uygulama kanıtı olarak planlanan işler: gerçek isEazy/SCORM paket fixture'ları, toplantı test hesaplarının izinleri, yönetilen motor uyumu ve müşteri görev testleri. Bunlar EP01/EP15–EP18 ve EXT kapılarına bağlandı; plan araştırmasının devam etmesini gerektiren belirsiz iş listesi olarak bırakılmadı.
