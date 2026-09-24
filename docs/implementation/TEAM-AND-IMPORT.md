# Ekip kapsamı ve kullanıcı içe aktarımı

Tarih: 24 Eylül 2026  
Kapsam: EP02 doğrudan ekip yetkisi ve CSV önizleme

## Line manager kapsamı

`202609240005_team_scope.sql` ekipleri, ekip üyelerini ve tek transaction içinde çalışan `save_team` komutunu ekler. Komut yalnızca tenant admin tarafından çağrılır; yönetici ve üyelerin aktif ve aynı tenant içinde olduğunu, yöneticide geçerli `line_manager` rolü bulunduğunu ve beklenen revision değerini doğrular.

Önceki geçici enrollment politikası line manager'a tenant genelinde okuma verebiliyordu. Yeni policy bu geniş yetkiyi kaldırır. Line manager yalnızca:

- yönettiği aktif ekibi;
- ekipteki doğrudan üyeleri;
- bu üyelerin enrollment kayıtlarını;
- bu enrollment kayıtlarına bağlı atamaları okuyabilir.

Alt ekipler veya organizasyon ağacı örtük olarak kapsama eklenmez. Ekip üyeliği değiştiği anda RLS kapsamı aynı transaction sonucuna göre değişir. Tarayıcı rolleri `teams` ve `team_members` tablolarına doğrudan yazamaz.

## CSV içe aktarım önizlemesi

`member-import.ts`, en fazla 1 MB ve 2.000 veri satırı kabul eden bağımlılıksız bir CSV doğrulayıcıdır. Virgül/noktalı virgül, UTF-8 BOM, CRLF, quoted alan ve escaped quote destekler.

Standart başlık:

```csv
email,job_title,professional_level,role_keys,team_codes
```

Roller ve ekip kodları `|` ile ayrılır. Bilinmeyen/tekrarlı başlıklar, bozuk quote, geçersiz e-posta, yinelenen e-posta, `platform_admin`, geçersiz rol/ekip kodu, kontrol karakteri ve limit aşımı reddedilir. Çıktı geçerli satırları ve satır/alan bazlı hataları ayırır. Bu aşama preview/validation katmanıdır; kalıcı davet işleri hosted worker bağlantısından sonra üretilecektir.

## Kanıt

- `tests/team-scope.test.ts`: admin ekip oluşturma/güncelleme, revision conflict, tenant dışı üye reddi, manager salt-okunur sınırı ve atomik kapsam değişimi.
- `tests/member-import.test.ts`: Türkçe quoted veri, iki delimiter, normalize listeler, hatalı/duplicate satırlar, başlık ve boyut sınırları.

Tam regresyonda 51 test geçmektedir.
