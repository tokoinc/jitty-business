import { expect, test } from "@playwright/test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { SET_IDS } from "../../src/design-sets/contract";

const OUT = "dist";
const SETS = SET_IDS;

type Heading = { level: number; text: string };
type Snapshot = {
  headings: Heading[];
  landmarks: string[];
  mainLinks: string[];
  pagefind: string;
};
type Report = { set: string; pages: Record<string, Snapshot> };

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

function toUrl(file: string): string {
  const rel = relative(OUT, file).split("\\").join("/");
  if (rel === "404.html") return "/404.html";
  if (rel === "index.html") return "/";
  return `/${rel.replace(/index\.html$/, "")}`;
}

function extract(): Snapshot {
  const norm = (value: string) => value.replace(/\s+/g, " ").trim();
  const textOf = (el: Element) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove());
    return norm(clone.textContent ?? "");
  };
  const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((el) => ({
    level: Number(el.tagName.slice(1)),
    text: textOf(el),
  }));
  const landmarks = [
    ...document.querySelectorAll(
      "header, nav, main, aside, footer, form[role=search], section[aria-label], section[aria-labelledby], [role=region]",
    ),
  ].map((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role") ?? "";
    const label = el.getAttribute("aria-label") ?? "";
    const labelledby = el.getAttribute("aria-labelledby") ?? "";
    return `${tag}|role=${role}|label=${label}|by=${labelledby}`;
  });
  const main = document.querySelector("main");
  const mainLinks = main
    ? [...main.querySelectorAll("a[href]")].map((el) => {
        const href = el.getAttribute("href") ?? "";
        const url = new URL(href, location.href);
        return `${url.pathname}${url.search}${url.hash}`;
      })
    : ["MISSING MAIN"];
  const pagefind = [...document.querySelectorAll("[data-pagefind-body]")].map((el) => textOf(el)).join("\n");
  return { headings, landmarks, mainLinks, pagefind };
}

function listDiff(path: string, leftSet: string, rightSet: string, field: string, left: string[], right: string[]): string[] {
  if (left.length === right.length && left.every((item, index) => item === right[index])) return [];
  const lines = [`${path}: ${field} が ${leftSet} と ${rightSet} で違う`];
  const count = Math.max(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    if (left[index] !== right[index]) {
      lines.push(`  [${index}] ${leftSet}: ${left[index] ?? "—"}`);
      lines.push(`  [${index}] ${rightSet}: ${right[index] ?? "—"}`);
    }
  }
  return lines;
}

function textDiff(path: string, leftSet: string, rightSet: string, left: string, right: string): string[] {
  if (left === right) return [];
  const length = Math.max(left.length, right.length);
  let index = 0;
  while (index < length && left[index] === right[index]) index += 1;
  const from = Math.max(0, index - 24);
  return [
    `${path}: pagefind が ${leftSet} と ${rightSet} で違う`,
    `  [${index}] ${leftSet}: ${left.slice(from, index + 24)}`,
    `  [${index}] ${rightSet}: ${right.slice(from, index + 24)}`,
  ];
}

function compare(reports: Report[]): string[] {
  const [base, ...rest] = reports;
  if (!base) return ["比較する構造がない"];
  const paths = new Set<string>();
  for (const report of reports) {
    for (const path of Object.keys(report.pages)) paths.add(path);
  }
  const lines: string[] = [];
  for (const path of [...paths].sort()) {
    for (const other of rest) {
      const left = base.pages[path];
      const right = other.pages[path];
      if (!left || !right) {
        lines.push(`${path}: ${left ? base.set : other.set} にだけある`);
        continue;
      }
      lines.push(
        ...listDiff(
          path,
          base.set,
          other.set,
          "headings",
          left.headings.map((heading) => `h${heading.level}:${heading.text}`),
          right.headings.map((heading) => `h${heading.level}:${heading.text}`),
        ),
        ...listDiff(path, base.set, other.set, "landmarks", left.landmarks, right.landmarks),
        ...listDiff(path, base.set, other.set, "mainLinks", left.mainLinks, right.mainLinks),
        ...textDiff(path, base.set, other.set, left.pagefind, right.pagefind),
      );
    }
  }
  return lines;
}

test("全セットの構造を書いて比べる", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop だけ");
  test.setTimeout(180_000);

  const files = (await walk(OUT)).filter((file) => {
    const rel = relative(OUT, file).split("\\").join("/");
    return file.endsWith(".html") && !rel.includes("pagefind/");
  });
  const urls = [...new Set(files.map(toUrl))].sort();
  expect(urls.length).toBeGreaterThan(0);

  const first = urls.find((url) => url !== "/404.html") ?? "/";
  await page.goto(first);
  const served = await page.locator("html").getAttribute("data-design-set");
  const expected = process.env.DD_DESIGN_SET;
  if (expected && served !== expected) {
    throw new Error(
      `preview の data-design-set は ${served}。DD_DESIGN_SET=${expected}。4321 のサーバーを止めてからやり直す`,
    );
  }
  const set = expected || served;
  if (!set || !(SETS as readonly string[]).includes(set)) {
    throw new Error(`不明なセット: ${set}`);
  }

  const pages: Record<string, Snapshot> = {};
  for (const url of urls) {
    await page.goto(url);
    pages[url] = await page.evaluate(extract);
  }
  const file = `docs/qa/structure-${set}.json`;
  await mkdir(dirname(file), { recursive: true });
  const report: Report = { set, pages };
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);

  const loaded: Report[] = [];
  for (const id of SETS) {
    try {
      loaded.push(JSON.parse(await readFile(`docs/qa/structure-${id}.json`, "utf8")) as Report);
    } catch {
      return;
    }
  }
  const diffs = compare(loaded);
  expect(diffs, diffs.join("\n")).toEqual([]);
});
