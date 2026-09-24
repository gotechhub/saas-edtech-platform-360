import { test, expect } from "@playwright/test";
test("authoring and package preview fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/lab/authoring", "/lab/scorm"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("author creates, saves, exports and inspects a real ZIP", async ({
  page,
}) => {
  await page.goto("/lab/authoring");
  await page
    .getByLabel("Eğitim başlığı", { exact: true })
    .fill("Örnek vaka öğrenme paketi");
  await page
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Eğitim başlığı", { exact: true })).toHaveValue(
    "Örnek vaka öğrenme paketi",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "SCORM 1.2 indir", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("oguz-law-demo-scorm12.zip");
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.getByLabel("SCORM ZIP dosyası").setInputFiles(path!);
  await expect(
    page.getByText("Yapısal kontrol geçti.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Yayımlanmadı · Tarama bekliyor", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/authoring-studio.png",
    fullPage: true,
  });
});
test("cross-origin SCO discovers API, resumes and records quiz result", async ({
  page,
}) => {
  await page.goto("/lab/scorm");
  const wrapper = page.frameLocator('iframe[title="SCORM eğitim oynatıcısı"]'),
    course = wrapper.frameLocator('iframe[title="Örnek eğitim içeriği"]');
  await expect(
    course.getByRole("heading", { name: "Hedefini belirle", exact: true }),
  ).toBeVisible();
  await course.getByRole("button", { name: "Bölümü tamamla" }).click();
  await expect(
    page.getByText("Demo ilerlemesi tarayıcıya kaydedildi.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Kaldığım yerden yeniden aç" })
    .click();
  await expect(
    course.getByRole("heading", {
      name: "Bir uygulama adımı seç",
      exact: true,
    }),
  ).toBeVisible();
  await course.getByRole("button", { name: "Bölümü tamamla" }).click();
  await course
    .getByLabel("Yalnızca başlıkları okumak", { exact: true })
    .check();
  await course.getByRole("button", { name: "Yanıtı kontrol et" }).click();
  await expect(page.locator("dd").filter({ hasText: /^wrong$/ })).toBeVisible();
  await course
    .getByLabel("Uygulamak ve geri bildirim almak", { exact: true })
    .check();
  await course.getByRole("button", { name: "Yanıtı kontrol et" }).click();
  await expect(
    course.getByRole("heading", { name: "Eğitim tamamlandı", exact: true }),
  ).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: /^100$/ })).toBeVisible();
  await expect(
    page.locator("dd").filter({ hasText: /^correct$/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    course.getByRole("heading", { name: "Eğitim tamamlandı", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/scorm-player.png",
    fullPage: true,
  });
});
test("forged messages cannot modify persisted SCORM state", async ({
  page,
}) => {
  await page.goto("/lab/scorm");
  await expect(page.locator(".scorm-frame iframe")).toBeVisible();
  await page.evaluate(() => {
    const f = document.querySelector("iframe")!;
    const nonce = new URL(f.src).hash.slice(1).split("=")[1];
    window.postMessage(
      {
        type: "respongo.scorm.snapshot",
        nonce,
        sequence: 1,
        values: {
          "cmi.core.score.raw": "100",
          "cmi.core.lesson_status": "passed",
        },
      },
      location.origin,
    );
  });
  expect(
    await page.evaluate(() =>
      localStorage.getItem("respongo:scorm:synthetic-fixture:v1"),
    ),
  ).toBeNull();
});
test("demo export and inspect APIs reject foreign origins and oversized bodies", async ({
  request,
}) => {
  const foreign = await request.post("/api/demo/authoring/export", {
    headers: { Origin: "https://attacker.example" },
    data: {},
  });
  expect(foreign.status()).toBe(403);
  const oversized = await request.post("/api/demo/authoring/export", {
    headers: {
      Origin: "http://127.0.0.1:3015",
      "Content-Type": "application/json",
    },
    data: "x".repeat(128 * 1024 + 1),
  });
  expect(oversized.status()).toBe(413);
  const bad = await request.post("/api/demo/packages/inspect", {
    headers: {
      Origin: "http://127.0.0.1:3015",
      "Content-Type": "application/zip",
    },
    data: Buffer.from("not a zip"),
  });
  expect(bad.status()).toBe(422);
});
