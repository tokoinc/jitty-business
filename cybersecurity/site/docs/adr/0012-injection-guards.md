# 注入対策は、入口の検証・出力の検査・lint の3か所で止める

## 状況

工程20c のあとのレビューで、次が見つかった。

- `content.config.ts` の `z.string().url()` は、`javascript:` や `data:` も URL として通す。情報源・商品・著者の URL は、そのまま `href` に入る。
- `validateSite` は `contact.email` と `contact.formUrl` を検査していなかった。`mailto:` に `?bcc=` を足す値や、`javascript:` のフォーム URL も通っていた。
- `set:html` は7か所ある。どれも、Astro がエスケープした描画結果か、`<` を `<` にした JSON-LD である。ただ、今後足される箇所を止める仕組みが無い。
- CSP は工程21 で入れる（手順書 工程21 の手順6）。そのとき、実行される inline script のハッシュが要る。いまは明暗の初期化の1つだけである。

クライアントの JS（検索・保存・続きから読む）は `textContent` と `createElement` で DOM を組んでいて、問題は無かった。

## 選択肢

1. CSP だけに頼る（工程21 まで何もしない）。
2. コンテンツの入口で止め、build の出力でも止め、コードは lint で止める。

## 決定

選択肢2。

- 入口：外部 URL は `z.httpUrl()`（http(s) とドメイン名だけ）。`validateSite` は、mode を問わず、`site.url` が http(s)、`contact.email` に空白・`?`・`&`・`#` が無いこと、`contact.formUrl` が https であることを見る。
- 出力：`check-output` は、`a[href]` と `form[action]` のスキームが http・https・mailto・相対以外なら止める（空白と制御文字を除いてから読む）。ほかに、`rel="noopener"` の無い `target="_blank"` と、ページに2つ以上ある実行される inline script も止める。
- lint：`.astro` の `set:html` は `astro/no-set-html-directive` で止める。使う箇所には、理由を書いた `eslint-disable-next-line` を1行ずつ付ける。`src` の TypeScript では、`innerHTML` / `outerHTML` への代入、`insertAdjacentHTML`、`createContextualFragment`、`document.write` を `no-restricted-syntax` で止める。
- 回帰テスト：`tests/e2e/security.spec.ts` は、外部 origin への通信が無いこと、URL の検索語が文字として入ること、保存データに HTML や `__proto__` があっても注入されないことを見る。

`astro/no-unsafe-inline-scripts` は使わない。Astro が外部ファイルにまとめる `<script>` も報告し、8か所が誤検知になるため。代わりに、出力の HTML で inline script の数を数える。

## 理由

CSP は、メタ要素で出すと `frame-ancestors` が効かない。ホスティングのヘッダーは、運営者の環境に左右される。テンプレートとして配る以上、CSP を入れる前にも、データとコードの段階で止められる必要がある。build の最後に必ず走る `check-output` で見ておけば、コンテンツ・設定・部品のどこから入っても出力で落ちる。
