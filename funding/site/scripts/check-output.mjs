import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { extname, join, relative } from "node:path";
import { parse } from "node-html-parser";

const OUT = process.env.DD_OUT_DIR ?? "dist";
const MODE = process.env.DD_MODE ?? "demo";
const BASE = process.env.DD_BASE ?? "/funding/";
const PREFIX = { binder: "bi-", board: "bo-", spread: "sp-" };
const SAFE_SCHEMES = new Set(["http", "https", "mailto"]);
const DATA_SCRIPT_TYPES = new Set(["application/ld+json", "application/json"]);
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    out.push(...(e.isDirectory() ? await walk(p) : [p]));
  }
  return out;
}

function checkSetCss(where, text) {
  for (const [id, p] of Object.entries(PREFIX)) {
    if (id !== set && new RegExp(`\\.${p}[a-z]`).test(text)) {
      err(where, `未選択セット ${id} のCSSが含まれている`);
    }
  }
  if (finish === "flat" && text.includes("--m-")) {
    err(where, "flat なのにモダンリアルの層が含まれている");
  }
}

const files = await walk(OUT);
const rel = (f) => "/" + relative(OUT, f).split("\\").join("/");
const exists = new Set(files.map(rel));
const sitemap = exists.has("/sitemap.xml") ? await readFile(join(OUT, "sitemap.xml"), "utf8") : "";
let set;
let finish;
let styleNodes = 0;
let adLinks = 0;
let maxJs = 0;
let inspectPanels = 0;

for (const f of files.filter((x) => x.endsWith(".html"))) {
  const r = rel(f);
  const html = await readFile(f, "utf8");
  const doc = parse(html);
  const root = doc.querySelector("html");
  set ??= root?.getAttribute("data-design-set");
  finish ??= root?.getAttribute("data-finish");
  if (root?.getAttribute("data-design-set") !== set) err(r, "data-design-set がページごとに違う");
  if (!r.endsWith("/404.html") && doc.querySelectorAll("h1").length !== 1) err(r, "h1 が1つでない");
  const noindex = (doc.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "").includes(
    "noindex",
  );
  if (MODE !== "production" && !noindex) err(r, "production 以外なのに noindex が無い");
  const url = BASE.replace(/\/$/, "") + r.replace(/index\.html$/, "");
  if (noindex && sitemap.includes(`${url}<`)) err(r, "noindex のページが sitemap にある");
  if (MODE === "production") {
    if (/example\.(com|org|net)/.test(html)) err(r, "example.com 等の仮URLが残っている");
    if (doc.querySelector(".dd-sample")) err(r, "サンプルの表示が残っている");
    if (doc.querySelector(".dd-inspect") || html.includes("data-inspect")) {
      err(r, "識別検査モードが残っている");
    }
  }
  for (const a of doc.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith(BASE) || href.startsWith("//")) continue;
    const path = decodeURI(href.split(/[?#]/)[0]).slice(BASE.length - 1);
    const target = path.endsWith("/") ? `${path}index.html` : path;
    if (!exists.has(target)) err(r, `リンク切れ: ${href}`);
  }
  for (const a of doc.querySelectorAll("a[data-ad]")) {
    adLinks += 1;
    if (!(a.getAttribute("rel") ?? "").includes("sponsored")) {
      err(r, `広告リンクに rel="sponsored" がない: ${a.getAttribute("href")}`);
    }
  }
  for (const a of doc.querySelectorAll("a[href]")) {
    const relAttr = a.getAttribute("rel") ?? "";
    if (relAttr.includes("sponsored") && !a.getAttribute("data-ad")) {
      err(r, `広告リンクに data-ad がない: ${a.getAttribute("href")}`);
    }
    if (a.getAttribute("target") === "_blank" && !relAttr.split(/\s+/).includes("noopener")) {
      err(r, `target="_blank" に rel="noopener" がない: ${a.getAttribute("href")}`);
    }
  }
  // javascript: や data: のリンクを出さない。ブラウザは空白と制御文字を飛ばしてスキームを読む
  for (const el of doc.querySelectorAll("a[href], form[action]")) {
    const value = el.getAttribute("href") ?? el.getAttribute("action") ?? "";
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value.replace(/[\u0000- ]/g, ""))?.[1].toLowerCase();
    if (scheme && !SAFE_SCHEMES.has(scheme)) err(r, `使えないスキームのリンク: ${value}`);
  }
  // 実行される inline script は明暗の初期化の1つだけ（CSP でハッシュを許すのはこれだけにする。ADR-0012）
  const inlineScripts = doc
    .querySelectorAll("script")
    .filter(
      (s) => !s.getAttribute("src") && !DATA_SCRIPT_TYPES.has((s.getAttribute("type") ?? "").toLowerCase()),
    );
  if (inlineScripts.length > 1)
    err(r, `実行される inline script が ${inlineScripts.length} 個（明暗の初期化の1つまで）`);
  // build.inlineStylesheets の既定は auto。小さいCSSは <style> になるので、ファイルと同じ接頭辞と --m- を見る。
  for (const style of doc.querySelectorAll("style")) {
    styleNodes += 1;
    checkSetCss(r, style.textContent ?? "");
  }
  let js = 0;
  for (const s of doc.querySelectorAll("script[type=module][src]")) {
    const src = s.getAttribute("src").slice(BASE.length - 1);
    if (exists.has(src)) js += gzipSync(await readFile(join(OUT, src))).length;
  }
  if (js > maxJs) maxJs = js;
  if (js > 20 * 1024) err(r, `初期JSが gzip ${Math.round(js / 1024)}KB（予算 20KB）`);
  inspectPanels += doc.querySelectorAll(".dd-inspect").length;
}

const inspectOn = process.env.DD_INSPECT === "1";
if (inspectOn && inspectPanels === 0) err("識別検査", "DD_INSPECT=1 なのに .dd-inspect が無い");
if (!inspectOn && inspectPanels > 0) err("識別検査", "識別検査モードが残っている");

let css = 0;
for (const f of files.filter((x) => extname(x) === ".css" && !rel(x).startsWith("/pagefind/"))) {
  const text = await readFile(f, "utf8");
  css += gzipSync(text).length;
  checkSetCss(rel(f), text);
}
const budget = (finish === "real" ? 38 : 30) * 1024;
if (css > budget) err("CSS", `gzip ${Math.round(css / 1024)}KB（予算 ${budget / 1024}KB）`);

if (errors.length) {
  console.error(`check-output: ${errors.length} 件\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-output: OK（${set} / ${finish} / ${MODE}）`);
console.log(
  `check-output: CSS gzip ${css} bytes、初期JS gzip 最大 ${maxJs} bytes、style 要素 ${styleNodes}、広告リンク ${adLinks}`,
);
console.log(`check-output: 識別検査モード ${inspectOn ? "あり" : "なし"}（.dd-inspect ${inspectPanels}）`);
