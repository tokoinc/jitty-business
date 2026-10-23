# jitty-business

構成とコマンドは README.md。

- コードは `apps/site` に1つだけ。サイトごとの名前・記事・data は `sites/<slug>/` に置き、`apps/site` にサイト固有の値を書かない。
- build するサイトは `DD_SITE=<slug>`（`npm run site -- <slug> <script>`）。`SITE` は Astro が使うので使わない。
- 記事の追加・テンプレートの運用ルールは `apps/site/AGENTS.md`。手順書（`apps/site/docs/spec/manual-v3.2.md`）は、設計契約を変えるときだけ読む。
- `apps/tenshoku-dokuritsu` は独自に改修した別のアプリ。共通アプリの変更をそのまま当てない。
- 依存はルートで入れる（npm workspaces）。アプリの中に `package-lock.json` や `node_modules` を作らない。
- QA・識別検査の画像（`docs/identity/*/`、`docs/qa/{samples,a11y,styleguide-*}/`）はコミットしない（作り直せる）。
