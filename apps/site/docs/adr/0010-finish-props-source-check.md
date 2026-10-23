# finish-real.css の禁止プロパティは、ソースを別スクリプトで検査する

## 状況

工程18の `scripts/check-finish-props.mjs` は、`finish-real.css` に寸法や配置を変えるプロパティが無いかを見る。工程20の `scripts/check-output.mjs` は、build した `dist` の HTML と CSS を見る。禁止プロパティは、どのファイルに書いたかで決まる。dist では `parts.css` と `finish-real.css` が1つの CSS にまとまる。

## 選択肢

1. `check-output` に入れる。dist の CSS を見て、禁止プロパティが残っていないかを検査する。
2. 別スクリプトのままにし、`npm run lint`（ESLint）から呼ぶ。
3. 別スクリプトのままにし、`npm run build` の先頭で呼ぶ。`check-output` にも `npm run lint` にも入れない。

## 決定

選択肢3。`scripts/check-finish-props.mjs` を残し、`npm run build` の最初に実行する。

## 理由

禁止の対象は `finish-real.css` というソースである。dist の CSS では、同じプロパティが `parts.css` 由来か finish 由来かを分けられない。`npm run lint` は ESLint で、CSS の宣言を読む検査ではない。build はセットと質感を変えるたびに通る門なので、ここに置くと出し忘れない。
