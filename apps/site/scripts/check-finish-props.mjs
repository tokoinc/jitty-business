// finish-real.css のソースを検査する（ADR-0010）。npm run build の先頭で呼ぶ。
// 寸法を変えるプロパティと、許されない transform が無いかを見る。
// 引数が無ければ全セット。Binder だけ、検索条件の 5 度と perspective を要する。
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "src/design-sets/binder/finish-real.css",
      "src/design-sets/board/finish-real.css",
      "src/design-sets/spread/finish-real.css",
      "src/design-sets/tally/finish-real.css",
      "src/design-sets/answer/finish-real.css",
      "src/design-sets/figure/finish-real.css",
      "src/design-sets/inline/finish-real.css",
    ];

const errors = [];
const seen = { decls: 0, tilt: 0, blur: 0, perspective: 0 };

function splitSelectors(selector) {
  const parts = [];
  let start = 0;
  let paren = 0;
  let quote = "";
  for (let i = 0; i < selector.length; i += 1) {
    const c = selector[i];
    if (quote) {
      if (c === "\\") {
        i += 1;
        continue;
      }
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") paren += 1;
    else if (c === ")") paren = Math.max(0, paren - 1);
    else if (c === "," && paren === 0) {
      parts.push(selector.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(selector.slice(start).trim());
  return parts.filter(Boolean);
}

function hasClass(selector, className) {
  const re = new RegExp(`\\.${className}(?![\\w-])`);
  return re.test(selector);
}

function banned(prop) {
  if (prop.startsWith("--")) return false;
  if (
    [
      "width",
      "height",
      "margin",
      "padding",
      "border-width",
      "display",
      "position",
      "inset",
      "gap",
      "font-size",
    ].includes(prop)
  )
    return true;
  if (/^(margin|padding|inset)(-|$)/.test(prop)) return true;
  if (prop === "gap" || prop === "row-gap" || prop === "column-gap") return true;
  if (prop === "font-size") return true;
  if (prop.startsWith("grid")) return true;
  if (prop === "top" || prop === "right" || prop === "bottom" || prop === "left") return true;
  if (/^border-(top|right|bottom|left|block|inline)-width$/.test(prop)) return true;
  if (prop === "border" || /^border-(top|right|bottom|left|block|inline)$/.test(prop)) return true;
  return false;
}

function checkTransform(selector, value) {
  const v = value.replace(/!important/g, "").trim();
  if (v === "none") return;
  if (/:hover\b|:active\b/.test(selector)) return;
  if (hasClass(selector, "bi-drawer__group") && v === "rotateX(5deg)") return;
  errors.push(`transform が許されない: ${selector} { transform: ${value} }`);
}

function checkDecl(selector, prop, value) {
  seen.decls += 1;
  if (prop === "transform" && value.includes("rotateX(5deg)")) seen.tilt += 1;
  if (prop === "backdrop-filter") seen.blur += 1;
  if (prop === "perspective") seen.perspective += 1;
  if (banned(prop)) errors.push(`禁止プロパティ: ${selector} { ${prop}: ${value.trim()} }`);
  if (prop === "transform") checkTransform(selector, value);
  if (prop === "transform-origin" && !hasClass(selector, "bi-drawer__group")) {
    errors.push(`transform-origin が許されない: ${selector}`);
  }
  if (prop === "perspective" && !hasClass(selector, "bi-drawer")) {
    errors.push(`perspective が許されない: ${selector}`);
  }
}

function declarations(body) {
  const decls = [];
  let start = 0;
  let paren = 0;
  let quote = "";
  for (let i = 0; i <= body.length; i += 1) {
    const c = body[i];
    if (quote) {
      if (c === "\\") {
        i += 1;
        continue;
      }
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") paren += 1;
    else if (c === ")") paren = Math.max(0, paren - 1);
    else if ((c === ";" || c === undefined) && paren === 0) {
      const piece = body.slice(start, i).trim();
      start = i + 1;
      if (!piece || piece.startsWith("@") || piece.includes("{")) continue;
      const colon = piece.indexOf(":");
      if (colon === -1) continue;
      decls.push([piece.slice(0, colon).trim(), piece.slice(colon + 1)]);
    }
  }
  return decls;
}

function walk(text, from, to) {
  let i = from;
  while (i < to) {
    while (i < to && /\s/.test(text[i])) i += 1;
    if (i >= to) return;
    const preludeStart = i;
    let paren = 0;
    let quote = "";
    while (i < to) {
      const c = text[i];
      if (quote) {
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === quote) quote = "";
        i += 1;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        i += 1;
        continue;
      }
      if (c === "(") paren += 1;
      else if (c === ")") paren = Math.max(0, paren - 1);
      else if (paren === 0 && (c === "{" || c === "}")) break;
      i += 1;
    }
    if (i >= to || text[i] === "}") return;
    const prelude = text.slice(preludeStart, i).trim();
    i += 1;
    const bodyStart = i;
    let depth = 1;
    paren = 0;
    quote = "";
    while (i < to && depth > 0) {
      const c = text[i];
      if (quote) {
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === quote) quote = "";
        i += 1;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        i += 1;
        continue;
      }
      if (c === "(") paren += 1;
      else if (c === ")") paren = Math.max(0, paren - 1);
      else if (paren === 0 && c === "{") depth += 1;
      else if (paren === 0 && c === "}") depth -= 1;
      if (depth > 0) i += 1;
    }
    const body = text.slice(bodyStart, i);
    i += 1;
    if (prelude.startsWith("@")) walk(body, 0, body.length);
    else {
      for (const selector of splitSelectors(prelude)) {
        for (const [prop, value] of declarations(body)) checkDecl(selector, prop, value);
      }
    }
  }
}

let failed = false;
for (const file of files) {
  errors.length = 0;
  seen.decls = 0;
  seen.tilt = 0;
  seen.blur = 0;
  seen.perspective = 0;
  const css = readFileSync(file, "utf8");
  const gzip = gzipSync(Buffer.from(css));
  console.log(`${file}: gzip ${gzip.length} bytes（目安 8192）`);
  if (gzip.length > 8192) errors.push(`gzip が 8KB を超えた: ${gzip.length}`);
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  walk(stripped, 0, stripped.length);
  const binder = file.includes("/binder/") || file.includes("\\binder\\");
  console.log(
    `  宣言 ${seen.decls}、tilt ${seen.tilt}、backdrop-filter ${seen.blur}、perspective ${seen.perspective}`,
  );
  if (seen.blur < 1) errors.push("backdrop-filter を読み取れていない");
  if (binder) {
    if (seen.tilt < 1 || seen.perspective < 1) errors.push("Binder の傾きを読み取れていない");
  } else if (seen.tilt !== 0 || seen.perspective !== 0) {
    errors.push("Binder 以外のセットに傾きがある");
  }
  if (errors.length) {
    failed = true;
    for (const error of errors) console.error(`  ${error}`);
  } else {
    console.log("  禁止プロパティは無い");
  }
}
if (failed) process.exit(1);
