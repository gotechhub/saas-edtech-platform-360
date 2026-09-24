import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3015",
    headless: true,
  },
  webServer: [
    {
      command: "pnpm --dir apps/web dev --port 3015",
      url: "http://127.0.0.1:3015",
      reuseExistingServer: !process.env.CI,
      env: { RESPONGO_DEMO_ENABLED: "true" },
      timeout: 60000,
    },
    {
      command: "pnpm content:proof",
      url: "http://localhost:3101/health",
      reuseExistingServer: !process.env.CI,
      env: { RESPONGO_PARENT_ORIGIN: "http://127.0.0.1:3015" },
      timeout: 60000,
    },
  ],
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/browser-results.json" }],
  ],
});
