// 1つのサイトで apps/site の npm script を動かす。例: npm run site -- ai dev
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const [slug, script = "dev", ...rest] = process.argv.slice(2);
if (!slug || !existsSync(`sites/${slug}/site.json`)) {
  console.error("usage: npm run site -- <slug> [script]（slug は sites/ のうち site.json があるフォルダ）");
  process.exit(1);
}
const extra = rest[0] === "--" ? rest.slice(1) : rest;
const args = extra.length ? ` -- ${extra.join(" ")}` : "";
execSync(`npm run ${script} -w @jitty-business/site${args}`, { stdio: "inherit", env: { ...process.env, DD_SITE: slug } });
