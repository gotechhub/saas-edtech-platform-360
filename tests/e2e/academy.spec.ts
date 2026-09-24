import { test, expect } from "@playwright/test";
test("learner completes a course, persists progress and exports the report", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/avukat/oguzlawacademy");
  await expect(
    page.getByRole("heading", { name: "Gelişimin için güzel bir gün." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Yolculuğa başla", exact: true })
    .click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Bölümü tamamla" }).click();
  await page.getByLabel("Yalnızca eğitim sayısını artırmak").check();
  await page.getByRole("button", { name: "Yanıtı kontrol et" }).click();
  await expect(
    page.getByText("Bu yanıtı tekrar düşün.", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Somut hedef, uygulama ve geri bildirim belirlemek")
    .check();
  await page.getByRole("button", { name: "Yanıtı kontrol et" }).click();
  await expect(
    page.getByRole("heading", { name: "Harika, tamamladın!" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Başarılarımı gör", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  expect((await download).suggestedFilename()).toBe(
    "oguzlaw-demo-ilerleme.csv",
  );
  await page.reload();
  await page.getByRole("button", { name: "Başarılarım", exact: true }).click();
  await expect(
    page.getByText("Demo tamamlandı", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("catalog search, saved list and dark theme persist", async ({ page }) => {
  await page.goto("/avukat/oguzlawacademy");
  await page
    .getByRole("button", { name: "Eğitimleri keşfet", exact: true })
    .click();
  await page.getByLabel("Eğitim ara").fill("vaka");
  await expect(page.locator(".course-card")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Vaka analizi: doğru soruları sormak: listeme ekle",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^Listem/ }).click();
  await expect(page.locator(".course-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Koyu temaya geç" }).click();
  await page.reload();
  await expect(page.locator(".academy")).toHaveAttribute("data-theme", "dark");
});
test("support request can be escalated and resolved in the local demo", async ({
  page,
}) => {
  await page.goto("/avukat/oguzlawacademy");
  await page
    .getByRole("button", { name: "Destek merkezi", exact: true })
    .click();
  await page.getByLabel("Konu", { exact: true }).fill("Örnek oynatıcı sorusu");
  await page
    .getByLabel("Açıklama", { exact: true })
    .fill("Sentetik test talebi");
  await page.getByRole("button", { name: "Demo talebi oluştur" }).click();
  await expect(
    page.getByText("Örnek oynatıcı sorusu", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Rol önizlemesi").selectOption("admin");
  await page
    .getByRole("button", { name: "Destek merkezi", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Üst desteğe aktar", exact: true })
    .click();
  await page.getByLabel("Rol önizlemesi").selectOption("platform");
  await page
    .getByRole("button", { name: "Destek operasyonu", exact: true })
    .click();
  await expect(page.locator(".ticket")).toHaveCount(1);
  await page.getByRole("button", { name: "Çözüldü işaretle" }).click();
  await page.getByLabel("Rol önizlemesi").selectOption("learner");
  await page
    .getByRole("button", { name: "Destek merkezi", exact: true })
    .click();
  await expect(page.getByText("Çözüldü", { exact: true })).toBeVisible();
});
test("learner can move between assigned learning and the resource library", async ({
  page,
}) => {
  await page.goto("/avukat/oguzlawacademy");
  await page.getByRole("button", { name: /^Atanan eğitimler/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sıradaki adımın hazır." }),
  ).toBeVisible();
  await expect(page.locator(".learning-row")).toHaveCount(5);
  await expect(
    page.getByText("Son: 24 Eyl 2026", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kaynaklar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "İşin sırasında yanında." }),
  ).toBeVisible();
  await page.getByLabel("Kaynak ara").fill("KVKK");
  await expect(page.locator(".resource-card")).toHaveCount(1);
});
test("admin can inspect users and complete the assignment wizard", async ({
  page,
}) => {
  await page.goto("/avukat/oguzlawacademy");
  await page.getByLabel("Rol önizlemesi").selectOption("admin");
  await expect(
    page.getByRole("heading", { name: "Akademinin bugünkü öncelikleri." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Kullanıcılar", exact: true }).click();
  await expect(page.locator(".data-table tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Atamalar", exact: true }).click();
  await page.getByLabel(/Vaka analizi/).check();
  await page.getByRole("button", { name: "Devam et" }).click();
  await page.getByRole("button", { name: /Yeni başlayanlar/ }).click();
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(
    page.getByRole("heading", { name: "Tamamlama çerçevesini belirle." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Vaka analizi: doğru soruları sormak",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atamayı yayınla" }).click();
  await expect(
    page.getByRole("heading", { name: "42 öğrenene atama oluşturuldu." }),
  ).toBeVisible();
});
for (const width of [320, 390, 1024, 1440])
  test(`five roles fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/avukat/oguzlawacademy");
    for (const role of [
      "learner",
      "admin",
      "instructor",
      "manager",
      "platform",
    ]) {
      await page.getByLabel("Rol önizlemesi").selectOption(role);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByLabel("Rol önizlemesi").selectOption("learner");
    if (width < 700) {
      await page
        .getByRole("button", { name: "Menüyü aç", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Öğrenme yolculuğu", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Bir sonraki adımın belli." }),
      ).toBeVisible();
    }
    if (width === 1440) {
      await page.screenshot({
        path: "test-results/learner-desktop.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "Koyu temaya geç" }).click();
      await page.screenshot({
        path: "test-results/learner-dark.png",
        fullPage: true,
      });
    }
    if (width === 390)
      await page.screenshot({
        path: "test-results/mobile-journey.png",
        fullPage: true,
      });
  });
test("unknown tenants are not rendered as Oguz Law Academy", async ({
  page,
}) => {
  const response = await page.goto("/avukat/another-tenant");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Portal bulunamadı" }),
  ).toBeVisible();
});
