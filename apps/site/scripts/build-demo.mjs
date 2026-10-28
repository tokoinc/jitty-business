import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const OUT = "dist-demo";
const combos = ["binder", "board", "spread", "tally", "answer", "figure", "inline"].flatMap((s) => ["flat", "real"].map((f) => [s, f]));
for (const [set, finish] of combos) {
  const name = `${set}-${finish}`;
  const env = { ...process.env, DD_MODE: "demo", DD_DESIGN_SET: set, DD_FINISH: finish, DD_BASE: `/demo/${name}/`, DD_OUT_DIR: `${OUT}/demo/${name}`, DD_INSPECT: "1" };
  execSync("npx astro build", { stdio: "inherit", env });
  execSync(`npx pagefind --site ${OUT}/demo/${name}`, { stdio: "inherit", env });
  execSync("node scripts/check-output.mjs", { stdio: "inherit", env });
}
mkdirSync(`${OUT}/demo`, { recursive: true });
const links = combos.map(([s, f]) => `<li><a href="/demo/${s}-${f}/">${s} / ${f}</a>（<a href="/demo/${s}-${f}/?inspect=L2">L2</a>）</li>`).join("");
writeFileSync(`${OUT}/demo/index.html`, `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="robots" content="noindex"><title>比較デモ</title><h1>比較デモ（7セット×2質感）</h1><ul>${links}</ul></html>`);
