# jitty-business

構成とコマンドは README.md。

- コードは `apps/site` に1つだけ。サイトごとの名前・記事・data は `sites/<slug>/` に置き、`apps/site` にサイト固有の値を書かない。
- build するサイトは `DD_SITE=<slug>`（`npm run site -- <slug> <script>`）。`SITE` は Astro が使うので使わない。
- 記事の追加・テンプレートの運用ルールは `apps/site/AGENTS.md`。手順書（`apps/site/docs/spec/manual-v3.2.md`）は、設計契約を変えるときだけ読む。
- `apps/tenshoku-dokuritsu` は独自に改修した別のアプリ。共通アプリの変更をそのまま当てない。
- 依存はルートで入れる（npm workspaces）。アプリの中に `package-lock.json` や `node_modules` を作らない。
- QA・識別検査の画像（`docs/identity/*/`、`docs/qa/{samples,a11y,styleguide-*}/`）はコミットしない（作り直せる）。

## 予算の無駄遣いをしない

- 不要な PR・push・CI の再実行・空コミットをしない。docs だけの変更のために CI を回さない。
- 利用枠を使う操作が要るときは、先に理由と回数を示して確認を取る。
- エージェントを大量に動かす進め方も、必要なときだけにする。
- docs のリンク切れや記事の誤りの検査は毎回は回さない（`.md` と `docs/` だけの push では CI が動かない）。月1回など、ユーザーに頼まれたときにまとめて行う。
