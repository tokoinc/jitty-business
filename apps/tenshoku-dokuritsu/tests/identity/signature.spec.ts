// 4画面のシグネチャ枠と、識別検査モードの画像。DD_INSPECT=1 の build で実行する。
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { finish, set } from "./target";

const outDir = `docs/identity/${set}-${finish}`;

const screens = [
  { id: "home", path: "/" },
  { id: "list", path: "/category/finance/" },
  { id: "search", path: "/search/?q=保険料" },
  { id: "article", path: "/articles/sample-social-insurance/" },
] as const;

/**
 * どの画面にどの枠が出るか。値は data-sig の先頭 s{番号}。
 * s4-grid は s4、s6-panel は s6。ページにより該当する枠だけ（2.4）。
 * S5（目的と条件群）は検索画面。ホームの欄は索引の入口で、この表には入れない。
 * S7 は用語の補足。記事では開いてから大きさを見る。
 * S3 はホームの区画見出しと記事の h2。一覧は h1 と記事面だけで、区画見出しは無い。
 * S9 はホームの区切りと記事末。一覧と検索結果の末尾には置いていない。
 */
const expected: Record<(typeof screens)[number]["id"], string[]> = {
  home: ["s1", "s2", "s3", "s4", "s6", "s8", "s9"],
  list: ["s1", "s2", "s4", "s6", "s8"],
  search: ["s1", "s2", "s4", "s5", "s8"],
  article: ["s1", "s2", "s3", "s4", "s6", "s7", "s8", "s9"],
};

const parts: { frame: string; screen: (typeof screens)[number]["id"]; selector: string; openTerm?: boolean }[] = [
  { frame: "s4", screen: "home", selector: '[data-sig="s4"]' },
  { frame: "s3", screen: "home", selector: '[data-sig="s3"]' },
  { frame: "s5", screen: "search", selector: '[data-sig="s5"]' },
  { frame: "s6", screen: "article", selector: '[data-sig="s6"]' },
  { frame: "s7", screen: "article", selector: '[data-sig="s7"]', openTerm: true },
  { frame: "s8", screen: "home", selector: '[data-sig="s8"]' },
];

function withInspect(path: string, level: string) {
  const url = new URL(path, "http://localhost:4321");
  if (level) url.searchParams.set("inspect", level);
  return `${url.pathname}${url.search}`;
}

function frameId(value: string) {
  const matched = /^s(\d+)/.exec(value);
  if (!matched) throw new Error(`data-sig の形が違う: ${value}`);
  return `s${matched[1]}`;
}

async function open(page: Page, path: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      return;
    } catch (error) {
      const raced = error instanceof Error && error.message.includes("Execution context was destroyed");
      if (!raced || attempt === 1) throw error;
    }
  }
}

async function settle(page: Page, path: string, level = "") {
  await open(page, withInspect(path, level));
  if (path.startsWith("/search/")) {
    await expect
      .poll(async () => page.locator("[data-status]").innerText(), { timeout: 20_000 })
      .toMatch(/件見つかりました|見つかりませんでした|読み込めませんでした/);
    await expect(page.locator('[data-sig="s4-grid"] [data-sig="s4"]')).not.toHaveCount(0);
  }
}

async function rendered(page: Page) {
  return page.$$eval("[data-sig]", (els) =>
    els.flatMap((el) => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width <= 0 || height <= 0) return [];
      const label = el.getAttribute("aria-label") ?? "";
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      return [
        {
          sig: el.getAttribute("data-sig") ?? "",
          width,
          height,
          text: text.slice(0, 40),
          children: el.childElementCount,
          label,
        },
      ];
    }),
  );
}

test.describe("シグネチャ枠", () => {
  test.describe.configure({ timeout: 120_000 });

  test("4画面で宣言した枠が描画され、空でない", async ({ page }) => {
    for (const screen of screens) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await settle(page, screen.path);
      if (screen.id === "article") {
        const trigger = page.getByRole("button", { name: "用語の補足を開く" }).first();
        await trigger.click();
        const id = await trigger.getAttribute("popovertarget");
        await expect(page.locator(`[id="${id}"]`)).toBeVisible();
      }
      const boxes = await rendered(page);
      const empty = boxes.filter((box) => box.text.length === 0 && box.children === 0 && box.label.length === 0);
      expect(empty, `${screen.id} に空の枠`).toEqual([]);
      const frames = [...new Set(boxes.map((box) => frameId(box.sig)))].sort();
      expect(frames, `${screen.id} の枠 ${boxes.map((box) => box.sig).join(" ")}`).toEqual(
        [...expected[screen.id]].sort(),
      );
    }
  });
});

test.describe("識別検査の画像", () => {
  test.describe.configure({ timeout: 300_000 });

  test("4画面×2幅の L1・L2・L3 を保存する", async ({ page }) => {
    await mkdir(outDir, { recursive: true });
    const levels = finish === "flat" ? ["L1", "L2", "L3"] : ["L1", "L2"];
    for (const screen of screens) {
      for (const width of [1280, 375]) {
        for (const level of levels) {
          await page.setViewportSize({ width, height: 800 });
          await settle(page, screen.path, level);
          await expect(page.locator("html")).toHaveAttribute("data-inspect", level);
          await expect(page.locator(".dd-inspect")).toBeVisible();
          await page.addStyleTag({ content: ".dd-inspect{display:none !important}" });
          const file = `${outDir}/screen-${screen.id}-${width}-${level}.png`;
          await page.screenshot({ path: file, fullPage: true });
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await settle(page, "/articles/sample-social-insurance/");
    await expect(page.locator("html")).not.toHaveAttribute("data-inspect");
    await page.addStyleTag({ content: ".dd-inspect{display:none !important}" });
    await page.screenshot({ path: `${outDir}/normal-article-1280.png`, fullPage: true });
  });

  test("L1 の部品6種を保存する", async ({ page }) => {
    await mkdir(`${outDir}/parts`, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const part of parts) {
      const screen = screens.find((item) => item.id === part.screen);
      if (!screen) throw new Error(part.screen);
      await settle(page, screen.path, "L1");
      await expect(page.locator("html")).toHaveAttribute("data-inspect", "L1");
      let shot = page.locator(part.selector).first();
      if (part.openTerm) {
        const trigger = page.getByRole("button", { name: "用語の補足を開く" }).first();
        await trigger.click();
        const id = await trigger.getAttribute("popovertarget");
        shot = page.locator(`[id="${id}"]`);
        await expect(shot).toBeVisible();
      }
      await page.addStyleTag({ content: ".dd-inspect{display:none !important}" });
      await shot.screenshot({ path: `${outDir}/parts/part-${part.frame}-1280-L1.png` });
    }
  });
});
