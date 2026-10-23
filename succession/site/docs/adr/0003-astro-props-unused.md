# Astro の `Props` を未使用変数の検査から外す

## 状況

工程2の仮部品は、手順書どおり `type Props = XxxProps` だけを宣言して `<slot />` を返す。`npm run lint` は、この `Props` を `@typescript-eslint/no-unused-vars` でエラーにした。Astro は frontmatter にある `Props` という名前の型を、その部品の props の型として読む。スクリプトの中で識別子 `Props` を参照しなくても、型は使われている。後の工程の表示部品も同じ宣言を使う。

## 選択肢

1. 各部品で `Props` を参照するダミーの式を足し、検査を通す。
2. `Props` の宣言をやめる。
3. `.astro` に限って、変数名 `Props` を未使用変数の対象から外す。

## 決定

選択肢3。`eslint.config.js` で `**/*.astro` の `@typescript-eslint/no-unused-vars` に `varsIgnorePattern: "^Props$"` を足す。

## 理由

手順書は `type Props = XxxProps` を部品の契約として書いている。ダミーの参照は、部品がデータを計算しないという規則と関係のないコードになる。宣言を消すと、props の型が手順書の契約から外れる。無視するのは名前が `Props` の変数だけで、ほかの未使用変数はこれまでどおりエラーになる。
