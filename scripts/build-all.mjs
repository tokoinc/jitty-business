// 全サイトを build し、dist/<base>/ に並べる（business.jitty.jp にそのまま配る形）
// 引数で slug を渡すと、そのサイトだけ build する。例: npm run build:all -- ai bpo
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const all = readdirSync("sites").filter((slug) => existsSync(`sites/${slug}/site.json`));
const only = process.argv.slice(2);
const slugs = (only.length ? only : all).filter((slug) => slug !== "tenshoku-dokuritsu");

for (const slug of slugs) {
  if (!all.includes(slug)) throw new Error(`sites/${slug}/site.json が無い`);
  const out = resolve(root, "dist", slug);
  rmSync(out, { recursive: true, force: true });
  console.log(`\n=== ${slug} → dist/${slug}/`);
  execSync("npm run build -w @jitty-business/site", { stdio: "inherit", env: { ...process.env, DD_SITE: slug, DD_OUT_DIR: out } });
}

// tenshoku-dokuritsu は独自のアプリ。base（/dokuritsu-tenshoku/）に合わせて置く
if (!only.length || only.includes("tenshoku-dokuritsu")) {
  console.log("\n=== tenshoku-dokuritsu → dist/dokuritsu-tenshoku/");
  execSync("npm run build -w @jitty-business/tenshoku-dokuritsu", { stdio: "inherit" });
  const out = resolve(root, "dist", "dokuritsu-tenshoku");
  rmSync(out, { recursive: true, force: true });
  cpSync("apps/tenshoku-dokuritsu/dist", out, { recursive: true });
}
