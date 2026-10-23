// 識別検査 A〜F の判定者用キット。画像は無作為な名前でコピーする。
// 答えは docs/identity/kit/answers.md。判定者には渡さない。
//   node scripts/build-identity-kit.mjs

import { randomBytes } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const sets = ["binder", "board", "spread"];
const finishes = ["flat", "real"];
const screens = ["home", "list", "search", "article"];
const root = "docs/identity";
const kit = path.join(root, "kit");
const negativesDir = path.join(root, "negative-control");

function name() {
  return `${randomBytes(4).toString("hex")}.png`;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function listPng(dir) {
  const names = await readdir(dir);
  return names.filter((item) => item.endsWith(".png")).sort();
}

async function scaled(page, src, dest) {
  const bytes = await readFile(src);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.setContent(
    `<style>body{margin:0;background:#fff}img{width:320px;height:auto;filter:blur(4px);display:block}</style><img alt="" src="data:image/png;base64,${bytes.toString("base64")}">`,
  );
  await page.locator("img").screenshot({ path: dest });
}

async function place(dir, items) {
  await mkdir(dir, { recursive: true });
  const rows = [];
  for (const item of shuffle(items)) {
    const file = name();
    await copyFile(item.src, path.join(dir, file));
    rows.push({ file, ...item });
  }
  return rows;
}

const negativeFiles = (await listPng(negativesDir)).map((file) => path.join(negativesDir, file));
if (negativeFiles.length === 0) throw new Error("陰性対照が無い");

const answers = ["# 識別検査の答え", "", "判定者には渡さない。", ""];
const rounds = [];

function sheet(title, method, pass, rows) {
  const lines = [
    `# ${title}`,
    "",
    method,
    "",
    `合格の目安: ${pass}`,
    "",
    "| 画像 | 回答 |",
    "| --- | --- |",
    ...rows.map((row) => `| ${row.file} |  |`),
    "",
  ];
  return lines.join("\n");
}

let negativeCursor = 0;
function takeNegatives(count) {
  const picked = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(negativeFiles[negativeCursor % negativeFiles.length]);
    negativeCursor += 1;
  }
  return picked;
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const finish of finishes) {
  for (const set of sets) {
    const dir = path.join(root, `${set}-${finish}`);
    for (const screen of screens) {
      const src = path.join(dir, `screen-${screen}-1280-L1.png`);
      const dest = path.join(dir, `scaled-${screen}-1280-L1.png`);
      await scaled(page, src, dest);
    }
  }
}
await browser.close();

let round = 1;
for (const finish of finishes) {
  for (const set of sets) {
    const dir = path.join(root, `${set}-${finish}`);
    const items = [
      ...screens.map((screen) => ({
        src: path.join(dir, `screen-${screen}-1280-L2.png`),
        kind: "対象",
        note: `${set} ${finish} ${screen} 1280 L2`,
      })),
      ...takeNegatives(4).map((src) => ({
        src,
        kind: "陰性対照",
        note: path.basename(src),
      })),
    ];
    const id = `A-${String(round).padStart(2, "0")}`;
    const rows = await place(path.join(kit, id), items);
    await writeFile(
      path.join(kit, `${id}.md`),
      sheet(
        `検査A 同一性 ${id}`,
        "同じサイトの画面だと思うものをまとめてください。4画面が揃う組が一つある想定です。どれにも入らない画像は「対照」と書いてください。",
        "判定者の80%以上が、対象の4画面をすべて同じ組にまとめる。",
        rows,
      ),
    );
    answers.push(`## ${id}`, "", ...rows.map((row) => `- ${row.file}: ${row.kind} / ${row.note}`), "");
    rounds.push(id);
    round += 1;
  }
}

for (const finish of finishes) {
  const items = [];
  for (const set of sets) {
    for (const frame of ["s3", "s4", "s5", "s6", "s7", "s8"]) {
      items.push({
        src: path.join(root, `${set}-${finish}`, "parts", `part-${frame}-1280-L1.png`),
        kind: set,
        note: `${set} ${finish} ${frame}`,
      });
    }
  }
  for (const src of takeNegatives(4)) {
    items.push({ src, kind: "陰性対照", note: path.basename(src) });
  }
  const id = `B-${finish}`;
  const rows = await place(path.join(kit, id), items);
  await writeFile(
    path.join(kit, `${id}.md`),
    sheet(
      `検査B 部品 ${id}`,
      "各画像が Binder / Board / Spread のどれか、または対照かを書いてください。部品は見出し枠、記事面、検索面、確認票、補足面、索引です。",
      "6部品中5部品以上で、判定者の過半数が正しいセットを選ぶ。",
      rows,
    ),
  );
  answers.push(`## ${id}`, "", ...rows.map((row) => `- ${row.file}: ${row.kind} / ${row.note}`), "");
}

const cItems = [];
for (const set of sets) {
  for (const screen of ["home", "article"]) {
    cItems.push({
      src: path.join(root, `${set}-flat`, `screen-${screen}-1280-L3.png`),
      kind: set,
      note: `${set} flat ${screen} L3`,
    });
  }
}
for (const src of takeNegatives(2)) cItems.push({ src, kind: "陰性対照", note: path.basename(src) });
{
  const rows = await place(path.join(kit, "C"), cItems);
  await writeFile(
    path.join(kit, "C.md"),
    sheet(
      "検査C セット間",
      "ホームと記事を、セットが違うものとして分けてください。違いは位置・境界・張り出しなどの形の言葉で書いてください。L3 はフラットの build だけを使います（輪郭は質感で変わらないため）。",
      "全判定者が3セットを区別でき、違いを形の言葉で説明できる。",
      rows,
    ),
  );
  answers.push("## C", "", ...rows.map((row) => `- ${row.file}: ${row.kind} / ${row.note}`), "");
}

round = 1;
for (const finish of finishes) {
  const items = [];
  for (const set of sets) {
    for (const screen of ["home", "article"]) {
      items.push({
        src: path.join(root, `${set}-${finish}`, `scaled-${screen}-1280-L1.png`),
        kind: set,
        note: `${set} ${finish} ${screen} L1 を幅320px相当に縮小し 4px ぼかし`,
      });
    }
  }
  for (const src of takeNegatives(2)) items.push({ src, kind: "陰性対照", note: path.basename(src) });
  const id = `D-${finish}`;
  const rows = await place(path.join(kit, id), items);
  await writeFile(
    path.join(kit, `${id}.md`),
    sheet(
      `検査D 縮小 ${id}`,
      "縮小してぼかした画面のセットを、Binder / Board / Spread または対照で答えてください。",
      "判定者の80%以上がセットを当てる。",
      rows,
    ),
  );
  answers.push(`## ${id}`, "", ...rows.map((row) => `- ${row.file}: ${row.kind} / ${row.note}`), "");
  round += 1;
}

round = 1;
for (const finish of finishes) {
  for (const set of sets) {
    const dir = path.join(root, `${set}-${finish}`);
    const items = [
      ...screens.map((screen) => ({
        src: path.join(dir, `screen-${screen}-375-L2.png`),
        kind: "対象",
        note: `${set} ${finish} ${screen} 375 L2`,
      })),
      ...takeNegatives(4).map((src) => ({ src, kind: "陰性対照", note: path.basename(src) })),
    ];
    const id = `E-${String(round).padStart(2, "0")}`;
    const rows = await place(path.join(kit, id), items);
    await writeFile(
      path.join(kit, `${id}.md`),
      sheet(
        `検査E 狭い画面 ${id}`,
        "幅375pxの画面です。同じサイトの画面だと思うものをまとめてください。どれにも入らない画像は「対照」と書いてください。",
        "検査Aと同じ。判定者の80%以上が、対象の4画面をすべて同じ組にまとめる。",
        rows,
      ),
    );
    answers.push(`## ${id}`, "", ...rows.map((row) => `- ${row.file}: ${row.kind} / ${row.note}`), "");
    round += 1;
  }
}

round = 1;
for (const finish of finishes) {
  for (const set of sets) {
    const id = `F-${String(round).padStart(2, "0")}`;
    const rows = await place(path.join(kit, id), [
      {
        src: path.join(root, `${set}-${finish}`, "normal-article-1280.png"),
        kind: "記事",
        note: `${set} ${finish} 通常表示の社会保険の記事`,
      },
    ]);
    await writeFile(
      path.join(kit, `${id}.md`),
      [
        `# 検査F 作業 ${id}`,
        "",
        "通常表示の記事です。次を制限時間を決めずに探してください。見つかった場所を書いてください。",
        "",
        "| 作業 | 見つかったか | 場所のメモ |",
        "| --- | --- | --- |",
        "| 対象者 |  |  |",
        "| 最終確認日 |  |  |",
        "| 重要な条件 |  |  |",
        "| 根拠 |  |  |",
        "| 目次 |  |  |",
        "| 検索への移動 |  |  |",
        "",
        `画像: ${rows[0].file}`,
        "",
        "合格の目安: 各作業の成功率90%以上。形が原因のつまずきは修正して再検査する。",
        "",
      ].join("\n"),
    );
    answers.push(
      `## ${id}`,
      "",
      `- ${rows[0].file}: ${rows[0].note}`,
      "- 対象者: 冒頭の確認票「対象」",
      "- 最終確認日: 題の上の行",
      "- 重要な条件: 本文の条件票と、確かめる領域の「条件」",
      "- 根拠: 本文の根拠票、出典、確かめる領域の「根拠」",
      "- 目次: 確かめる領域。狭い画面では本文冒頭",
      "- 検索: 索引の検索欄。狭い画面では上部の「検索」",
      "",
    );
    round += 1;
  }
}

await writeFile(path.join(kit, "answers.md"), answers.join("\n"));
await writeFile(
  path.join(kit, "README.md"),
  [
    "# 識別検査の判定者用資料",
    "",
    "判定者に渡すのは、各回のフォルダにある画像と、同じ名前の回答用紙（`A-01.md` など）だけです。",
    "",
    "`answers.md` は答えです。判定者には渡さない。",
    "",
    "判定者は5名以上、うち制作者以外を3名以上。集めた結果は `docs/identity/2026-10-08-impl.md` の表に書く。",
    "",
    "検査Cの L3 はフラットの build だけです。リアルと同じ輪郭になるため、質感ごとの L3 は撮りません。",
    "",
    "検査Fは作業の確認です。セットを当てる検査ではないので、陰性対照は混ぜていません。",
    "",
    `回: ${rounds.join("、")}、B-flat、B-real、C、D-flat、D-real、E-01〜E-06、F-01〜F-06`,
    "",
  ].join("\n"),
);
console.log("kit ok");
