// eslint.config.js
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

// HTML を文字列で差し込む API（ADR-0012）。DOM は createElement と textContent で組む。
const htmlSinks = [
  {
    selector: "AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]",
    message: "innerHTML / outerHTML に代入しない。textContent か createElement で組む（ADR-0012）",
  },
  {
    selector: "CallExpression > MemberExpression.callee[property.name=/^(insertAdjacentHTML|createContextualFragment)$/]",
    message: "HTML の文字列を DOM に入れない（ADR-0012）",
  },
  {
    selector: "CallExpression > MemberExpression.callee[object.name='document'][property.name=/^write(ln)?$/]",
    message: "document.write を使わない（ADR-0012）",
  },
];

export default [
  { ignores: ["dist/", "dist-demo/", ".astro/", "src/generated/", "reference/", "test-results/", "playwright-report/"] },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.astro"],
    rules: {
      // Astro は frontmatter の `Props` を props の型として読む。スクリプトから参照しなくても未使用ではない。
      "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^Props$" }],
      // 表の横スクロール器は role="region" に tabindex="0" を付ける（キーボードで届かせる）。
      "astro/jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["region"] }],
      // set:html はエスケープされない。使う所は理由を書いて1行ずつ外す（ADR-0012）。
      "astro/no-set-html-directive": "error",
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.astro", "src/**/*.astro/*.ts", "src/**/*.astro/*.js"],
    rules: { "no-restricted-syntax": ["error", ...htmlSinks] },
  },
];
