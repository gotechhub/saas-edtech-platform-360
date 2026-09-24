# Öğrenme runtime uygulama notu

Tarih: 24 Eylül 2026  
Kapsam: EP01 kalıcı öğrenme oturumu ve olay deposu

`202609240003_learning_runtime.sql` migration'ı browser'ın doğrudan tablo yazmasına izin vermeden şu zinciri kurar:

1. `begin_learning_session(enrollment_id)` aktif kullanıcı üyeliğini ve aktif course atamasını doğrular.
2. İlk girişte attempt açar; resume sırasında aynı devam eden attempt için eski write lease'i iptal eder.
3. İstemciye iki saatlik rastgele session token döner; veritabanında yalnızca SHA-256 özeti tutulur.
4. `ingest_learning_events(token, batch)` en fazla 50 olayı sunucu sırasıyla kabul eder.
5. Tenant, learner, enrollment ve attempt istemci gövdesinden alınmaz; session kaydından türetilir.
6. Aynı event kimliği ve aynı gövde güvenli retry olarak ACK alır. Değiştirilmiş gövde veya sıra boşluğu reddedilir.

Desteklenen B1 olayları `content.started`, `block.viewed`, `interaction.submitted`, `content.completed` ve `runtime.commit` olaylarıdır. Eventler immutable tutulur; etkileşim ve ilerleme projeksiyonları ayrıca üretilir. `content.completed` yalnızca attempt'i `submitted` durumuna getirir. Başarı, sertifika ve kesin tamamlama kararı istemci beyanından üretilmez; EP07 politika/puanlama motoru tarafından doğrulanacaktır.

RLS ile kullanıcı yalnızca kendi attempt, session, event, interaction, progress ve completion kayıtlarını okuyabilir. Tenant admin/eğitmen için yalnızca gerekli özet tablolarda okuma vardır. `authenticated` ve `anon` rolleri tablolara doğrudan yazamaz.

## Kanıt

`tests/learning-runtime.test.ts` aşağıdaki davranışları gerçek PostgreSQL WASM üzerinde doğrular:

- attempt ve kısa ömürlü session oluşturma;
- event sırası, etkileşim kaydı ve submitted projeksiyonu;
- aynı paketin idempotent yeniden gönderimi;
- değiştirilmiş event kimliği ve sıra boşluğu reddi;
- başka tenant kullanıcısının sızmış token ile yazamaması;
- resume işleminde önceki write lease'in iptal edilmesi;
- browser rolünün event tablolarına doğrudan yazamaması.

Hosted Supabase bağlantısı, HTTP DAL/route adaptörü, SCORM oynatıcısının bu RPC'lere bağlanması ve completion policy worker'ı sonraki dilimlerdir.
