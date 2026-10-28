// 全サイトを build し、dist/ に並べる（business.jitty.jp にそのまま配る形）
// site.json の base が "/" のサイトは dist/ の直下、ほかは dist/<slug>/ に置く。
// 引数で slug を渡すと、そのサイトだけ build する。例: npm run build:all -- ai bpo
import { execSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const DIST = resolve(root, "dist");
// tenshoku-dokuritsu は独自のアプリ。base は /dokuritsu-tenshoku/
const TENSHOKU = { slug: "tenshoku-dokuritsu", dir: "dokuritsu-tenshoku" };

const sites = readdirSync("sites")
  .filter((slug) => existsSync(`sites/${slug}/site.json`))
  .map((slug) => {
    const profile = JSON.parse(readFileSync(`sites/${slug}/site.json`, "utf8"));
    const base = profile.base ?? `/${slug}/`;
    if (!/^\/([a-z0-9]+(?:-[a-z0-9]+)*\/)?$/.test(base)) throw new Error(`sites/${slug}/site.json の base は "/" か "/<名前>/": ${base}`);
    return { slug, base, dir: base.slice(1, -1) };
  });
const all = sites.map((s) => s.slug);
const only = process.argv.slice(2);
for (const slug of only) if (!all.includes(slug) && slug !== TENSHOKU.slug) throw new Error(`sites/${slug}/site.json が無い`);

const rootSites = sites.filter((s) => s.dir === "");
if (rootSites.length > 1) throw new Error(`base が "/" のサイトは1つだけ: ${rootSites.map((s) => s.slug).join(", ")}`);
// サブディレクトリに置く名前。直下のサイトのページと重ねない
const subdirs = [...sites.filter((s) => s.dir !== "").map((s) => s.dir), TENSHOKU.dir];
const dup = subdirs.find((dir, i) => subdirs.indexOf(dir) !== i);
if (dup) throw new Error(`同じ base のサイトが2つある: /${dup}/`);

const pick = (s) => (only.length ? only.includes(s.slug) : true);
const build = (slug, out) =>
  execSync("npm run build -w @jitty-business/site", { stdio: "inherit", env: { ...process.env, DD_SITE: slug, DD_OUT_DIR: out } });

// 直下のサイトは一時フォルダに build してから、dist/ のうちサブディレクトリ以外を入れ替える
for (const s of rootSites.filter(pick)) {
  const tmp = resolve(root, ".dist-root");
  rmSync(tmp, { recursive: true, force: true });
  console.log(`\n=== ${s.slug} → dist/（直下）`);
  build(s.slug, tmp);
  const clash = readdirSync(tmp).filter((name) => subdirs.includes(name));
  if (clash.length) throw new Error(`${s.slug} のページが、サブディレクトリのサイトと重なる: ${clash.join(", ")}`);
  if (existsSync(DIST)) {
    for (const name of readdirSync(DIST)) if (!subdirs.includes(name)) rmSync(resolve(DIST, name), { recursive: true, force: true });
  }
  cpSync(tmp, DIST, { recursive: true });
  rmSync(tmp, { recursive: true, force: true });
}

for (const s of sites.filter((s) => s.dir !== "").filter(pick)) {
  const out = resolve(DIST, s.dir);
  rmSync(out, { recursive: true, force: true });
  console.log(`\n=== ${s.slug} → dist/${s.dir}/`);
  build(s.slug, out);
}

if (!only.length || only.includes(TENSHOKU.slug)) {
  console.log(`\n=== ${TENSHOKU.slug} → dist/${TENSHOKU.dir}/`);
  execSync("npm run build -w @jitty-business/tenshoku-dokuritsu", { stdio: "inherit" });
  const out = resolve(DIST, TENSHOKU.dir);
  rmSync(out, { recursive: true, force: true });
  cpSync("apps/tenshoku-dokuritsu/dist", out, { recursive: true });
}

// ホスティング（Cloudflare Pages・Netlify）が読む _headers は出力の直下の1つだけ。
// 各サイトの public/_headers の規則を、置いた場所（/ と /<slug>/）ごとに並べ直して書く
const rules = readFileSync("apps/site/public/_headers", "utf8");
const comments = rules.split("\n").filter((line) => line.startsWith("#"));
const blocks = rules
  .split(/\n\s*\n/)
  .map((block) => block.split("\n").filter((line) => line.trim() && !line.startsWith("#")))
  .filter((lines) => lines.length > 0);
const prefixes = ["", ...subdirs.filter((dir) => existsSync(resolve(DIST, dir))).map((dir) => `/${dir}`)];
const out = [...comments, "# scripts/build-all.mjs が apps/site/public/_headers から作る。直接は編集しない", ""];
for (const [path, ...headers] of blocks) {
  // 全パスに付ける規則（/*）は1回でよい
  for (const prefix of path === "/*" ? [""] : prefixes) out.push(`${prefix}${path}`, ...headers, "");
}
if (existsSync(DIST)) writeFileSync(resolve(DIST, "_headers"), out.join("\n"));
