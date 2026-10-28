# Changelog

テンプレート本体の変更だけを書く。手順書の版（v3.2）とは別である。

## 未リリース（2026-10-28）

- セットを4つ足した。Tally（マス目）、Answer（問いと答えの札）、Figure（大きな数字と太い罫）、Inline（文中の小さな図）。どれも flat と real を持ち、見出し・landmark・リンク・検索の本文は既存のセットと同じ。
- セットと質感を、サイトごとに `sites/<slug>/site.json` の `design` で選べるようにした。`DD_DESIGN_SET`・`DD_FINISH` があればそちらを使う。
- `site.json` の `base` で、サイトを business.jitty.jp の直下（`/`）にも置けるようにした。
- `SectionHeadingProps` に任意の `total`（記事の h2 の総数）を足した。既存のセットは使わない。
- 検索結果の記事面で、棚の印の `--slot` も入れ直すようにした（保存一覧と同じ）。
- 識別検査のテスト（`--project=identity`）を、ページの CSP を外して開くようにした。検査用の style の差し込みが CSP で止まり、a11y の記録と画像のテストが落ちていた。

## 0.1.0 — 2026-10-09

初版。条件と根拠を確かめながら記事を出せる Astro テンプレートとして、README と AGENTS.md だけで導入と運用が始められる形にした。
