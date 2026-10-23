// 一時スクリプト（工程20の structure.spec.ts まで）。見出し・landmark・main のリンク先を比べる。
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parse } from "node-html-parser";

const dirs = process.argv.slice(2);
if (dirs.length < 2) {
  console.error("usage: node scripts/compare-structure.mjs <reference-dist> <other-dist>...");
  process.exit(1);
}

const pages = ["index.html", "articles/sample-social-insurance/index.html"];
const labelOf = (dir) => basename(dir);

const norm = (value) => (value ?? "").replace(/\s+/g, " ").trim();

function headings(html) {
  return parse(html)
    .querySelectorAll("h1, h2, h3, h4, h5, h6")
    .map((el) => `${el.tagName.toLowerCase()}:${norm(el.text)}`);
}

function landmarks(html) {
  return parse(html)
    .querySelectorAll(
      "header, nav, main, aside, footer, form[role=search], section[aria-label], section[aria-labelledby], [role=region]",
    )
    .map((el) => {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") ?? "";
      const label = el.getAttribute("aria-label") ?? "";
      const labelledby = el.getAttribute("aria-labelledby") ?? "";
      return `${tag}|role=${role}|label=${label}|by=${labelledby}`;
    });
}

function mainLinks(html) {
  const main = parse(html).querySelector("main");
  if (!main) return ["MISSING MAIN"];
  return main.querySelectorAll("a[href]").map((el) => {
    const href = el.getAttribute("href") ?? "";
    const url = new URL(href, "http://local.test");
    return `${url.pathname}${url.search}${url.hash}`;
  });
}

let failed = 0;
const [referenceDir, ...others] = dirs;
const referenceLabel = labelOf(referenceDir);
for (const page of pages) {
  const referenceHtml = await readFile(join(referenceDir, page), "utf8");
  for (const otherDir of others) {
    const otherLabel = labelOf(otherDir);
    const otherHtml = await readFile(join(otherDir, page), "utf8");
    for (const [name, pick] of [
      ["headings", headings],
      ["landmarks", landmarks],
      ["mainLinks", mainLinks],
    ]) {
      const a = pick(referenceHtml);
      const b = pick(otherHtml);
      const same = a.length === b.length && a.every((item, i) => item === b[i]);
      if (same) {
        console.log(`OK ${page} ${referenceLabel}=${otherLabel} ${name} (${a.length})`);
        continue;
      }
      failed += 1;
      console.log(`DIFF ${page} ${referenceLabel} vs ${otherLabel} ${name}`);
      const n = Math.max(a.length, b.length);
      for (let i = 0; i < n; i++) {
        if (a[i] !== b[i]) {
          console.log(`  [${i}]\n    ${referenceLabel}: ${a[i] ?? "—"}\n    ${otherLabel}: ${b[i] ?? "—"}`);
        }
      }
    }
  }
}
process.exit(failed === 0 ? 0 : 1);
