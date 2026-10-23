# ESLint 10 と eslint-plugin-jsx-a11y の peer 依存

## 状況

手順1の `npm install -D` が ERESOLVE で止まった。`eslint-plugin-astro@3.2.1` は `eslint@>=10` を要求し、同時に入る `eslint@10.12.0` に対して、最新の `eslint-plugin-jsx-a11y@6.10.2` は peer を `eslint@^3`〜`^9` と宣言している。

## 選択肢

1. `eslint` を 9 系に下げ、それに合う古い `eslint-plugin-astro` を入れる。
2. `eslint-plugin-jsx-a11y` の代わりに、ESLint 10 対応の `eslint-plugin-jsx-a11y-x` を入れる。
3. 手順書のパッケージ名のまま入れ、peer の不一致だけを `legacy-peer-deps` で受け入れる。

## 決定

選択肢3。`package.json` の `overrides` で、`eslint-plugin-jsx-a11y` が参照する `eslint` をプロジェクトの `eslint`（`$eslint`）に差し替える。`legacy-peer-deps` は使わない。

## 理由

手順書と工程1の確認表は `eslint-plugin-jsx-a11y` を採用パッケージとして挙げている。`eslint-plugin-astro` は `jsx-a11y-recommended` の実体を読み込むとき、`eslint-plugin-jsx-a11y` を先に探し、無ければ `eslint-plugin-jsx-a11y-x` に落とす。ESLint を 9 に戻すと、いま入る `eslint-plugin-astro` 3 系の前提（ESLint 10 以上）から外れる。peer の宣言だけが古い。`legacy-peer-deps` は他の peer（`@emnapi/runtime` など）まで入れなくなり、`astro check` が `@astrojs/check` を読めなくなる。overrides ならこの1件だけを外し、残りの peer は通常どおり入る。確認は `npm run lint` がエラー 0 であること。
