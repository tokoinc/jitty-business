// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const ci = !!process.env.CI;

export default defineConfig({
  testDir: "tests",
  // CI では test.only の置き忘れで止め、一時的な失敗だけやり直す
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  use: { baseURL: "http://localhost:4321", trace: "retain-on-failure" },
  // ローカルは動いている preview を使う（4321 番の古いサーバーは先に止める）。CI は毎回立てる
  webServer: { command: "npm run preview -- --port 4321", url: "http://localhost:4321", reuseExistingServer: !ci },
  projects: [
    { name: "desktop", testDir: "tests/e2e", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", testDir: "tests/e2e", use: { ...devices["Pixel 7"] } },
    { name: "identity", testDir: "tests/identity", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
});
