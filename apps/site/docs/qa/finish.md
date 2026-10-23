# 質感のすりガラス

数えた日: 2026-10-08。幅 1280。`backdrop-filter` が `none` でなく、`checkVisibility()` が真で、`[hidden]` の中に無い要素を1面とした。

## 本文の面

real では、Binder の `.bi-sheet` と `.bi-face`、Board の `.bo-panel` と `.bo-face`、Spread の `.sp-face` と `.sp-nextface` の `backdrop-filter` は `none`（下表の faceGlass が 0）。

## real の4画面

| セット | 画面 | すりガラス | 本文の面 | はみ出し | クラス |
|---|---|---:|---:|---|---|
| binder | home | 4 | 0 | なし | bi-rail, bi-face__slip, bi-flag bi-flag--series, bi-flag bi-flag--recent |
| binder | list | 3 | 0 | なし | bi-rail, bi-flag bi-flag--shelf, bi-flag bi-flag--terms |
| binder | search | 4 | 0 | なし | bi-rail, bi-drawer__group, bi-drawer__group, bi-drawer__group |
| binder | article | 4 | 0 | なし | bi-rail, bi-flag bi-flag--toc, bi-flag bi-flag--conditions, bi-flag bi-flag--evidence |
| board | home | 2 | 0 | なし | bo-meter bo-meter--series, bo-meter bo-meter--recent |
| board | list | 2 | 0 | なし | bo-meter bo-meter--shelf, bo-meter bo-meter--terms |
| board | search | 1 | 0 | なし | bo-query__field |
| board | article | 6 | 0 | なし | bo-meter bo-meter--brief, bo-meter bo-meter--conditions, bo-meter bo-meter--evidence, bo-meter bo-meter--toc, bo-meter bo-meter--conditions, bo-meter bo-meter--evidence |
| spread | home | 4 | 0 | なし | sp-stamp-link, sp-stamp-link, sp-stamp-link, sp-spine |
| spread | list | 4 | 0 | なし | sp-stamp-link, sp-stamp-link, sp-stamp-link, sp-spine |
| spread | search | 3 | 0 | なし | sp-q, sp-q, sp-q |
| spread | article | 4 | 0 | なし | sp-stamp-link, sp-stamp-link, sp-stamp-link, sp-spine |

いずれも 6 面以内。flat の build に `--m-` は無く、real の build にはある。

forced-colors、印刷、`prefers-reduced-transparency` は `tests/identity/finish.spec.ts` が、各セットの real で通している。

Spread で索引の問いを不透明にした理由は `docs/adr/0009-glass-budget.md`。
