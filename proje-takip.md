# Proje Takibi — Respongo Learning · Oguz Law Academy

> Son güncelleme: **2026-09-25** · Sürüm: **0.2.0** · Aşama: **Geliştirme · Beta öncesi**

## Genel durum

| Gösterge | Değer |
|---|---:|
| Ürün yol haritası ilerlemesi | **%20** |
| Kalan | **%80** |
| Planlama baz çizgisi | **%100** |
| Toplam izlenen kabul görevi | **168** |
| Tamamlanan görev | **34** |
| Devam eden görev | **16** |
| Kalan görev | **134** |
| Toplam modül | **20** |
| Devam eden modül | **9** |
| Planlanan modül | **11** |
| Tam doğrulanmış/yayınlanmış modül | **0** |

> **Ölçüm kuralı:** Ürün yüzdesi, tamamlanmış kabul görevlerinin toplam izlenen kabul görevlerine oranıdır. Devam eden görevler tamamlanmış sayılmaz. Planlama yüzdesi ürün geliştirme yüzdesine dahil değildir.

## Faz ilerlemesi

| Faz | Kapsam | Görev | İlerleme |
|---|---|---:|---:|
| B1 · İlk kullanılabilir beta | EP01–EP15 | 34/126 | **%27** |
| B2 · Genişletilmiş beta | EP16–EP18 | 0/27 | **%0** |
| G · Genel sürüm | EP19 | 0/9 | **%0** |
| S · Sektör ölçekleme | EP20 | 0/6 | **%0** |

## Modüller

| Modül | Faz | Durum | Görev | İlerleme | Yapılan | Sıradaki |
|---|---|---|---:|---:|---|---|
| EP01 · Teknik temel ve monorepo | B1 | Devam ediyor | 8/10 | %80 | Tenant/RLS temeli, LMS veri tabloları, güvenli attempt/session/event deposu, job kanıtı, izole SCORM runtime, güvenli ZIP inceleme ve gerçek Supabase üzerinde doğrulanmış migration geçmişi | Hosted veri DAL/route adaptörü, karantina worker ve harici paket kanıtı |
| EP02 · Kimlik ve organizasyon | B1 | Devam ediyor | 7/8 | %88 | Üyelik/rol temeli; hash'li davet/kabul; güvenli rol/statü RPC'leri; doğrudan ekip kapsamı; CSV preview; Supabase SSR cookie/getClaims, login, PKCE, DB rol çözümleme, MFA challenge, logout, gerçek proje bağlantısı ve tarayıcıdan doğrulanmış hosted Auth kabulü | MFA yönetimi/kritik işlem AAL2 ve CSV worker |
| EP03 · UI sistemi ve marka | B1 | Devam ediyor | 7/10 | %70 | Beş rol navigasyonu, öğrenen ve admin çalışma alanları, responsive açık/koyu tema, hukuk akademisi hero varlığı ve RLS üzerinden canlı admin dashboard metrikleri | Bileşen kütüphanesi, erişilebilirlik denetimi ve gerçek marka editörü |
| EP04 · Portal ve lisans fabrikası | B1 | Planlandı | 0/7 | %0 | Plan ve veri sözleşmesi | Sektör seçimi, tenant kurulum işi, entitlement ve kota |
| EP05 · Katalog, asset ve runtime | B1 | Devam ediyor | 2/10 | %20 | Sentetik eğitim kataloğu, kaynak görünümü ve SCORM proof | Storage upload güvenliği, video/PDF runtime ve gerçek kalıcılık |
| EP06 · Program, atama ve uyumluluk | B1 | Devam ediyor | 2/9 | %22 | Program/atama/enrollment şeması ve dört adımlı admin atama demosu | Sunucu komutları, hedef kitle çözümleme, sürüm ve zorunluluk motoru |
| EP07 · Sınav, vaka ve yetkinlik | B1 | Planlandı | 0/8 | %0 | Plan ve veri sözleşmesi | Sunucu puanlama, deneme politikası, rubrik ve yetkinlik kanıtı |
| EP08 · Sertifika ve gamification | B1 | Planlandı | 0/8 | %0 | Plan ve ekran akışları | Sertifika snapshot/PDF, doğrulama, XP, rozet ve leaderboard |
| EP09 · GoAuthoring | B1 | Devam ediyor | 4/10 | %40 | Metin bölümleri, sıralama, quiz, yerel taslak, SCORM 1.2 ZIP export ve inceleme | Kalıcı yayın, blok editörü, medya, lisans ve etkileşim analitiği |
| EP10 · LXP ve sosyal temel | B1 | Planlandı | 0/8 | %0 | Plan ve ekran sözleşmesi | Öneriler, akış, koleksiyonlar, topluluk, yorum ve moderasyon |
| EP11 · E-posta ve otomasyon | B1 | Planlandı | 0/7 | %0 | Outbox/job teknik temeli | Şablonlar, zamanlama, retry, tercih ve iptal kuralları |
| EP12 · Destek ve bilgi bankası | B1 | Devam ediyor | 1/7 | %14 | Yerel kullanıcı → admin → platform ticket eskalasyon akışı | Kalıcı ticket, iç not, SLA, erişim grant'i ve bilgi bankası |
| EP13 · Rapor ve içerik operasyonu | B1 | Devam ediyor | 1/8 | %13 | Admin rapor, uyumluluk ve içerik sağlığı arayüzleri | Rapor datasetleri, özel rapor builder, planlı gönderim ve içerik checklist'i |
| EP14 · Manuel canlı eğitim | B1 | Planlandı | 0/6 | %0 | Plan ve entegrasyon sözleşmesi | Takvim, kontenjan, kayıt, oturum ve manuel yoklama |
| EP15 · Pilot sertleştirme | B1 | Devam ediyor | 2/10 | %20 | 28 çekirdek/PostgreSQL ve 15 tarayıcı testi; üretim derlemesi | UAT, erişilebilirlik, yük, restore, gözlemleme ve release kapıları |
| EP16 · Canlı API, SSO ve bağlayıcılar | B2 | Planlandı | 0/9 | %0 | Mimari ve sağlayıcı planı | Teams, Zoom, GoTo, SAML/OIDC ve kurum bağlayıcıları |
| EP17 · Rapor/workflow/AI ve sosyal genişleme | B2 | Planlandı | 0/10 | %0 | Kapsam ve güvenlik sınırları | Builder, workflow, push, sohbet, form/anket ve kontrollü AI raporları |
| EP18 · Geniş öğrenme standartları | B2 | Planlandı | 0/8 | %0 | SCORM Cloud yaklaşımı ve kabul planı | SCORM 2004, multi-SCO, xAPI/LRS ve cmi5 sağlayıcı adaptörü |
| EP19 · Ticaret ve kurumsal ölçek | G | Planlandı | 0/9 | %0 | Kapsam ve maliyet senaryoları | Checkout, SCIM/HRIS, özel domain/roller ve kapasite ölçekleme |
| EP20 · Otelcilik sektör paketi | S | Planlandı | 0/6 | %0 | Sektör paket mimarisi | Otelcilik terminolojisi, vardiya, işbaşı ve şablon paketi |

## Sıradaki öncelikler

1. **Hosted kimlik kabulü** · EP02
   Bağlı Supabase projesinde test kullanıcısı, MFA enroll/unenroll, kritik işlem AAL2 ve CSV worker
2. **Runtime'ı hosted veriye bağla** · EP01/EP05
   DAL/route adaptörü, gerçek oturum ve SCORM event gönderimi
3. **UI'ı gerçek veriye bağla** · EP05/EP06
   Atama, enrollment, program ve kaynak ekranlarını Supabase sorgularına taşı
4. **Portal kurulum fabrikası** · EP04
   Sektör şablonu, marka, modül, kota ve admin kurulum işi
5. **Pilot yayın kapıları** · EP15
   UAT, erişilebilirlik, yük, yedek geri dönüş ve izleme

## Dış bağımlılıklar ve karar girdileri

- Supabase proje, public web anahtarı ve gerçek admin Auth kabulü tamamlandı; Storage bucket/policy kabulü ve üretim secret yönetimi tamamlanmalı.
- GitHub uzak deposu ve main dalı bağlandı; Vercel projesi ile lms.respongo.com DNS kurulumu henüz yapılmadı.
- Teams, Zoom, GoTo, isEazy ve SCORM Cloud test hesapları/sözleşmeleri gerekli.
- Gerçek hukuk eğitim içerikleri, kullanım hakları ve uzman onayları müşteriyle tamamlanmalı.

## Doğrulama kanıtı

- Çekirdek/PostgreSQL testleri: **57 geçti**
- Tarayıcı uçtan uca testleri: **15 geçti**
- TypeScript: **Geçti**
- Next.js üretim derlemesi: **Geçti**
- Bağımlılık güvenliği: **Son taramada bildirilen açık yok**

## Son değişiklikler

- **2026-09-25:** Admin genel bakış kartları üyelik, eğitim, program, enrollment ve zorunlu uyum metriklerini canlı Supabase/RLS verisinden almaya başladı.
- **2026-09-25:** Oguz Law Academy için dolu beta veri paketi, gerçek geçici tenant admin hesabı ve tarayıcıdan canlı Supabase giriş/RLS kabulü tamamlandı.
- **2026-09-24:** GitHub main dalı yayımlandı; gerçek Supabase proje ayarları bağlandı ve beş migration uzak veritabanına uygulanıp geçmiş eşitliği doğrulandı.
- **2026-09-24:** Next.js 16 Supabase SSR proxy, güvenli login/PKCE/logout, DB rol çözümleme ve MFA challenge eklendi; 6 auth policy testi geçti.
- **2026-09-24:** Line manager erişimi doğrudan ekip üyeleriyle sınırlandı; revision korumalı ekip komutu ve 1 MB/2.000 satırlık CSV import preview eklendi; 11 yeni test geçti.
- **2026-09-24:** Hash'li davet, e-posta eşleşmeli kabul, güvenli rol/statü komutları, session iptali ve redacted audit eklendi; 6 yeni PostgreSQL testi geçti.
- **2026-09-24:** Tenant bağlı attempt, hash'lenmiş learning session, idempotent event ve interaction/progress deposu eklendi; 6 yeni PostgreSQL testi geçti.
- **2026-09-24:** Proje takip sistemi ve tek kaynaklı MD/HTML üretimi eklendi.
- **2026-09-21:** Öğrenen atama/kaynak akışları ve kapsamlı admin çalışma alanları eklendi.
- **2026-09-21:** LMS domain migration'ı ve tenant bağlı RLS testi eklendi.
- **2026-09-21:** GoAuthoring ve ayrı origin SCORM proof akışı doğrulandı.

## Güncelleme

Önce `project-tracker.json` içindeki modül/görev durumlarını değiştirin, sonra:

```powershell
pnpm tracker:update
```

Bu komut `proje-takip.md`, `proje-takip.html` ve portalda sunulan `apps/web/public/proje-takip.html` dosyalarını aynı kaynaktan yeniler. Tutarlılık kontrolü: `pnpm tracker:check`.
