# API, olay ve otomasyon sözleşmesi v1.0

Makine sözleşmesi: [OpenAPI](contracts/openapi.json). Bu dosya çekirdek komutları ve okuma projeksiyonlarını tanımlar; çalışan sunucu değildir. Kimlik sağlayıcısı login/MFA/reset protokolleri Supabase SDK'sı üzerinden yürütülür, parola/tokenları yeniden tasarlanmış genel CRUD'a sokulmaz. Sağlayıcı webhook şekilleri sağlayıcının resmî sürümüne bağlıdır; aşağıdaki adaptör sınırlarında normalize edilir.

## HTTP değişmezleri

Tenant API `/api/v1/portals/{portalId}/…`, platform `/api/v1/platform/…` ayrı control host. Public URL slug'ı sunucuda portalId'ye çözülür. Girişsiz markalı login bilgisi ayrı public projection'dır: yalnızca yayımlanmış isim/logo/tema; tenant kişileri, secrets, kullanım sayıları yok.

Session cookie gerçek auth oturumuna server-side eşlenir. İstemci tenant veya role iddiası değil, aktif DB üyeliği yetkilendirir. Mutasyonlar CSRF + Idempotency-Key; learning session token yolu CSRF yerine dar bearer yetkisi. İdempotency kaydı aynı aktör/tenant/route/key/body hash ile 24 saat tutulur; aynı key farklı gövde 409. Worker'a aktarılan işlem kaynak benzersizliği 24 saatin ötesinde DB kısıtıyla korunur.

200: kalıcı işlem sonucu; 202: kaydedilmiş job; 409: revision/duplicate/conflict; 413: boyut; 422: alan/kural; 429: Retry-After. Kaynağa yetkisiz okumada 404. Her yanıt trace_id taşır; runtime credential ve imzalı URL cache/log dışıdır. OpenAPI success code'ları kontrattır; create için ayrı 201 zorunluluğu yok.

Liste Page yalnızca id/title/state/revision özetidir; detail route tipli projection döndürür. Pagination `(created_at,id)` sıralı opaque cursor; limit 25 varsayılan, 100 maksimum; cursor tenant/filtre hash'ine bağlı, tenant değişince geçersiz. Ham SQL, keyfi tablo veya keyfi sort kolonu gönderilemez. Kullanıcı display name veya email ile query yapılacaksa alan allowlist'i vardır.

### Amaç ve rol kontrolü

- `member.manage` sadece admin; kullanıcı kendi temel profilini `profile.manage` ile değiştirir, kendi üyelik status/rolünü değiştiremez.
- `asset.upload` dosya amacına göre: logo admin, course/scorm editör, certificate learner kendi başvurusu, ticket kendi erişilebilir ticket'ı; upload tamamlamada aynı kaynak yetkisi yeniden doğrulanır. MIME uzantıya göre değil içerik taramasıyla belirlenir.
- Message şeması ortak olsa da comments/chat için `public` zorunlu; ticket `tenant_internal` yalnızca tenant admin, `platform_internal` yalnızca yetkili platform operatörü. “public” internet herkesi değil ilgili conversation/ticket taraflarını ifade eder.
- Grade/claim/review kendi kendini onaylama yasağına tabidir. Body içindeki grader/actor/tenant alanları kabul edilmez.
- Job sorgusu yalnızca oluşturan veya ilgili yetkili admin; member.read izni bütün ekip işlerine erişim sağlamaz.
- B1 API'de B2 format/anonim form/provider alanı gelirse 422 FEATURE_NOT_AVAILABLE; şemada enum bulunması lisans veya teslim kanıtı değildir.

## Atama ve sürüm geçişi

`preview`: hedef sürüm + manuel kişi/grup → immutable etkilenen kişi snapshot'ı, excluded nedenleri, hash, expires_at=15dk. `apply`: preview_id/hash → hedef/due/izin tekrar kontrolü → duplicate atamalar atlanır, outbox oluşturulur. Süre dolumu veya önemli membership/version değişimi 409 ve yeni önizleme ister; eski önizlemenin kapsamı sessizce büyütülmez.

Version publish kontrolü: izin, beklenen revision, tüm referenced asset scan=clean, geçerli lisans, zorunlu blok/soru bütünlüğü, önkoşul döngüsü yok, uzman incelemesi gerekiyorsa onay. Başarı yeni sürümü görünür yapar; mevcut sürüm retired olsa da geçmiş kanıta erişim policy'si korunur.

Canlı atamayı yeni sürüme taşıma B2 komutu: eski/yeni stable step key'lerini eşle; değişmeyen course_version tamamlamasını taşı; değişen içerik yalnızca onaylı equivalency varsa taşınır. Önizleme gereklidir. Sertifika snapshot'ı ve eski atama geçmişi değişmez.

## Öğrenme olayları

Zarf: event_id, sequence, type, occurred_at, payload. Tenant, learner, attempt, içerik version ve source server session kaydından alınır. `occurred_at` istemci zamanı; sıralama ve kabul server sequence/received_at'a göre. Aynı event ID farklı payload hash ile gelirse 409; aynı id/aynı payload yeniden ACK.

| Olay | payload şeması | Etki |
|---|---|---|
| content.started | object_key:string | Başlangıç; tamamlanma yok |
| block.viewed | block_id:uuid, visible_seconds:int 0..30 | Geçerli blok exposure; süre sayacı kontrollü |
| interaction.submitted | block_id, response_id:uuid, response:string/string[], elapsed_seconds:int | İzinli interaction ve schema; success istemciden alınmaz |
| content.completed | object_key:string | Bitiş talebi; policy motoru tamamlanmayı doğrular |
| runtime.commit | profile=scorm12_single_v1, changes: izinli cmi anahtar/değer map | Profil datatype/length kontrolü ve async persistence |

Native assessment.submit endpoint'i cevap snapshot'ını server'a teslim eder; quiz content.completed event'i not vermez. SCORM changes yalnızca runtime spesifikasyonu alanları; `cmi.core.student_id` ve lesson_mode gibi read-only alanlar yazılamaz. Session scope dışı object/block ID reddedilir.

ACK accepted_event_ids + persisted_sequence + server_time. İstemci ACK almadan kaydedildi yazmaz. IndexedDB geçici kuyruk yalnızca mevcut tenant/session ve kısa oturum kapsamı; logout/tenant değişiminde temizlenir. B1 offline eğitim tamamlaması yok; bağlantı gelince tekrar gönderim vardır. Eski session süresi dolarsa kullanıcı resume başlatır, eski eventlerin hangi session'a ait olduğu korunarak kontrollü uzlaştırılır.

xAPI adaptörü: sağlayıcı statement ID/registration/actor eşlemesi → izinli verb/object profile → immutable kaynak kaydı → iç olay. Kaynak başarıyı sonradan düzeltirse yeni amendment olayı, eski olay silinmez. Tam LRS endpoint'leri SCORM Cloud tarafındadır; internal event endpoint'i xAPI standardı diye sunulmaz.

## GoAuthoring doküman şeması

Root: schema_version=1, project_id, locale, title, pages[]. Page: id (kalıcı UUID), title, position, blocks[]. Block: id (kalıcı UUID), type, required, config. İzinli type'lar: text/image/video/resource/accordion/flashcard/single_choice/multiple_choice/true_false/matching/ordering/survey/case_response.

Config ayrımı: text→sanitized rich text AST; image→asset_id/alt/crop; video→asset_id/captions_asset_id?; resource→asset_id; accordion/flashcard→items[{id,title,body}]; choice→question_version_id; matching/ordering→question_version_id; survey→form_version_id; case_response→prompt/rubric_version_id/accepted_mimes. Raw script/style/iframe/embed HTML kabul edilmez. Ekleme sonrası stable ID değişmez; kopyala yeni ID üretir.

Edit lease 120sn, 30sn heartbeat; aynı projede başka aktif editör read-only. Save base_revision_id optimistic concurrency; stale 409, kullanıcının taslağı indirme/kopyalama seçeneği. Autosave debounce 2sn, en fazla 10sn aralık; sayfa terk etmeden kaydetme durumu görünür.

Export SCORM 1.2: tek SCO, manifest + taşınabilir HTML/JS/assets, API discovery wrapper, score/status/location/suspend_data/interactions eşlemesi. 1.2 suspend_data limitini aşan taslak için “resume tümünü saklar” garantisi yok; exporter kompakt resume state'i sınırı aşarsa yayın reddi/etkileşim tasarımını azaltma önerisi. Dışarıda server grading yok; paket self-contained answer key içerir ve yüksek güvenli sınav amacı taşımaz.

## Otomasyon/workflow

B1 allowlist trigger: member.activated, assignment.created, assignment.due_soon, assignment.overdue, learning.completed, certificate.expiring, session.starting, ticket.updated, trial.expiring. Conditions: tenant/role/group/course/program/days. Actions: in_app_notification, email, admin_task. B2 assign_program, request_review, report_run ve görsel editör eklenir.

Workflow DAG; cycle ve max 20 node kontrolü. Context'in root_event_id zinciri maksimum 3 workflow hop; action'ın ürettiği olaya aynı workflow sürümü tekrar tetiklenmez. Test mode kimseye mesaj atmaz; alıcı/şablon/veri önizlemesi üretir. Yayında workflow snapshot sabit, mevcut run yeni taslağa geçmez.

Zaman: günlük/haftalık/aylık, yerel timezone; günlük 09:00 varsayılan, aylık 1–28 gün seçimi. DST'de olmayan saat sonraki geçerli an, iki kez oluşan saat ilk occurrence; schedule occurrence key yerel tarih+saat+timezone. Hafta sonu erteleme B2 opsiyon, B1 açık seçime göre sabit.

Retry tablosu: notification 1/5/30dk, sonra dead letter; import/publish 1/5/15dk en fazla 3 yeniden deneme; provider 429 Retry-After, 5xx 1/5/15/60dk; 401 bir token refresh sonra reconnect; 4xx validation kalıcı hata. Fencing token eski worker'ın sonucu sonradan yazmasını engeller. Dead letter görünümü trace, neden, tekrar dene ve çözüm adımı içerir; secret içermez.

## Rapor veri kümeleri

| Dataset | B1 kolon/ölçü | Yetki |
|---|---|---|
| progress | learner, course/program, assignment, due, completion_bp, success, completed_at | own/team/assigned/tenant |
| assessment | learner, assessment_version, attempt, score_bp, pass, graded_at; soru cevabı ayrı izin | own/assigned/tenant; manager özet |
| compliance | learner, requirement, cycle, due, state, evidence_valid_until, exemption | team/tenant; learner own |
| certificates | learner, title, serial, issue, expiry, revoked, external_review | own/team/tenant |
| usage | gün, etkin learner, ölçülen/bildirilen süre, aktif session | admin aggregate, own history |
| readiness | need, owner, strategy, required_count, approved_count, readiness_bp, blocked_reason | admin; manager kendi talepleri |
| support | ticket, state, priority, age, first_response, resolution; body yok | own/tenant/platform metadata |
| attendance | event, occurrence, learner, matched, seconds, decision, source | own/assigned/tenant |
| gamification | learner, period, XP, rank, badge; hidden learner public dışı | tenant audience/own |

Form cevapları bu genel report builder'a eklenmez; form.results ayrı kapsamlı endpoint. Bir filtre kolonu seçildiğinde izinli olmayan join açılmaz. Toplam ve sayfalı sonuç aynı koşulları kullanır. XLSX/CSV formül enjeksiyonu escape; PDF uzun isim/sütun taşma kontrolü. Export private asset; 7 gün TTL, indirmede yeniden auth, schedule alıcıları tenant üyeleridir. B1 keyfi dış email alıcısı yok.

## Entegrasyon bağlama

OAuth connect yalnızca admin oturumunda; state=tenant+admin+provider+nonce kayıt referansı, 10dk TTL; PKCE destekleniyorsa zorunlu; callback host allowlist. Provider hesabı başka tenant'a bağlıysa kopyalama ancak açık admin yeni bağlantısıyla yapılır. Bağlantı durumu disconnected/connecting/active/degraded/revoked. Health: kapsam, refresh ve en son başarı; gerçek kullanıcı token'ı UI'a dönmez.

İçe gelen webhook sadece bağlantıyı bulmak için external account ref kullanır; payload tenant_id güvenilmez. Provider'a özgü doğrulama başarısızsa 401/400, başarılı inbox kaydından sonra 2xx, asenkron işlemede hata kullanıcı webhook çağrısını yeniden çalıştırma nedeni değildir. Provider raporu alınamadığında manuel inceleme; “yoklama başarısız” ile “katılmadı” ayrılır.
