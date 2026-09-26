import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

function localCredentials() {
  const values: Record<string, string> = {};
  if (existsSync(".env.demo-users.local")) {
    for (const rawLine of readFileSync(".env.demo-users.local", "utf8").split(
      /\r?\n/,
    )) {
      const line = rawLine.trim();
      const index = line.indexOf("=");
      if (index > 0)
        values[line.slice(0, index)] = line
          .slice(index + 1)
          .replace(/^["']|["']$/g, "");
    }
  }
  return {
    email: process.env.ADMIN_EMAIL ?? values.ADMIN_EMAIL,
    password: process.env.DEMO_PASSWORD ?? values.DEMO_PASSWORD,
  };
}

const credentials = localCredentials();

async function signIn(page: Page, next: string) {
  await page.goto(
    "/avukat/oguzlawacademy/giris?next=" + encodeURIComponent(next),
  );
  await page.getByLabel("E-posta").fill(credentials.email);
  await page.getByLabel("Parola").fill(credentials.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await page.waitForURL("**" + next, { timeout: 60000 });
}

test.describe("Experience V2", () => {
  test.skip(
    !credentials.email || !credentials.password,
    "Canlı V2 testi için yerel demo kullanıcı değişkenleri gerekli.",
  );

  test("tenant admin can preview all five role dashboards without changing authorization", async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1100 });
    await signIn(page, "/avukat/oguzlawacademy/v2/admin/dashboard");

    const expectations = {
      learner: "Merhaba Selçuk, kaldığın yer hazır.",
      admin: "Bugünün önceliklerini netleştirelim.",
      instructor: "Bilgiyi etkili bir deneyime dönüştür.",
      manager: "Ekibinin gelişim nabzı burada.",
      platform: "Tüm akademiler için tek operasyon resmi.",
    };

    for (const [role, heading] of Object.entries(expectations)) {
      await page.goto("/avukat/oguzlawacademy/v2/" + role + "/dashboard");
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(
        page.getByText(role === "admin" ? "CANLI V2" : "V2 ÖNİZLEME", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Sayfa yolu" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test("light and dark themes fit learner mobile and admin desktop", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await signIn(page, "/avukat/oguzlawacademy/v2/admin/dashboard");
    await page.getByRole("button", { name: "Koyu temaya geç" }).click();
    await expect(page.locator(".rv2-app")).toHaveAttribute(
      "data-v2-theme",
      "dark",
    );
    await page.screenshot({
      path: "test-results/v2-admin-dark-1440.png",
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/avukat/oguzlawacademy/v2/learner/dashboard");
    await expect(
      page.getByRole("heading", {
        name: "Merhaba Selçuk, kaldığın yer hazır.",
      }),
    ).toBeVisible();
    await expect(page.locator(".rv2-bottom-nav")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/v2-learner-mobile-390.png",
      fullPage: true,
    });
  });

  test("all eight screen states have a stable accessible contract", async ({
    page,
  }) => {
    test.setTimeout(120000);
    const path = "/avukat/oguzlawacademy/v2/admin/users";
    await signIn(page, path);
    for (const state of [
      "loaded",
      "loading",
      "empty",
      "filtered_empty",
      "error",
      "forbidden",
      "offline",
      "stale",
    ]) {
      await page.goto(`${path}?state=${state}`);
      await expect(
        page.locator(`[data-experience-state="${state}"]`),
      ).toBeVisible();
    }
  });

  test("admin dashboard passes automated WCAG A and AA checks", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await signIn(page, "/avukat/oguzlawacademy/v2/admin/dashboard");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude(".recharts-responsive-container")
      .analyze();
    expect(result.violations).toEqual([]);
  });

  test("admin can compose, publish and assign a mixed training program", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1100 });
    const path = "/avukat/oguzlawacademy/v2/admin/program-builder";
    const programTitle = `Yeni Avukat Dijital Uyum Programı ${Date.now()}`;
    await signIn(page, path);

    await expect(
      page.getByRole("heading", { name: "Eğitim programları" }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/v2-program-list-1440.png",
      fullPage: true,
    });
    const listAccessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(listAccessibility.violations).toEqual([]);
    await page.getByRole("button", { name: "Yeni eğitim programı" }).click();
    await page.getByLabel("Program adı").fill(programTitle);
    await page
      .getByLabel("Açıklama")
      .fill(
        "SCORM, sınav, anket, görev ve kaynaklardan oluşan zorunlu program.",
      );

    if (process.env.SCORM_TEST_FILE) {
      await page
        .locator('input[type="file"][accept*=".zip"]')
        .setInputFiles(process.env.SCORM_TEST_FILE);
      await expect(page.getByText(/ZENEFIT EGITIMI doğrulandı/)).toBeVisible();
      await page.getByRole("button", { name: /Kaydet ve devam et/ }).click();
    }

    await page.getByRole("button", { name: "Anket" }).click();
    await page.getByLabel("İçerik adı").fill("Program deneyimi anketi");
    await page.getByRole("button", { name: /Kaydet ve devam et/ }).click();
    await page.getByRole("button", { name: "Sınav" }).click();
    await page.getByLabel("İçerik adı").fill("Kapanış sınavı");
    await page.getByRole("button", { name: /Kaydet ve devam et/ }).click();
    await page.getByRole("button", { name: "Görev" }).click();
    await page.getByLabel("İçerik adı").fill("Vaka değerlendirme görevi");
    await page.getByRole("button", { name: /Kaydet ve devam et/ }).click();
    await page.getByRole("button", { name: "Kaynak" }).click();
    await page.getByLabel("İçerik adı").fill("Hukuk teknolojileri rehberi");
    await page.getByRole("button", { name: /Kaydet ve devam et/ }).click();
    await expect(
      page.getByText(`${process.env.SCORM_TEST_FILE ? 5 : 4} program adımı`),
    ).toBeVisible();

    await page.getByRole("button", { name: "Programı yayınla" }).click();
    await expect(
      page.getByText(
        "Program yayınlandı. Değişmez sürüm oluşturuldu ve atamaya hazır.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Atama oluştur" }).click();
    await expect(
      page.getByRole("heading", { name: programTitle }),
    ).toBeVisible();
    await expect(page.getByText("eşleşen aktif kullanıcı")).toBeVisible();
    await expect(page.getByRole("list", { name: "Hedef kitle önizlemesi" })).toBeVisible();
    await page.getByRole("button", { name: "Atamayı başlat" }).click();
    await expect(
      page.getByText("Atama oluşturuldu. Rapor ekranından izleyebilirsiniz."),
    ).toBeVisible();
    await expect(page.getByText("Program atamaları")).toBeVisible();
    await page.goto("/avukat/oguzlawacademy/v2/learner/dashboard");
    await expect(page.getByText("Atanan eğitim programların")).toBeVisible();
    await expect(page.getByText(programTitle)).toBeVisible();
    await page
      .locator(".rv2-assigned-program-row")
      .filter({ hasText: programTitle })
      .getByRole("link", { name: /Atamayı aç/ })
      .click();
    await expect(
      page.getByText("Zorunlu ve planlı öğrenmelerin"),
    ).toBeVisible();
    await page
      .locator(".rv2-assigned-program-card")
      .filter({ hasText: programTitle })
      .getByRole("button", { name: "Programa başla" })
      .click();
    await expect(
      page.getByRole("button", { name: /Adımı tamamla ve devam et/ }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Adımı tamamla ve devam et/ })
      .click();
    await expect(
      page.getByText(/tamamlandı. Sonraki adım açıldı/),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/v2-program-studio-1440.png",
      fullPage: true,
    });
  });

  test("admin can inspect live compliance records and program version history", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1100 });
    const path = "/avukat/oguzlawacademy/v2/admin/assignments";
    await signIn(page, path);
    await expect(
      page.getByRole("heading", { name: "Uyumluluk operasyon merkezi" }),
    ).toBeVisible();
    await expect(page.getByText("Kullanıcı ilerleme kayıtları")).toBeVisible();
    await expect(page.getByText("Program yayın geçmişi")).toBeVisible();
    await expect(page.getByText("Veri kaynağı: canlı Supabase")).toBeVisible();
    await expect(page.locator(".rv2-compliance-table tbody tr").first()).toBeVisible();
    await page.getByRole("button", { name: "Muafiyet", exact: true }).first().click();
    await page.getByLabel("Gerekçe").fill("E2E kontrollü eşdeğerlik testi");
    await page.getByRole("button", { name: "Muafiyeti kaydet" }).click();
    await expect(page.getByText("Muafiyet kaydedildi ve audit günlüğüne işlendi.")).toBeVisible();
    await page.getByRole("button", { name: "Muafiyeti kaldır", exact: true }).first().click();
    await page.getByLabel("Gerekçe").fill("E2E testi sonrası karar geri alındı");
    await page.getByRole("button", { name: "Muafiyeti kaldır", exact: true }).last().click();
    await expect(page.getByText("Muafiyet kaldırıldı.")).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/v2-compliance-center-1440.png",
      fullPage: true,
    });
  });

  test("instructor can author and publish a server-graded assessment", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 1100 });
    const path = "/avukat/oguzlawacademy/v2/instructor/assessments";
    const title = `Meslek Etiği Güvenli Sınavı ${Date.now()}`;
    await signIn(page, path);
    await expect(page.getByRole("heading", { name: "Sınav ve değerlendirme merkezi" })).toBeVisible();
    await page.getByRole("button", { name: "Yeni sınav" }).click();
    await page.getByLabel("Sınav adı").fill(title);
    const prompts = page.getByLabel("Soru metni");
    await prompts.nth(0).fill("Çıkar çatışması şüphesinde ilk işlem nedir?");
    await prompts.nth(1).fill("Müvekkil verisi izinsiz paylaşılabilir mi?");
    const optionA = page.getByLabel("A seçeneği");
    const optionB = page.getByLabel("B seçeneği");
    await optionA.nth(0).fill("Çatışma kontrolü yapmak");
    await optionB.nth(0).fill("Dosyaya doğrudan devam etmek");
    await optionA.nth(1).fill("Hayır, paylaşılamaz");
    await optionB.nth(1).fill("Evet, her zaman paylaşılabilir");
    await page.getByRole("button", { name: "Kaydet ve yayınla" }).click();
    await expect(page.getByText("Sınav yayınlandı. Cevap anahtarı güvenli sunucu katmanında saklandı.")).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: "test-results/v2-assessment-center-1440.png", fullPage: true });
  });
});
