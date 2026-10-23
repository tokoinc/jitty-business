// 5.2 のうち自動で確かめられる項目。結果は docs/qa/a11y-{set}-{finish}.json。
import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { finish, set } from "./target";

const screens = [
  { id: "home", path: "/" },
  { id: "list", path: "/category/finance/" },
  { id: "search", path: "/search/?q=保険料" },
  { id: "article", path: "/articles/sample-social-insurance/" },
  { id: "compare", path: "/articles/sample-invoice-service-compare/" },
];

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: ".dd-inspect{display:none !important}" });
}

async function overflow(page: Page) {
  return page.evaluate(() => ({
    page: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    regions: [...document.querySelectorAll("[role='region']")].map((el) => ({
      label: el.getAttribute("aria-label") ?? "",
      over: el.scrollWidth > el.clientWidth + 1,
    })),
  }));
}

test.describe("アクセシビリティの記録", () => {
  test.describe.configure({ timeout: 180_000 });

  test("キーボード・200%・320px・forced-colors・reduced-motion", async ({ page }) => {
    const shotDir = `docs/qa/a11y/${set}-${finish}`;
    await mkdir(shotDir, { recursive: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, "/articles/sample-social-insurance/");
    await page.keyboard.press("Tab");
    const skip = page.locator(".dd-skip");
    await expect(skip).toBeFocused();
    const skipBox = await skip.boundingBox();
    expect(skipBox && skipBox.y >= 0 && skipBox.y < 200).toBe(true);
    const focusStyle = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement ?? document.body);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0);
    await page.screenshot({ path: `${shotDir}/focus-skip.png` });

    const order: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab");
      const name = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "";
        const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
        return `${el.tagName.toLowerCase()}:${text}`;
      });
      if (name) order.push(name);
    }
    expect(new Set(order).size).toBeGreaterThan(2);

    await page.locator("main a").first().focus();
    await page.screenshot({ path: `${shotDir}/focus-main.png` });

    const zoom: { id: string; page: boolean }[] = [];
    const narrow: { id: string; page: boolean }[] = [];
    for (const screen of screens) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, screen.path);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const wide = await overflow(page);
      expect(wide.page, `${screen.id} 200%`).toBe(false);
      zoom.push({ id: screen.id, page: wide.page });

      await page.setViewportSize({ width: 320, height: 700 });
      await open(page, screen.path);
      const slim = await overflow(page);
      expect(slim.page, `${screen.id} 320px`).toBe(false);
      narrow.push({ id: screen.id, page: slim.page });
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "/articles/sample-social-insurance/");
    const forced = await page.evaluate(() => {
      const main = document.querySelector("main");
      const style = main ? getComputedStyle(main) : null;
      return {
        main: Boolean(main),
        h1: document.querySelectorAll("h1").length,
        color: style?.color ?? "",
        landmarks: [...document.querySelectorAll("main, nav, aside, footer")].length,
      };
    });
    expect(forced.main).toBe(true);
    expect(forced.h1).toBe(1);
    expect(forced.landmarks).toBeGreaterThan(2);
    expect(forced.color).not.toBe("rgba(0, 0, 0, 0)");
    await page.screenshot({ path: `${shotDir}/forced-colors-article.png` });

    await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
    await open(page, "/");
    const motion = await page.evaluate(() => ({
      matches: matchMedia("(prefers-reduced-motion: reduce)").matches,
      duration: getComputedStyle(document.body).animationDuration,
      transition: getComputedStyle(document.body).transitionDuration,
    }));
    const seconds = (value: string) => {
      const n = Number.parseFloat(value);
      return value.trim().endsWith("ms") ? n / 1000 : n;
    };
    expect(motion.matches).toBe(true);
    expect(seconds(motion.duration)).toBeLessThan(0.001);
    expect(seconds(motion.transition)).toBeLessThan(0.001);

    const record = {
      set,
      finish,
      keyboard: { first: "skip", outline: focusStyle, order },
      zoom200: zoom,
      width320: narrow,
      forcedColors: forced,
      reducedMotion: motion,
    };
    await writeFile(`docs/qa/a11y-${set}-${finish}.json`, JSON.stringify(record, null, 2));
  });
});
