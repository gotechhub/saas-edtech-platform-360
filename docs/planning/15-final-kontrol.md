# Plan kapanış tutanağı — v1.0

21 Eylül 2026. Durum: **planlama baz çizgisi tamamlandı; uygulama geliştirmeye hazır**. Bu, yazılımın veya üretim ortamının hazır olduğu anlamına gelmez. Kullanıcının bu turdaki talebi doğrultusunda uygulama kodlamasına geçilmedi.

## Tamamlanan plan çıktıları

- [x] 40 gereksinimin kapsamı, ilk teslim fazı, iş paketi, ekran ve kabul testi eşleştirildi.
- [x] Beş ürün rolü ve ayrı platform destek operatörü için işlem/kapsam izin matrisi yazıldı.
- [x] Çok kiracılı veri sözlüğü, tenant izolasyonu, sürüm/kanıt modeli ve tehdit senaryoları tanımlandı.
- [x] Çekirdek API, olay, idempotency, upload ve raporlama sözleşmeleri yazıldı.
- [x] 26 ekran ailesinin durumları, beş rolün ana deneyimleri ve sektör akışları tanımlandı.
- [x] Tema, erişilebilirlik, görsel/ikon/eposta/sertifika asset üretim listesi ve klasör yapısı yazıldı.
- [x] GoAuthoring yerel yayın ve SCORM 1.2 export sınırı; sonraki standartlar ve isEazy doğrulama planı belirlendi.
- [x] Sağlayıcılar, veri bölgeleri, kuyruk/worker, yedekleme, gözlemleme, destek ve maliyet senaryoları seçildi.
- [x] 20 uygulama iş paketi, bağımlılık, sorumlu rol ve efor aralığı tanımlandı.
- [x] 29 kabul senaryosu ve yayın engelleyici koşullar yazıldı.

## Yapılan doğrulama ve kanıt sınırı

Statik sözleşme denetimi: [plan-validation.json](research/plan-validation.json). Bu denetim JSON başvurularını, operasyon/izin bağlarını, gereksinimlerin ekran/test/iş paketi referanslarını ve yerel belge bağlantılarını kontrol eder. OpenAPI uyumluluk sertifikası, çalışan endpoint veya güvenlik testi değildir.

Kavramsal beş rol önizlemesi: [preview-validation.json](research/preview-validation.json). 390 ve 1024 piksel genişlikte toplam 10 rol/ekran senaryosu; dört adımlı örnek etkileşim, taşma ve JavaScript hatası kontrolü. Örnek veriler kullanıldı. Müşteri kullanılabilirlik testi, tüm ürün ekranları veya WCAG uygunluk denetimi yerine geçmez.

Referans araştırması: 547 dosya envanteri, 547 ekranın üst başlık bölgesinde otomatik OCR ve 36 ekranın manuel görsel örneklem incelemesi. Tüm ekranların ayrıntılı görsel incelemesi yapılmış değildir. Kaynak görseller ve OCR olası kişisel veri içerdiği için yayın asset'i değildir.

## Uygulama ve yayın sırasında kapanacak işler

| Kapı | Gerekli çıktı | Sorumlu rol | Ne zaman engeller? |
|---|---|---|---|
| Teknik kanıt | RLS, runtime, export/import, job tekrarları | Mühendislik | İlgili modül uygulama kabulü |
| EXT01–EXT10 | Hesap/domain/marka, hukuki aktarım, lisans, örnek paket, içerik hakkı, ödeme ve operasyon girdileri | 08 belgesindeki sahipler | İlgili canlı özelliğin açılışı |
| Ürün UAT | Gerçek müşteri temsilcilerinin rol görevlerini tamamlaması | Ürün + müşteri | Pilot kabulü |
| Güvenlik ve performans | T01–T29 içinden faz kapsamındaki testler; kritik/yüksek açık yok | QA + güvenlik | Gerçek kullanıcı yayını |
| İşletim | Restore tatbikatı, alarm, destek nöbeti, rollback kaydı | Operasyon | Gerçek veri yayını |

EXT ayrıntıları [08 — Final kararlar](08-final-kararlar.md) içinde tek kaynaktır. Eksik dış girdide sentetik veriyle geliştirme sürer; ilgili entegrasyon arayüzü açıkça kurulum bekliyor gösterir. Başarı, bağlantı veya sertifika doğrulaması taklit edilmez.

## Baz çizgisi ve değişiklik kuralı

Başlangıç: davetli kurumsal portal, 500 kayıtlı/100 eşzamanlı hedef, Türkçe, ilk sektör hukuk. Bunlar açıkça seçilmiş plan varsayımlarıdır; kullanıcı tarafından teyit edilmiş bütçe/sözleşme değildir. B1 bütün ürünün tüm fazları anlamına gelmez. Geniş ürün kapsamı B1/B2/G/S ve EP01–EP20 ile eksiksiz izlenir.

Hiçbir plan sıfır hata veya değişmez gereksinim garantisi vermez. Bu kapanışın anlamı, uygulama ekibinin temel ürün/teknoloji kararlarını yeniden icat etmeden başlayabilmesi ve her çıktının nasıl kabul edileceğinin belirli olmasıdır. Gerçek dünyadaki kanıt gerektiren işler dürüstçe beklemede bırakılmıştır.
