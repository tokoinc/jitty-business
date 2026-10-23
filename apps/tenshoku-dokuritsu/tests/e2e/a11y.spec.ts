import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// 用語の個別ページと連載は、用語と連載が無いので対象にしない。
const pages = [
  ["ホーム", "/"],
  ["比較記事", "/articles/independence-or-career-change/"],
  ["確認リスト", "/articles/before-leaving-checklist/"],
  ["記事一覧", "/articles/"],
  ["棚", "/category/"],
  ["目的", "/purpose/"],
  ["タグ", "/tags/"],
  ["検索", "/search/"],
  ["用語集", "/glossary/"],
  ["著者", "/authors/editorial-team/"],
  ["保存", "/bookmarks/"],
  ["このサイトについて", "/about/"],
  ["編集方針", "/editorial-policy/"],
  ["免責", "/disclaimer/"],
  ["広告と編集方針", "/disclosure/"],
  ["プライバシー", "/privacy/"],
  ["お問い合わせ", "/contact/"],
  ["スタイルガイド", "/styleguide/"],
  ["404", "/this-page-does-not-exist/"],
] as const;

function formatViolations(
  violations: { id: string; impact?: string | null; help: string; nodes: { target: unknown }[] }[],
): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => (Array.isArray(node.target) ? node.target.map(String).join(" ") : String(node.target)))
        .join("\n");
      return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n${nodes}`;
    })
    .join("\n\n");
}

for (const [name, path] of pages) {
  test(`axe: ${name}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response, path).not.toBeNull();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}
