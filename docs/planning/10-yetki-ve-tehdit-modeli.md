# İzin matrisi ve tehdit modeli v1.0

İzinler UI kontrolü değildir; tüm query, mutation, export, realtime ve storage yollarında uygulanır. Ek dosyanın izin sınırı bağlı olduğu ana nesneden daha geniş olamaz. Bu doküman ve [makine matrisi](contracts/permissions.csv) aynı başlangıç rol setini tanımlar.

## Kapsam anlamları

- `platform`: platform kayıtları; tenant içeriği dahil değildir.
- `tenant`: aktif tenantın izinli kayıtları.
- `assigned`: instructor'ın atandığı içerik/oturum/öğrenen teslimi.
- `team`: manager'ın geçerli doğrudan ekip üyeleri; üst/alt ağaç erişimi ayrı izin ve yalnızca G.
- `own`: kişinin kendi üyelik/atama/başvuru/ticket'ı.
- `audience`: yayın hedefinde olduğu ve lisansı uygun içerik.
- `support_grant`: süreli/gerekçeli destek erişimi; bağlı ticket scope'u.
- `none`: reddet; birden fazla rol varsa uygun izinlerin birleşimi, açık yasak/ayrılık kuralları daha öncelikli.

## Ayrılık kuralları

Kendi dış sertifikasını, kendi muafiyetini veya kendi instructor değerlendirmesini aynı kişi onaylayamaz. Tenant admin kendi hesabına platform izni atayamaz. Manager rolü destek iç notlarına veya ekip anket cevaplarına otomatik izin vermez. Platform admin rolü learner özel mesajları/cevapları için örtük `tenant` erişimi değildir.

Rol değişikliği/üyelik iptali olayında session revoke ve server permission cache invalidation; maksimum 60 sn normal query cache, kritik grant/pay/grade/publish/export/download işleminde DB üyelik kontrolü. Yetkisiz nesne okumada 404, giriş yapılmamışta 401; yetki var ancak eylem eksikse 403. İzin kararlarında kişisel not/token loglanmaz.

## Kontrol düzlemi

Control panel `control.respongo.com` host'u planıdır; hostname kurulmadan geliştirmede ayrı localhost portu kullanılır. Host-only session cookie, platform audience ve tenant uygulamasından ayrı OAuth redirect listesi. Kullanıcı auth kimliği global olabilir; platform rol kaynağı private platform schema ve server-only yetkilendirmedir.

Tenant uygulaması path bazlı ortak origin'i paylaşır. Buna göre tenant A'nın eklediği herhangi bir HTML/JS veya SVG'nin tenant B oturumunda çalışmasını engellemek kritik güvenlik koşuludur. Kullanıcı custom JS/CSS yok; zengin metin allowlist sanitizer; tenant CSS yalnızca doğrulanmış tokenlar. Preview/cache anahtarı portal/brand/version ve erişimle ayrılır.

## Öğrenme kanıtı güven seviyeleri

| Kaynak | Etiket | Kullanım |
|---|---|---|
| Dış bağlantı tıklama / PDF okudum | self_attested | Katılım/öz gelişim; yüksek güvenli sınav yerine geçmez |
| SCORM paketi bildirdi | reported | Paket sonucu; native server sınavıyla desteklenebilir |
| Yerel server quiz | verified | Kurala göre score/pass; gerçek kişi kimliğini biyometrik doğruladığı iddiası yok |
| Instructor rubriği | reviewed | Kimlikli uzman onayı ve kaynak teslimi |
| Provider katılım raporu | provider_verified | Eşlenmiş kullanıcı, süre/katılım; öğrenme başarısı ayrı |

İçerik sunan JavaScript score/success taklit edebilir; bunu yalnızca `postMessage` origin kontrolü çözmez. Uyum kuralı hangi kanıt seviyesini kabul ettiğini açık belirtir.

## Tehdit kaydı

| ID | Tehdit / giriş | Kontrol | Kanıt |
|---|---|---|---|
| SEC01 | IDOR/tenant kaçışı: ID, rapor, arama, cache | RLS + bileşik FK + server scope + cache partition | T01, T02 |
| SEC02 | Tenant custom HTML/SVG kaynaklı XSS | Allowlist sanitize, CSP nonce, SVG rasterize, custom script yasağı | T11, T18 |
| SEC03 | Ayrıcalıklı server/worker rolü kötüye kullanımı | Dar RPC, sabit search_path, grant en az yetki, tenant context | T01, T02, worker fault test |
| SEC04 | SCORM package origin/session hırsızlığı | Ayrı site/origin, session-bound credential, no auth cookie, API shim | T06, T11 |
| SEC05 | ZIP bomb/traversal/XXE/SSRF | Boyut/sayı/zaman sınırı, XML entity kapalı, private IP block | T11 |
| SEC06 | Completion/puan/sertifika replay | Idempotency, unique source, immutable ledger, transaction outbox | T08 |
| SEC07 | Provider webhook taklidi/sırasız olay | Sağlayıcı doğrulaması, kayıtlı binding, inbox dedupe, fetch reconcile | T14 |
| SEC08 | OAuth redirect/account takeover | PKCE/state/nonce, kesin redirect allowlist, authenticated binding | T03 + OAuth deny test |
| SEC09 | Support iç not/ek sızıntısı | Üç görünürlük kanalı, scope grant, yeniden yetkilendirilen dosya | T17 |
| SEC10 | AI prompt injection/veri ifşası | İzinli semantic query, aggregate-only, şema validasyonu, no tool authority | T21 |
| SEC11 | Kaynak tüketim saldırısı | User/tenant/IP rate limit, upload/job quotas, timeout, cost alerts | T19, T22 |
| SEC12 | CSV formül enjeksiyonu/export sızıntısı | Tehlikeli hücre prefix escape, auth download, TTL | T16 |
| SEC13 | Secret/PII log/preview sızıntısı | Redaction, sentetik preview, secret scan, separate env | CI + T01 |
| SEC14 | Veri kaybı/yedek yetersizliği | DB/object ayrı yedek, restore denemesi, purge manifest | T20 |
| SEC15 | Anonim anket yeniden kimliklendirme | Ayrı yanıt altyapısı, min 5, dar filtre yasakları, metadata minimizasyonu | T15 |
| SEC16 | Eposta linkinden açık yönlendirme | Relative/path allowlist, token hash/expiry, no query secrets | T05 |
| SEC17 | G sürümü ödeme replay/iade suistimali | Signed webhook, server verify, amount/currency/order match, unique provider ref | G ödeme testleri |

## Güvenlik başlıkları ve oturum

TLS zorunlu, HSTS domain doğrulama sonrası; portal CSP `frame-ancestors 'self'`, izinli medya/frame domainleri; `object-src 'none'`, referrer policy sensitive route için no-referrer; dosya yanıtında nosniff. Runtime CSP farklı, yalnızca öğrenme için gereken izinli kaynaklar. Cookie Domain=.respongo.com kullanılmaz. Session idle hedefi admin 30dk/learner 8 saat; kritik eylem MFA tazeliği 15dk. Platform operasyon oturumu 15dk idle, 8 saat max; bu süreler uygulama server policy'sinde, yalnızca UI timer'da değil.

Rate limit başlangıcı: login 10/15dk IP + hesap; şifre reset 3/saat hesap; normal okuma 120/dk kullanıcı; mutasyon 30/dk; öğrenme event 120/dk/session ve batch max 100; export 5/saat admin; SCORM publish 10/saat/tenant. Worker platform global concurrency 4 pilot, tenant başına 1 ağır iş. 429 Retry-After, kendini düzeltme yolu. Dağıtık limit state'i Postgres atomic counter/RPC; process memory değil.

## Yayın için güvenlik bitiş tanımı

SEC01–SEC17 ilgili sürüm testleri + iki tenant adversarial test + erişim/secret review. B1 gerçek veri yayını öncesi ikinci insan/bağımsız güvenlik incelemesi planlı iş olarak zorunlu; bu turda yapılmış sayılmaz. ISO/SOC/akreditasyon etiketi ancak platformun kendi kapsamı doğrulanırsa kullanılır, bulut sağlayıcısının belgesi otomatik miras alınmaz.
