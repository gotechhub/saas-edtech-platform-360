# Respongo Learning · Oguz Law Academy

Geliştirme sürümü: Next.js portal, sentetik öğrenme demosu, GoAuthoring ilk taslak editörü ve izole SCORM teknik kanıtları. **Müşteri kullanımına hazır beta değildir.**

## Proje takibi

- [Görsel proje panosu](proje-takip.html)
- [Markdown proje durumu](proje-takip.md)

Takip verisinin tek kaynağı `project-tracker.json` dosyasıdır. Modül veya görev durumu değiştiğinde `pnpm tracker:update` komutu Markdown, kök HTML ve portalın `/proje-takip.html` çıktısını birlikte yeniler. `pnpm tracker:check` dosyaların aynı kaynaktan üretildiğini doğrular.

## Çalıştırma

Node 24 ve pnpm 11.19.0 ile:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Yerel adres: http://127.0.0.1:3000/avukat/oguzlawacademy

Üretim derlemesini yerelde incelemek için:

```powershell
pnpm build
$env:RESPONGO_DEMO_ENABLED='true'
pnpm --filter @respongo/web start
```

Üretim modunda bu bayrak yoksa portal kurulum ekranı gösterir. Demo veri kaynağı Supabase'e bağlı değildir. Gerçek kullanıcı/parola/kişisel veri girmeyin. Rol seçimi bir kimlik veya yetki mekanizması değildir. Tarayıcıdaki `respongo:oguzlawacademy:demo:v1` anahtarı yalnızca sentetik demo ilerlemesini tutar.

Hosted kimlik doğrulama için `.env.example` dosyasını `.env.local` olarak kopyalayıp Supabase proje URL'si ve publishable key'i girin. İki değer birlikte yoksa yerel sentetik demo davranışı korunur. Hosted mod cookie tabanlı SSR session, PKCE callback, DB rol çözümleme ve MFA challenge kullanır; `service_role` anahtarı web environment'a eklenmez.

## Çalışan demo akışları

- Beş rolün ana ekranı; açık/koyu tema; masaüstü ve mobil menü.
- Eğitim arama, kategori filtreleme, listeme ekleme, öğrenme yolu.
- Üç bölüm → örnek soru → tamamlama → bir kez 100 demo puanı.
- Tarayıcıda ilerleme saklama, CSV raporu.
- Destek talebi → yönetici aktarımı → platform çözümü (yerel demo, dış mesaj göndermez).

## Testler

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit
```

Yerelde ve CI'da E2E sürümü sabitlenmiş Playwright Chromium kullanır. E2E öncesi build gerekir; test runner yerel server'ı gerektiğinde başlatır. PGlite testi migration'ı gerçek PostgreSQL WASM üzerinde uygular; Supabase Auth fonksiyonu test fixture'ıdır. Bu kanıt barındırılan Supabase, Storage, Realtime veya gerçek Auth entegrasyon testi değildir.

## Yapı

- `apps/web`: App Router portal ve açıkça işaretli sentetik demo.
- `packages/learning-core`: sınırlı SCORM 1.2 API ve içerik sınırı teknik kanıtları.
- `supabase/migrations`: tenant, hash'li davet, üyelik/rol/ekip komutları, line manager kapsamı, audit, RLS, özel job lease/fencing ve kalıcı öğrenme session/event temeli.
- `tests`: domain, CSV önizleme, PostgreSQL tenant/kimlik/ekip/runtime negatif erişim ve tarayıcı senaryoları.
- [Final proje planı](docs/planning/README.md)
- [Uygulama durumu ve kalanlar](docs/implementation/STATUS.md)
- [GoAuthoring / izole SCORM önizlemesini çalıştırma](docs/implementation/SCORM-PROOF.md)

GoAuthoring taslağı, SCORM ZIP export, ayrı origin'deki örnek oynatıcı ve Supabase SSR Auth adaptörü çalışır. Gerçek Supabase ortam kabulü, müşteri paketinin taranıp yayımlanması, kalıcı GoAuthoring yayını ve sağlayıcı entegrasyonları henüz tamamlanmadı. Üretim deployment'ı veya GitHub/Supabase/Vercel hesabı bağlantısı yapılmadı.
