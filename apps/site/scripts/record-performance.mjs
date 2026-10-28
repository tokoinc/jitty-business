// モバイル Lighthouse を3回測り、中央値を JSON で書く。
// 前提: http://localhost:4321 で preview が動いている。
//   node scripts/record-performance.mjs tally flat

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { dirname, extname, join, relative } from "node:path";
import { chromium } from "@playwright/test";

// 引数はファイル名と Lighthouse の引数に入る。許可した値だけを通す。
const set = process.argv[2];
const finish = process.argv[3];
if (!["tally", "answer", "figure", "inline"].includes(set) || !["flat", "real"].includes(finish)) {
  console.error("使い方: node scripts/record-performance.mjs <tally|answer|figure|inline> <flat|real>");
  process.exit(1);
}

// shell を通さずに起動する（パスの空白や記号を解釈させない）。依存はルートの node_modules にある（npm workspaces）
const LIGHTHOUSE = join(dirname(createRequire(import.meta.url).resolve("lighthouse/package.json")), "cli", "index.js");
const lighthouse = (args) => spawnSync(process.execPath, [LIGHTHOUSE, ...args], { encoding: "utf8" });

const pages = [
  ["home", "http://localhost:4321/"],
  ["article", "http://localhost:4321/articles/sample-social-insurance/"],
  ["search", "http://localhost:4321/search/?q=%E4%BF%9D%E9%99%BA%E6%96%99"],
];

function chrome() {
  const exe = process.env.CHROME_PATH || chromium.executablePath();
  if (!existsSync(exe)) throw new Error("Playwright の Chrome が見つからない。CHROME_PATH を設定する");
  return exe;
}

async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function budgets() {
  const files = await walk("dist");
  const rel = (file) => "/" + relative("dist", file).split("\\").join("/");
  let css = 0;
  for (const file of files) {
    if (extname(file) !== ".css" || rel(file).startsWith("/pagefind/")) continue;
    css += gzipSync(await readFile(file)).length;
  }
  let maxJs = 0;
  for (const file of files.filter((item) => item.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    let js = 0;
    for (const src of html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)) {
      const path = src[1].startsWith("/") ? src[1].slice(1) : src[1];
      try {
        js += gzipSync(await readFile(join("dist", ...path.split("/")))).length;
      } catch {
        // 外部スクリプトは数えない
      }
    }
    if (js > maxJs) maxJs = js;
  }
  return { css, maxJs };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const version = lighthouse(["--version"]);
const lighthouseVersion = (version.stdout || version.stderr).trim().split(/\r?\n/).at(-1) ?? "";
const executable = chrome();
const runs = [];

for (const [id, url] of pages) {
  const scores = [];
  for (let i = 0; i < 3; i += 1) {
    await mkdir(".tmp", { recursive: true });
    const out = join(".tmp", `lh-${set}-${finish}-${id}-${i}.json`);
    const result = lighthouse([
      url,
      "--quiet",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--throttling-method=simulate",
      "--output=json",
      `--output-path=${out}`,
      `--chrome-path=${executable}`,
      "--chrome-flags=--headless=new",
    ]);
    if (result.status !== 0) {
      console.error(result.stdout);
      console.error(result.stderr);
      throw new Error(`Lighthouse が止まった: ${id} ${i}`);
    }
    const report = JSON.parse(await readFile(out, "utf8"));
    const audit = (key) => report.audits[key]?.numericValue ?? null;
    scores.push({
      performance: report.categories.performance.score,
      accessibility: report.categories.accessibility.score,
      bestPractices: report.categories["best-practices"].score,
      seo: report.categories.seo.score,
      lcp: audit("largest-contentful-paint"),
      cls: audit("cumulative-layout-shift"),
      tbt: audit("total-blocking-time"),
    });
    console.log(set, finish, id, i, scores.at(-1));
  }
  const mid = {};
  for (const key of Object.keys(scores[0])) mid[key] = median(scores.map((row) => row[key]));
  runs.push({ id, scores, median: mid });
}

const record = {
  set,
  finish,
  measuredAt: new Date().toISOString(),
  node: process.version,
  lighthouse: lighthouseVersion,
  chrome: executable,
  formFactor: "mobile",
  throttling: "simulate",
  runs: 3,
  budgets: await budgets(),
  pages: runs,
};
await mkdir("docs/qa", { recursive: true });
await writeFile(`docs/qa/performance-${set}-${finish}.json`, JSON.stringify(record, null, 2));
console.log(`wrote docs/qa/performance-${set}-${finish}.json`);
