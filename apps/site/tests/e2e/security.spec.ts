// 注入と外部通信の回帰テスト（ADR-0012）
import { expect, test, type Page } from "@playwright/test";
import { site } from "../../src/site.config";

const NS = site.storage.namespace;
const ARTICLE = "/articles/sample-work-style-basics/";
const PAYLOAD = `<img src=x onerror="window.__xss=1">"'><script>window.__xss=2</script>`;

/** ページの例外を集める。注入が動くと window.__xss が立つ */
function watch(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    errors,
    injected: () => page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
  };
}

test("外部の origin へ通信しない", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://localhost:4321").origin;
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && new URL(url).origin !== origin) outside.push(url);
  });
  for (const path of ["/", "/articles/sample-invoice-service-compare/", "/glossary/kokumin-kenko-hoken/"]) {
    await page.goto(path, { waitUntil: "load" });
  }
  await page.goto("/search/?q=独立");
  await expect(page.locator("[data-status]")).toContainText("件見つかりました");
  expect(outside).toEqual([]);
});

test("URL の検索語と条件は文字として扱う", async ({ page }) => {
  const { errors, injected } = watch(page);
  await page.goto(`/search/?q=${encodeURIComponent(PAYLOAD)}&shelf=${encodeURIComponent("<b>x</b>")}`);
  await expect(page.locator("#dd-search-q")).toHaveValue(PAYLOAD);
  await expect(page.locator("[data-status]")).toHaveText(/見つかりませんでした|件見つかりました/);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(await injected()).toBeUndefined();
  expect(errors).toEqual([]);
});

test("保存データに HTML や余計なキーがあっても注入されない", async ({ page }) => {
  const { errors, injected } = watch(page);
  await page.addInitScript(
    ({ ns, payload }) => {
      localStorage.setItem(
        `${ns}:bookmarks`,
        JSON.stringify([
          { id: payload, savedAt: "2026-01-01T00:00:00.000Z" },
          { id: "sample-work-style-basics", savedAt: payload, extra: payload },
        ]),
      );
      const at = new Date().toISOString();
      // JSON.parse は "__proto__" を自分のキーとして作る
      localStorage.setItem(
        `${ns}:resume`,
        `{"__proto__":{"polluted":1},"sample-work-style-basics":${JSON.stringify({ headingId: payload, ratio: 9, at })}}`,
      );
    },
    { ns: NS, payload: PAYLOAD },
  );

  await page.goto("/bookmarks/");
  await expect(page.getByRole("button", { name: /を削除$/ })).toHaveCount(1);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);

  await page.goto(ARTICLE);
  await expect(page.locator("[data-save]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-resume]")).toBeHidden();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(await page.evaluate(() => (({}) as { polluted?: number }).polluted)).toBeUndefined();
  expect(await injected()).toBeUndefined();
  expect(errors).toEqual([]);
});
