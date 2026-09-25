# Uygulama durumu — 24 Eylül 2026

Plan v1.0 korunuyor. Kullanıcının “projeye devam et” talebiyle uygulama başladı. Aşağıdaki işler sentetik geliştirme ortamına aittir.

| Paket | Durum | Bu dilimdeki çıktı / kalan |
|---|---|---|
| EP01 | in_progress | Tenant temelinin üzerine eğitim, sürüm, program, program adımı, atama, enrollment ve kaynak şemaları ile tenant/rol RLS kuralları eklendi. Attempt, kısa ömürlü hash'lenmiş learning session, sıralı/idempotent event deposu, interaction/progress projeksiyonu ve tenant negatif testleri çalışıyor. Ayrı hostname üzerinde iframe wrapper, API discovery, resume, interaction snapshot, gerçek ZIP export/inspection ve negatif paket testleri var. Beş migration gerçek Supabase veritabanına uygulandı ve yerel/uzak geçmiş eşitliği doğrulandı. Kalan: hosted DAL/route adaptörü, ClamAV/karantina worker, üretim içerik domain'i, isEazy ve bağımsız LMS doğrulaması |
| EP02 | in_progress | Hash'li davet/kabul, güvenli rol/statü RPC'leri, doğrudan line manager ekip kapsamı, CSV preview, session iptali ve audit çalışıyor. Next.js 16 proxy, cookie tabanlı Supabase SSR client, server `getClaims`, markalı login, PKCE callback, DB rol çözümleme, MFA challenge ve POST logout eklendi. Gerçek proje URL/public anahtarı bağlandı; geçici tenant admin hesabı Auth, tarayıcı yönlendirmesi ve RLS verisiyle doğrulandı. Kalan: MFA enroll/unenroll + kritik komut AAL2 kapısı ve CSV worker |
| EP03 | in_progress | Öğrenen için atanan/devam eden/tamamlanan eğitimler ve kaynak kütüphanesi; admin için genel bakış, kullanıcılar, eğitimler, programlar, dört adımlı atama, uyumluluk, rapor ve ayar ekranları çalışıyor. Beş rol navigasyonu, responsive UI, açık/koyu tema, Lucide ikonları ve özgün hukuk akademisi hero varlığı eklendi. Admin genel bakış metrikleri ve kullanıcı tablosu canlı Supabase/RLS verisinden gelir; tenant admin beş rolün arayüzünü yetki yükseltmeden önizleyebilir. Diğer ayrıntı tablolarının bir bölümü hâlâ sentetik ve tarayıcı yerelidir |
| EP09 | in_progress | 1–8 metin bölümü, bölüm sıralama, tek quiz, tarayıcıda taslak, gerçek SCORM 1.2 ZIP indirme ve yapısal paket kontrolü. Kalıcı yerel yayın, lisans, tam blok editörü ve olay analitiği bekliyor |
| EP04–EP08, EP10–EP15 | planned | Müşteri beta modüllerinin sunucu uygulaması tamamlanmadı; yerel demo iş paketi kabulü sayılmaz |
| EP16–EP20 | planned | B2/G/S fazları |

## Kanıtların sınırı

- Tenant/membership/role/portal tablolarında kullanıcıya salt okunur yetki; mutasyonlar gelecekte dar RPC'lerle açılacak. Super admin yetkisi tarayıcı seçicisinden veya kullanıcı metadata'sından türetilmez.
- İki sentetik tenant üzerinde doğrudan ID sorgusu, rol yükseltme, composite FK, üyelik/tenant iptali, anonim erişim ve worker erişim reddi test edildi.
- Job deduplication ve lease token ile eski worker completion reddi test edildi. Üretim kuyruk servisi, heartbeat ve dead-letter operasyonları tamamlanmadı.
- Learning session token'ı yalnızca SHA-256 özetiyle tutulur. Event batch'i 50 kayıtla sınırlıdır; sıra boşluğu, değiştirilmiş idempotency gövdesi, süresi dolmuş/iptal edilmiş oturum ve tenant dışı kullanım reddedilir. `content.completed` istemci beyanı yalnızca attempt'i `submitted` yapar; doğrulanmış başarı veya sertifika üretmez.
- Davet tokenı public tabloda yalnızca SHA-256 özetiyle tutulur; ham token private worker job'ındadır. Davet kabulü giriş yapan hesabın e-postasını doğrular. Rol/statü komutları kendi hesabını değiştirmeyi, stale revision'ı ve tenant dışı erişimi reddeder; değişiklikler redacted audit üretir.
- Line manager erişimi doğrudan aktif ekip üyeleriyle sınırlıdır; tenant genelinde enrollment okuma kaldırıldı. Ekip değişimi membership/enrollment/assignment görünürlüğünü atomik değiştirir. CSV önizleme yalnızca allowlist başlıkları ve tenant rol/ekip anahtarına uygun biçimi kabul eder; kalıcı yazma worker sonrasına bırakılmıştır.
- Hosted modda session cookie `@supabase/ssr` ile request başına client üzerinden işlenir; `getClaims()` doğrulaması, PKCE callback, same-origin dönüş yolu, MFA AAL yükseltmesi ve RLS altında membership/rol çözümleme vardır. Public environment eksikken hosted auth sessizce etkinleşmez; service role browser sözleşmesinde yoktur.
- SCORM proof ayrı yerel önizleme ekranına bağlandı. Tek-SCO export, ayrı origin, resume ve choice interaction snapshot çalışıyor. Yüklenen ZIP yalnızca bellekte sınırlandırılmış yapısal incelemeden geçer; taranmış/yayımlanmış sayılmaz. Oynatıcı sadece koddan üretilen sabit sentetik fixture'ı açar. Sequencing, diğer CMI tipleri, harici LMS ve gerçek isEazy kabulü yok.
- Ön yüzdeki quiz ve demo puanı istemcide hesaplanır. Gerçek sınav/sertifika/XP için kullanılmaz; üretim puanlama sunucu tarafında EP07/08 ile yapılacak.
- Supabase proje URL/public anahtarı yerel web ortamına bağlandı ve beş migration uzak veritabanına uygulandı; Gerçek admin Auth ve tenant üyeliği kabulü tamamlandı; Storage kabulü henüz tamamlanmadı. RLS testinin Auth fixture'ı yalnızca test setup'ında bulunur, uygulamada kimlik doğrulama bypass'ı değildir.

## Teknik kaynak ve sürümler

Son doğrulama: **57 Vitest çekirdek/PostgreSQL testi ve 15 Playwright Chromium uçtan uca senaryosu**, TypeScript kontrolü ve Next üretim derlemesi geçti. `pnpm audit` son taramada sıfır bildirilen açık verdi. Yeni kapsama Supabase SSR auth policy, tenant bağlı LMS katalog/enrollment görünürlüğü, doğrudan line manager ekip kapsamı, CSV import preview, learning session/event güvenliği, davet/rol/statü komutları, öğrenen atama/kaynak akışı, admin kullanıcı yönetimi ve atama sihirbazı dahildir. Bu, hosted Supabase kabulü, tam WCAG veya gerçek kullanıcı yük testi değildir.

Yeni akışlarda manifest, ZIP CRC/boyut/yol/şifreleme/symlink kontrolü, XML DTD reddi, inert yazar metni, API origin/boyut sınırı ve sahte postMessage reddi doğrulandı. İlk turda Next'in localhost/127.0.0.1 URL normalizasyonu indirmeyi engelledi; iki açık loopback Host değeri üzerinden tam Origin eşleşmesiyle düzeltildi, tekrar testleri geçti. Teknik ayrıntı ve çalıştırma: [SCORM-PROOF.md](SCORM-PROOF.md).

Makine okunabilir özet: [verification.json](verification.json). Ayrıntılı tarayıcı sonucu yerelde `test-results/browser-results.json`; masaüstü/açık/koyu ve mobil ekran görüntüleri aynı klasörde. GitHub Actions iş akışı yazıldı ve kaynak kod main dalına yayımlandı; ilk uzak iş akışı sonucu ayrıca izlenecek.

Next.js 16.3.5 ve React 19.3.0 npm kayıt sistemiyle doğrulanıp sabitlendi. [Next.js güvenlik duyurusu](https://nextjs.org/blog/august-2026-security-release) incelendi. RLS yaklaşımı [Supabase resmî dokümanı](https://supabase.com/docs/guides/database/postgres/row-level-security) ile karşılaştırıldı. İlk taramada eski Vitest geliştirme bağımlılığına ait açıklar bulundu; Vitest 5.0.1'e geçildi, sonraki tam bağımlılık taramasında bildirilen açık kalmadı. Bu sonuç gelecekteki açıklar için garanti değildir.

## Sonraki somut uygulama işi

EP01'i kapatmak için hosted DAL/route adaptörü, worker adaptörü, karantina taraması, üretim içerik domain'i ve harici paket/LMS kanıtları gerekiyor. EP02'nin sıradaki işi bağlı projede gerçek Auth kullanıcı testi, MFA yönetimi/kritik işlem AAL2 ve CSV worker'dır. EP04 portal kurulum komutları bu temeli tenant fabrikasına bağlayacak. Ayrıntılar: [AUTH-SSR.md](AUTH-SSR.md), [LEARNING-RUNTIME.md](LEARNING-RUNTIME.md), [IDENTITY-COMMANDS.md](IDENTITY-COMMANDS.md) ve [TEAM-AND-IMPORT.md](TEAM-AND-IMPORT.md).
