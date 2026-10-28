// tests/identity/finish.spec.ts（要点）
import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { finish, set } from "./target";

const pages = ["/", "/category/finance/", "/search/?q=保険料", "/articles/sample-social-insurance/"];

async function boxes(page: import("@playwright/test").Page, path: string) {
  const read = () =>
    page.$$eval("[data-sig]", (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      }),
    );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      return await read();
    } catch (error) {
      const raced = error instanceof Error && error.message.includes("Execution context was destroyed");
      if (!raced || attempt === 1) throw error;
    }
  }
  throw new Error(`寸法を読めない: ${path}`);
}

test("質感で寸法が変わらない", async ({ page }) => {
  const file = `docs/identity/geometry-${set}.json`;
  const now: Record<string, number[][]> = {};
  for (const p of pages) {
    now[p] = await boxes(page, p);
  }
  if (finish === "flat") {
    writeFileSync(file, JSON.stringify(now));
    return;
  }
  expect(existsSync(file)).toBe(true);
  const base = JSON.parse(readFileSync(file, "utf8")) as Record<string, number[][]>;
  for (const p of pages) {
    expect(now[p], p).toHaveLength(base[p].length);
    for (const [i, r] of now[p].entries()) {
      r.forEach((v, k) => expect(Math.abs(v - base[p][i][k]), `${p} [${i}][${k}]`).toBeLessThanOrEqual(1));
    }
  }
});

const paintedBySet: Record<string, { glass: string; body: string; painted: string }> = {
  tally: {
    glass: ".ta-panel, .ta-filters__group, .ta-checkrow a",
    body: ".ta-main, .ta-face",
    painted: ".ta-index, .ta-panel, .ta-filters__group, .ta-slip, .ta-face, .ta-checkrow a",
  },
  answer: {
    glass: ".an-find, .an-checkrow a",
    body: ".an-main, .an-face",
    painted: ".an-index, .an-find, .an-panel, .an-slip, .an-face, .an-checkrow a",
  },
  figure: {
    glass: ".fi-panel, .fi-filters__group, .fi-checkrow",
    body: ".fi-main, .fi-face",
    painted: ".fi-panel, .fi-filters__group, .fi-checkrow, .fi-face",
  },
  inline: {
    glass: ".il-index, .il-checkrow a",
    body: ".il-main, .il-face",
    painted: ".il-index, .il-panel, .il-slip, .il-face, .il-checkrow a",
  },
};

function surfaces() {
  const found = paintedBySet[set];
  if (!found) throw new Error(`不明なセット: ${set}`);
  return found;
}

async function paintedEffects(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  return page.$$eval(surfaces().painted, (els) =>
    els.flatMap((e) => {
      const s = getComputedStyle(e);
      const filter = s.backdropFilter;
      const shadow = s.boxShadow;
      const blur = filter && filter !== "none";
      const shade = shadow && shadow !== "none";
      if (!blur && !shade) return [];
      return [`${e.className} backdrop=${filter} shadow=${shadow}`];
    }),
  );
}

test("本文の面はすりガラスでなく、見えるすりガラスがある", async ({ page }) => {
  test.skip(finish !== "real", "real の build だけで確かめる");
  const sel = surfaces();
  for (const p of pages) {
    await page.goto(p);
    const body = await page.$$eval(sel.body, (els) =>
      els
        .filter((e) => e.checkVisibility())
        .map((e) => getComputedStyle(e).backdropFilter),
    );
    if (!p.startsWith("/search/")) expect(body.length, p).toBeGreaterThan(0);
    for (const filter of body) expect(filter, p).toBe("none");
    const glass = await page.$$eval(sel.glass, (els) =>
      els.filter((e) => e.checkVisibility() && getComputedStyle(e).backdropFilter !== "none").length,
    );
    expect(glass, p).toBeGreaterThan(0);
    expect(glass, p).toBeLessThanOrEqual(6);
  }
});

test("forced-colors と印刷ですりガラスと影が外れる", async ({ page }) => {
  test.skip(finish !== "real", "real の build だけで確かめる");
  const cases = [
    { forcedColors: "active" as const, media: "screen" as const },
    { forcedColors: "none" as const, media: "print" as const },
  ];
  for (const media of cases) {
    await page.emulateMedia(media);
    for (const p of pages) {
      const left = await paintedEffects(page, p);
      expect(left, `${p} ${JSON.stringify(media)}`).toEqual([]);
    }
  }
});

test("prefers-reduced-transparency ですりガラスが外れる", async ({ page }) => {
  test.skip(finish !== "real", "real の build だけで確かめる");
  let emulated = false;
  try {
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    });
    await page.goto(pages[0]);
    emulated = await page.evaluate(() => matchMedia("(prefers-reduced-transparency: reduce)").matches);
  } catch {
    emulated = false;
  }
  if (!emulated) {
    console.log("⏳ prefers-reduced-transparency は emulate できない");
    test.info().annotations.push({ type: "pending", description: "prefers-reduced-transparency は emulate できない" });
    return;
  }
  test.info().annotations.push({ type: "emulated", description: "prefers-reduced-transparency: reduce" });
  for (const p of pages) {
    const left = await paintedEffects(page, p);
    const blur = left.filter((line) => line.includes("backdrop=") && !line.includes("backdrop=none"));
    expect(blur, p).toEqual([]);
  }
});
