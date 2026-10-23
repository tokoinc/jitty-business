import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  ["ホーム", "/"],
  ["記事一覧", "/articles/"],
  ["棚", "/category/"],
  ["目的", "/purpose/"],
  ["タグ", "/tags/"],
  ["連載", "/series/hitori-keiei/"],
  ["記事 働き方", "/articles/sample-work-style-basics/"],
  ["記事 独立", "/articles/sample-independence-steps/"],
  ["記事 社会保険", "/articles/sample-social-insurance/"],
  ["記事 比較", "/articles/sample-invoice-service-compare/"],
  ["記事 ニュース", "/articles/sample-news-e-document/"],
  ["記事 人物", "/articles/sample-interview-pricing/"],
  ["検索", "/search/"],
  ["用語集", "/glossary/"],
  ["用語", "/glossary/kokumin-kenko-hoken/"],
  ["著者", "/authors/editorial-team/"],
  ["保存", "/bookmarks/"],
  ["このサイトについて", "/about/"],
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
