// 実装の4画面を、同じ幅・同じ識別検査モードで撮る。scripts/finish-matrix.mjs が使う。
// 引数: --base（既定 http://localhost:4321） --out --inspect（L1/L2/L3。省略可）
// 画面名: home / list（/category/finance/） / search / article。幅は 1280 と 375。
// --inspect があるとき、ファイル名の末尾に -L1 等を付ける（同じフォルダに L1 と L2 を残すため）。

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const IMPL = [
  { screen: "home", path: "" },
  { screen: "list", path: "category/finance/" },
  { screen: "search", path: "search/", query: { q: "保険料" } },
  { screen: "article", path: "articles/sample-social-insurance/" },
];

function parseArgs(argv) {
  const options = { base: "http://localhost:4321", out: "", inspect: "" };
  const names = new Set(Object.keys(options));
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    const name = key?.startsWith("--") ? key.slice(2) : "";
    if (!names.has(name) || value === undefined || value.startsWith("--")) {
      throw new Error(`引数の形が違う: ${key ?? ""}`);
    }
    options[name] = value;
    i += 1;
  }
  if (!options.out) throw new Error("--out が必要");
  if (options.inspect && !["L1", "L2", "L3"].includes(options.inspect)) {
    throw new Error("--inspect は L1 / L2 / L3");
  }
  if (!URL.canParse(options.base) || !["http:", "https:"].includes(new URL(options.base).protocol)) {
    throw new Error("--base は http(s) の URL");
  }
  return options;
}

function fileName(kind, screen, width, inspect) {
  return inspect ? `${kind}-${screen}-${width}-${inspect}.png` : `${kind}-${screen}-${width}.png`;
}

function implUrl(base, shot, inspect) {
  const root = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(shot.path, root);
  for (const [key, value] of Object.entries(shot.query ?? {})) url.searchParams.set(key, value);
  if (inspect) url.searchParams.set("inspect", inspect);
  return url.href;
}

async function shoot(page, url, width, file) {
  await page.setViewportSize({ width, height: 800 });
  const response = await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  if (response && !response.ok()) {
    throw new Error(`${response.status()} ${url}`);
  }
  await page.locator("main#main").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
}

const options = parseArgs(process.argv);
const outDir = path.resolve(options.out);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const shot of IMPL) {
    for (const width of [1280, 375]) {
      const url = implUrl(options.base, shot, options.inspect);
      await shoot(page, url, width, path.join(outDir, fileName("impl", shot.screen, width, options.inspect)));
    }
  }
} finally {
  await browser.close();
}
