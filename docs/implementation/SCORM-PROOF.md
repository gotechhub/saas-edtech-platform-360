# SCORM ve GoAuthoring teknik dilimi

Bu dilim EP01 teknik kanıtını ve EP09'un küçük bir taslak/editör dilimini içerir. Tek-SCO SCORM 1.2 alt profili, tam uyumluluk sertifikası değildir.

## Yerel çalıştırma

İki terminal:

```powershell
pnpm dev
```

```powershell
pnpm content:proof
```

- Akademi: http://127.0.0.1:3000/avukat/oguzlawacademy
- Taslak/editör: http://127.0.0.1:3000/lab/authoring
- Sabit örnek paket oynatıcısı: http://127.0.0.1:3000/lab/scorm
- İçerik sunucusu: http://localhost:3101 (yalnızca loopback dinler).

Üretim derlemesi yerel önizlemede `RESPONGO_DEMO_ENABLED=true` ister. Lab sayfaları ve API'leri ayrıca loopback host kontrolü yapar. API mutasyonlarında origin tam eşleşmelidir. Bu demo protokolü gerçek kimlik doğrulama yerine kullanılamaz.

## Taslak → ZIP → kontrol

Editörde 1–8 metin bölümü ve tek bir çoktan seçmeli soru bulunur. Bölüm ekleme/kaldırma/yukarı taşıma, doğru seçenek belirleme, tarayıcıda taslak kaydetme ve SCORM ZIP indirme çalışır. ZIP dört dosyadan oluşur: manifest, HTML, JavaScript ve CSS. Uzun ömürlü anahtar, dış ağ kaynağı veya gerçek öğrenci kimliği içermez. Metinler DOM'da textContent ile, XML/JavaScript bağlamlarında uygun kaçışla üretilir.

İndirilmiş ZIP yapısal inceleme için seçilebilir. Bu endpoint dosyayı yalnızca sınırlandırılmış bellekte okur; diske çıkarmaz, yayımlamaz, oynatmaz veya Storage'a yazmaz. `scanStatus=not_scanned` zorunludur; ClamAV/paket karantina worker'ı bağlanmadan bir yükleme temiz kabul edilmez. Örnek oynatıcı yalnızca koddan üretilen sabit sentetik fixture'ı açar; kullanıcının yüklediği paketi açmaz.

Bu aşama için sıkı sınırlar: 20 MB ZIP, 50 MB açılmış toplam, 10 MB tek dosya, 1.000 kayıt, 256 KB manifest, 100:1 sıkıştırma oranı. Gerçek worker için final plandaki daha geniş kapasite ancak kaynak sınırı ve güvenlik testleriyle açılır.

## Ayrı origin ve kayıt köprüsü

Portal `127.0.0.1:3000`, içerik `localhost:3101` üzerindedir; yalnızca farklı port kullanılmaz, hostname de ayrıdır. Bu, yerel topoloji kanıtıdır; gerçek wildcard DNS/TLS ve paket sürümü başına origin hâlâ yayın işidir.

Dış iframe yalnızca `allow-scripts allow-same-origin` kullanır. Top navigation, popup, form ve indirme izinleri verilmez. İçerik CSP'si harici script, ağ bağlantısı, form ve object yüklemesini kapatır. Paket ve wrapper aynı içerik origin'indedir; SCO, parent.API üzerinden senkron SCORM 1.2 API'sini bulur. İçerik alanına Supabase JWT veya portal cookie'si verilmez.

`postMessage` tam origin, frame source, nonce, sıra ve CMI alan doğrulamasından geçer. Nonce URL fragment'ındadır. Commit önce yerel kuyruğa kabul edilir; uzaktan başarı iddiası değildir. Portalın tarayıcı kaydı başarılı olunca ACK döner. ACK alınmayan kayıtlar 30 saniyeye kadar yeniden gönderilir; aynı sequence/aynı payload yeniden ACK alır, farklı payload reddedilir. Ağ kesintisinde sunucuya kalıcı kayıt yapılmış sayılmaz. Demo state'i dışarıdan değiştirilebilir; gerçek başarı, sertifika veya XP üretmez.

Desteklenen soru kaydı: en fazla 100 `choice` interaction; id, type, student_response, correct_responses.0.pattern, result. Yazma sırası ve değerler kontrol edilir; interaction ayrıntıları SCORM 1.2 API'sinde write-only, count read-only'dir. Yeniden açılışta location/suspend data ve son snapshot geri verilir. Bu snapshot, bütün yanıt geçmişini tutan immutable olay deposu değildir.

## Henüz kabul edilmeyen işler

Gerçek Supabase learning session/lease, sunucu olay deposu, worker kimliği, tarama/lisans denetimi, kullanıcı paketinin izole yayını, dış LMS ve isEazy gerçek paketleri, tüm CMI tipleri, session time birikimi, çok-SCO/2004/xAPI ve tam authoring analitiği bu dilimle tamamlanmış sayılmaz.

## Referanslar

- [yauzl — lazyEntries ve validateEntrySizes](https://github.com/thejoshwolfe/yauzl)
- [Rustici — SCORM 1.2 geliştirici özeti](https://scorm.com/scorm-explained/technical-scorm/scorm-12-overview-for-developers/)
- [Rustici — içerik paketleme](https://scorm.com/scorm-explained/technical-scorm/content-packaging/)
