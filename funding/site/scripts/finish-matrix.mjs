// 工程18b。3セット×flat/real の build、寸法、L1・L2、スタイルガイド、すりガラスの数。
// 工程19b は、サーバーを自分で立てず、次で記事だけを撮れる:
//   node scripts/finish-matrix.mjs --shoot-only --dest docs/qa/samples --paths /articles/a/,/articles/b/

import { execSync, spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const ORIGIN = "http://localhost:4321";
const sets = ["binder", "board", "spread"];
const finishes = ["flat", "real"];
const pages = [
  ["home", "/"],
  ["list", "/category/finance/"],
  ["search", "/search/?q=保険料"],
  ["article", "/articles/sample-social-insurance/"],
];
const bodySelector = {
  binder: ".bi-sheet, .bi-face",
  board: ".bo-panel, .bo-face",
  spread: ".sp-face, .sp-nextface",
};

function arg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] ?? "";
}

/** 開発サーバーの中のパスだけを通す。`@host/` や `//host/` で外のホストへ行かせない */
function localUrl(href) {
  if (!href.startsWith("/") || href.startsWith("//")) throw new Error(`--paths は / で始まるパス: ${href}`);
  const url = new URL(href, ORIGIN);
  if (url.origin !== ORIGIN) throw new Error(`--paths が ${ORIGIN} の外を指している: ${href}`);
  return url.href;
}

const shootOnly = process.argv.includes("--shoot-only");
const dest = arg("--dest");
const pathArg = arg("--paths");
const shootPages = pathArg
  ? pathArg.split(",").filter(Boolean).map((item, index) => [`p${index + 1}`, item])
  : pages;
// サーバーとブラウザを起動する前に止める
for (const [, href] of shootPages) localUrl(href);

function wait(child, label) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} が ${code} で止まった`));
    });
  });
}

/** node は shell を通さずに起動する */
function runNode(args, env) {
  const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, ...env } });
  return wait(child, `node ${args.join(" ")}`);
}

/** npm / npx は Windows で shell が要る。値を埋め込まない固定の文字列だけを渡し、値は env で渡す */
function runShell(command, env) {
  const child = spawn(command, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  return wait(child, command);
}

/** 4321 番で待ち受けている node だけを止める（ほかのアプリは止めない） */
function freePort() {
  if (process.platform !== "win32") return;
  const script = [
    "Get-NetTCPConnection -LocalPort 4321 -State Listen -ErrorAction SilentlyContinue",
    "| ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }",
    "| Where-Object { $_.ProcessName -eq 'node' }",
    "| Stop-Process -Force -ErrorAction SilentlyContinue",
  ].join(" ");
  try {
    execSync(`powershell -NoProfile -Command "${script}"`, { stdio: "ignore" });
  } catch {
    // 待ち受けが無い
  }
}

async function distHasMaterial(dir = "dist") {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "pagefind" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (await distHasMaterial(full)) return true;
    } else if (/\.(css|html)$/.test(entry.name)) {
      const text = await readFile(full, "utf8");
      if (text.includes("--m-")) return true;
    }
  }
  return false;
}

function startDev(set, finish) {
  return spawn("npm run dev:inspect", {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, DD_DESIGN_SET: set, DD_FINISH: finish, DD_INSPECT: "1" },
  });
}

async function waitForServer(child) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`dev が止まった: ${child.exitCode}`);
    try {
      const response = await fetch(`${ORIGIN}/`);
      if (response.ok) return;
    } catch {
      // まだ起動していない
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("dev が起動しない");
}

function stopDev(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform !== "win32" || !Number.isInteger(child.pid)) {
    child.kill();
    return;
  }
  try {
    execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
  } catch {
    child.kill();
  }
}

async function shootIdentity(set, finish) {
  const out = `docs/identity/${set}-${finish}`;
  for (const level of ["L1", "L2"]) {
    await runNode(["scripts/shoot.mjs", "--out", out, "--inspect", level, "--set", set], {});
  }
}

async function shootGuide(page, set, finish) {
  const dir = path.resolve(`docs/qa/styleguide-${set}-${finish}`);
  await mkdir(dir, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${ORIGIN}/styleguide/`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dir, "styleguide-1280.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 800 });
  await page.screenshot({ path: path.join(dir, "styleguide-375.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.screenshot({ path: path.join(dir, "styleguide-200.png"), fullPage: true });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
}

async function countGlass(page, set) {
  const rows = [];
  for (const [name, href] of pages) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localUrl(href), { waitUntil: "load" });
    const counted = await page.evaluate((body) => {
      const visible = (el) => el.checkVisibility() && !el.closest("[hidden]");
      const glass = [...document.querySelectorAll("*")].filter((el) => {
        const filter = getComputedStyle(el).backdropFilter;
        return Boolean(filter && filter !== "none" && visible(el));
      });
      const faces = [...document.querySelectorAll(body)].filter(visible);
      const faceGlass = faces.filter((el) => getComputedStyle(el).backdropFilter !== "none");
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return {
        count: glass.length,
        names: glass.map((el) => el.getAttribute("class") || el.tagName).slice(0, 8),
        faceGlass: faceGlass.length,
        overflow,
      };
    }, bodySelector[set]);
    rows.push({ name, ...counted });
  }
  return rows;
}

async function shootOne(page, href, file) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(localUrl(href), { waitUntil: "load" });
      await page.waitForTimeout(400);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: file, fullPage: true });
      return;
    } catch (error) {
      const destroyed = String(error).includes("Execution context was destroyed");
      if (!destroyed || attempt === 2) throw error;
    }
  }
}

async function shootCustom(page, set, finish) {
  const dir = path.resolve(dest, `${set}-${finish}`);
  await mkdir(dir, { recursive: true });
  for (const [name, href] of shootPages) {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await shootOne(page, href, path.join(dir, `${name}-${width}.png`));
    }
  }
}

async function withDev(set, finish, visit) {
  freePort();
  const child = startDev(set, finish);
  const browser = await chromium.launch();
  try {
    await waitForServer(child);
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent = "astro-dev-toolbar { display: none !important; }";
      document.documentElement.append(style);
    });
    await visit(page);
  } finally {
    await browser.close();
    stopDev(child);
    freePort();
  }
}

const glassReport = [];

if (shootOnly) {
  if (!dest) throw new Error("--dest が必要");
  for (const set of sets) {
    for (const finish of finishes) {
      console.log(`\n== shoot ${set} ${finish} ==`);
      await withDev(set, finish, (page) => shootCustom(page, set, finish));
    }
  }
} else {
  for (const set of sets) {
    for (const finish of finishes) {
      console.log(`\n== ${set} ${finish} ==`);
      freePort();
      await runShell("npm run build", {
        DD_DESIGN_SET: set,
        DD_FINISH: finish,
        DD_INSPECT: "",
      });
      const marked = await distHasMaterial();
      if (finish === "flat" && marked) throw new Error(`${set} flat の dist に --m- がある`);
      if (finish === "real" && !marked) throw new Error(`${set} real の dist に --m- が無い`);
      console.log(`--m- ${marked ? "あり" : "なし"}`);
      freePort();
      await runShell("npx playwright test --project=identity tests/identity/finish.spec.ts", {
        DD_DESIGN_SET: set,
        DD_FINISH: finish,
        DD_INSPECT: "",
      });
      await withDev(set, finish, async (page) => {
        await shootIdentity(set, finish);
        await shootGuide(page, set, finish);
        if (finish === "real") {
          const rows = await countGlass(page, set);
          glassReport.push({ set, rows });
          for (const row of rows) {
            console.log(`${set} ${row.name}: glass ${row.count} faceGlass ${row.faceGlass} overflow ${row.overflow}`);
            if (row.count > 6 || row.faceGlass > 0) {
              throw new Error(`${set} ${row.name} のすりガラスが条件を外れた`);
            }
          }
        }
      });
    }
  }

  const lines = [
    "# 質感のすりガラス",
    "",
    "数えた日: 2026-10-08。幅 1280。`backdrop-filter` が `none` でなく、`checkVisibility()` が真で、`[hidden]` の中に無い要素を1面とした。",
    "",
    "## 本文の面",
    "",
    "real では、Binder の `.bi-sheet` と `.bi-face`、Board の `.bo-panel` と `.bo-face`、Spread の `.sp-face` と `.sp-nextface` の `backdrop-filter` は `none`（下表の faceGlass が 0）。",
    "",
    "## real の4画面",
    "",
    "| セット | 画面 | すりガラス | 本文の面 | はみ出し | クラス |",
    "|---|---|---:|---:|---|---|",
  ];
  for (const item of glassReport) {
    for (const row of item.rows) {
      lines.push(
        `| ${item.set} | ${row.name} | ${row.count} | ${row.faceGlass} | ${row.overflow ? "あり" : "なし"} | ${row.names.join(", ")} |`,
      );
    }
  }
  lines.push(
    "",
    "いずれも 6 面以内。flat の build に `--m-` は無く、real の build にはある。",
    "",
    "forced-colors、印刷、`prefers-reduced-transparency` は `tests/identity/finish.spec.ts` が、各セットの real で通している。",
    "",
    "Spread で索引の問いを不透明にした理由は `docs/adr/0009-glass-budget.md`。",
    "",
  );
  await mkdir("docs/qa", { recursive: true });
  await writeFile("docs/qa/finish.md", lines.join("\n"));
  console.log("docs/qa/finish.md を書いた");
}
