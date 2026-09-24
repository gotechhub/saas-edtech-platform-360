# Hosted Supabase Auth ve SSR oturum katmanı

Tarih: 24 Eylül 2026  
Kapsam: EP02 Next.js 16 SSR auth adaptörü

Uygulama Supabase'in resmi `@supabase/ssr` ve `@supabase/supabase-js` paketlerini kullanır. Session, browser local storage yerine cookie tabanlı PKCE akışında taşınır. Next.js 16 `proxy.ts`, her request için yeni Supabase client oluşturur, `getClaims()` ile tokenı doğrular ve yenilenen cookie'leri yanıta yazar. Auth yanıtlarında `Cache-Control: private, no-store` kullanılır.

## Ortam sözleşmesi

`.env.example` içindeki iki public değişken birlikte tanımlanmalıdır:

```text
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Eksik çift uygulamayı hosted auth modunda başlatmaz. Uzak Supabase URL'si HTTPS olmak zorundadır. `service_role` anahtarı bu sözleşmede bulunmaz ve browser/Next public environment'a konulmaz.

## Akış

1. Portal sayfası doğrulanmış claim olmadan markalı `/giris` sayfasına yönlendirir.
2. Giriş server action üzerinden e-posta/parola doğrular ve cookie session üretir. Sağlayıcı hata ayrıntısı kullanıcı hesabı keşfine izin vermeyecek ortak mesajla gösterilir.
3. Portal tenantı URL slug'ından bulunur; aktif membership ve rol atamaları RLS altında sorgulanır.
4. UI rolü `tenant_admin → admin`, `instructor → instructor`, `line_manager → manager`, aksi durumda `learner` olarak DB rollerinden türetilir. Hosted modda rol önizleme seçicisi kapalıdır.
5. Kayıtlı MFA faktörü varsa ve oturum AAL2 değilse `/mfa` challenge ekranına yönlendirilir.
6. Davet/magic-link PKCE kodu `/auth/callback` üzerinden session'a çevrilir. `next` yalnızca aynı origin relative path olabilir.
7. Çıkış yalnızca POST ile çalışır, foreign Origin reddedilir ve local session kapatılır.

Demo ortamında iki Supabase değişkeni yoksa mevcut sentetik rol önizleme çalışmaya devam eder. Production ortamında ne Supabase bağlantısı ne de açık demo flag'i varsa kurulum ekranı gösterilir.

## Kanıt ve sınır

`tests/auth-policy.test.ts`, tam/eksik environment, HTTPS zorunluluğu, local Supabase istisnası, rol önceliği, open redirect reddi ve AAL yükseltme kararını doğrular. Toplam 57 çekirdek testi, TypeScript kontrolü ve Next production build geçmiştir. Mevcut 15 Playwright senaryosunun tamamı yeni auth proxy altında demo modunda başarılı çalışmıştır.

Gerçek hosted kabul için Supabase proje URL/publishable key, redirect allowlist, e-posta sağlayıcısı ve test kullanıcıları gereklidir. MFA enroll/unenroll ayar ekranı ve admin kritik komutlarında zorunlu AAL2 kontrolü sonraki dilimdedir.

Kaynak yaklaşım: [Supabase Server-Side Rendering](https://supabase.com/docs/guides/auth/server-side), [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa).
