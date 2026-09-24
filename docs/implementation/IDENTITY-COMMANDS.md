# Kimlik ve üyelik komutları uygulama notu

Tarih: 24 Eylül 2026  
Kapsam: EP02 davet ve üyelik yönetimi veri katmanı

`202609240004_identity_commands.sql`, tarayıcıya tablo yazma yetkisi vermeden dört dar komut sağlar:

- `invite_member`: tenant admin yetkisini veritabanından doğrular, e-postayı normalize eder, rol allowlist'ini kontrol eder ve idempotent davet işi oluşturur.
- `accept_member_invitation`: tek kullanımlık token, süre ve giriş yapan hesabın doğrulanmış e-posta eşleşmesini kontrol ederek üyeliği etkinleştirir.
- `replace_member_roles`: beklenen revision ile eşzamanlı güncelleme çakışmasını yakalar; kullanıcının kendi rolünü değiştirmesini engeller.
- `set_member_status`: gerekçeli askıya alma/ayrılma işlemi yapar, kullanıcının kendi hesabını kapatmasını engeller ve aktif learning session lease'lerini iptal eder.

Davet tokenının ham değeri `invitations` tablosunda tutulmaz; SHA-256 özeti saklanır. Ham token yalnızca erişimi kapalı job payload'ında e-posta worker'ına teslim edilmek üzere bulunur. Yeniden davet önceki bekleyen daveti iptal eder. Aynı idempotency key aynı gövdeyle aynı sonucu döndürür, değiştirilmiş gövdeyi reddeder.

Üyelik ve rol değişiklikleri PII içermeyen `audit_events` kaydı üretir. Rol/statü değişimi ayrıca auth session yenileme veya iptal worker işi oluşturur. Hosted Supabase Auth adapter'ı bu işleri Supabase Admin API ile işleyecektir; service-role anahtarı tarayıcıya verilmeyecektir.

## Kanıt

`tests/identity-commands.test.ts` gerçek PostgreSQL WASM üzerinde şunları doğrular:

- idempotent davet ve değiştirilmiş replay reddi;
- tenant dışı kullanıcının davet oluşturamaması;
- davet e-postası ile giriş hesabı eşleşmeden kabul edilememe;
- güvenli üyelik/rol oluşturma;
- self-role ve self-suspension yasağı;
- optimistic revision conflict;
- üyelik askıya alınınca learning session iptali;
- audit kaydında tam e-posta bulunmaması;
- browser rolünün membership ve audit tablolarına doğrudan yazamaması.

Supabase Auth e-posta teslimi, MFA freshness, session cookie/DAL, ekip kapsamı ve CSV içe aktarımı EP02'nin kalan işleridir.
