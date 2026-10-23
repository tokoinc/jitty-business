# TypeScript は 6 系に固定する

## 状況

手順1の `npm install -D typescript` は、公開されている最新の `typescript@7.0.2` を入れた。その状態で `astro check` は「TypeScript 7.0 は未対応。TypeScript 6 を入れる」と止まり、`typescript-eslint@8.71.0` も TS 7.0 を拒否した。`npm run lint` は設定の読み込み中に `ERR_INTERNAL_ASSERTION` で落ちた。

## 選択肢

1. TypeScript 7.0 のままにし、`astro check` をやめて実験的な `@astrojs/ts-content-mapper` に切り替える。
2. TypeScript 6 系の最新安定版（`6.0.3`）に固定する。

## 決定

選択肢2。devDependency の `typescript` を `^6.0.3` にする。

## 理由

工程1の完了条件は `npm run check`（中身は `astro check`）と `npm run lint`（`typescript-eslint` を使う）がエラー 0 であること。どちらも、いま入っている版が TypeScript 6 を要求している。TypeScript 7.1 向けの別経路は実験的で、手順書の `astro check` から外れる。6 系の最新安定版に合わせれば、手順書の scripts を変えずに検査が動く。
