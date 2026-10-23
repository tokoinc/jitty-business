import { expect, test, type Locator, type Page } from "@playwright/test";

const ARTICLE = "/articles/independence-or-career-change/";
const OTHER = "/articles/before-leaving-checklist/";
const NS = "tenshoku-dokuritsu:v1";
const SAVE_FAIL = "この端末に保存できませんでした。ページを閉じると元に戻ります。";
const SEARCH_FAIL = "検索を読み込めませんでした。カテゴリ・目的・用語集から探せます。";

async function frameBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

async function openSettings(page: Page) {
  const settings = page.getByRole("button", { name: "表示設定" });
  if (!(await settings.isVisible())) {
    await page.getByRole("button", { name: "索引" }).click();
  }
  await settings.click();
  await expect(page.locator("#dd-settings")).toBeVisible();
}

async function saveArticle(page: Page, path: string): Promise<string> {
  await page.goto(path);
  const title = (await page.locator("h1").innerText()).replace(/\s+/g, " ").trim();
  const save = page.locator("[data-save]");
  await expect(save).toBeVisible();
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  return title;
}

function deleteButton(page: Page, title: string): Locator {
  return page.getByRole("button", { name: `「${title}」を削除` });
}

test("検索から記事へ進む", async ({ page }) => {
  await page.goto("/search/");
  await page.locator("#dd-search-q").fill("独立");
  await page.locator("#dd-search-form").getByRole("button", { name: "検索" }).click();
  await expect(page.locator("[data-status]")).toContainText("件見つかりました");
  const link = page.locator('[data-sig="s4-grid"] a[data-field-href]').first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/articles\/[a-z0-9-]+\/$/);
  await expect(page.locator("h1")).toBeVisible();
});

// 用語を本文で使っていないので、ポップオーバーのテストは skip のまま。
test.skip("用語の補足を開いて閉じるとフォーカスが戻る", async ({ page }) => {
  await page.goto(ARTICLE);
  const trigger = page.getByRole("button", { name: "用語の補足を開く" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "閉じる" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

/** 1200px 以上では本文の #toc を隠し、確かめる領域の目次を出す */
async function visibleTocLink(page: Page): Promise<Locator> {
  const inArticle = page.locator("#toc a").first();
  if (await inArticle.isVisible()) return inArticle;
  return page.getByRole("complementary", { name: "確かめる" }).getByRole("link").first();
}

test("目次から節へ移動する", async ({ page }) => {
  await page.goto(ARTICLE);
  const link = await visibleTocLink(page);
  await expect(link).toBeVisible();
  const hash = await link.getAttribute("href");
  const id = decodeURIComponent((hash ?? "").replace(/^#/, ""));
  expect(id).not.toBe("");
  await link.click();
  await expect(page.locator(".dd-prose").locator(`[id="${id}"]`)).toBeInViewport();
});

test("保存して一覧から削除する", async ({ page }) => {
  const title = await saveArticle(page, ARTICLE);
  await page.goto("/bookmarks/");
  await deleteButton(page, title).click();
  await expect(page.getByText("保存した記事はありません。")).toBeVisible();
});

test("保存をすべて削除する", async ({ page }) => {
  const first = await saveArticle(page, ARTICLE);
  const second = await saveArticle(page, OTHER);
  await page.goto("/bookmarks/");
  await expect(deleteButton(page, first)).toBeVisible();
  await expect(deleteButton(page, second)).toBeVisible();
  await page.getByRole("button", { name: "すべて削除" }).click();
  await expect(page.getByText("保存した記事はありません。")).toBeVisible();
});

test("続きから読む", async ({ page }) => {
  await page.goto(ARTICLE);
  const heading = page.locator(".dd-prose h2").nth(1);
  await expect(heading).toBeVisible();
  const id = await heading.getAttribute("id");
  expect(id).toBeTruthy();
  const name = (await heading.innerText()).replace(/\s+/g, " ").trim();
  await heading.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy(0, 1));
  await page.waitForFunction((headingId) => {
    const raw = localStorage.getItem("tenshoku-dokuritsu:v1:resume");
    if (!raw) return false;
    const data = JSON.parse(raw) as Record<string, { headingId?: string }>;
    return Object.values(data).some((point) => point.headingId === headingId);
  }, id);
  await page.reload();
  const resume = page.getByRole("button", { name: `前回の続き（${name}）から読む` });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page.locator(".dd-prose").locator(`[id="${id}"]`)).toBeFocused();
});

test("OSの明暗に追従し、表示設定は再読み込み後も残る", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /./);
  const dark = await frameBackground(page);
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => frameBackground(page)).not.toBe(dark);

  await page.emulateMedia({ colorScheme: "dark" });
  await openSettings(page);
  await page.locator('#dd-settings input[name="theme"][value="dark"]').check();
  await page.locator('#dd-settings input[name="font"][value="lg"]').check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-font-scale", "lg");

  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-font-scale", "lg");
  const locked = await frameBackground(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => frameBackground(page)).toBe(locked);
});

test("375pxで索引を開いて閉じる", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile だけ");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const open = page.locator('nav[aria-label="索引"]:popover-open');
  const toggle = page.getByRole("button", { name: "索引" });
  await expect(open).toHaveCount(0);
  await toggle.click();
  await expect(open).toHaveCount(1);
  await toggle.click();
  await expect(open).toHaveCount(0);
});

test.describe("JSなし", () => {
  test.use({ javaScriptEnabled: false });

  test("本文・目次・条件・根拠が読める", async ({ page }) => {
    await page.goto(OTHER);
    await expect(page.locator("h1")).toContainText("確認リスト");
    await expect(page.locator(".dd-prose")).toContainText("任意継続");
    await expect(await visibleTocLink(page)).toBeVisible();
    await expect(page.locator("#cond-kenpo-voluntary")).toContainText("任意継続");
    await expect(page.locator("#sources")).toContainText("根拠");
  });
});

test("ストレージを拒否すると通知が出る", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("denied", "SecurityError");
    };
  });
  await page.goto(ARTICLE);
  const save = page.locator("[data-save]");
  await expect(save).toBeVisible();
  await save.click();
  await expect(page.locator("#dd-notice")).toHaveText(SAVE_FAIL);
});

test("不正なJSONでも動く", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript((ns) => {
    localStorage.setItem(`${ns}:bookmarks`, "{not json");
    localStorage.setItem(`${ns}:resume`, "not-json");
    localStorage.setItem(`${ns}:preferences`, "{");
  }, NS);
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /./);
  await page.goto("/bookmarks/");
  await expect(page.getByText("保存した記事はありません。")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Pagefind の読み込みに失敗すると案内が出る", async ({ page }) => {
  await page.route("**/pagefind/**", (route) => route.abort());
  await page.goto("/search/");
  await page.locator("#dd-search-q").fill("独立");
  await expect(page.locator("[data-status]")).toHaveText(SEARCH_FAIL);
});
