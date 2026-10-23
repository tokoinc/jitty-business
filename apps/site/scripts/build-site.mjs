// DD_SITE（sites/<DD_SITE>/）を1つ build する。出力先は DD_OUT_DIR（既定は dist）
import { execSync } from "node:child_process";
const OUT = process.env.DD_OUT_DIR ?? "dist";
for (const cmd of ["node scripts/check-finish-props.mjs", "npx astro check", "npx astro build", `npx pagefind --site "${OUT}"`, "node scripts/check-output.mjs"]) {
  execSync(cmd, { stdio: "inherit" });
}
