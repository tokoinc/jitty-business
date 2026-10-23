# 工程の記録（形式は手順書4.0）

## 工程0 環境・プロジェクト作成・記録の器 — 2026-10-05 完了

- 確認：`node -v` は v24.19.0（22.12以上の偶数版）。`git --version` は 2.55.0.windows.3。手順書を `docs/spec/manual-v3.2.md` にコピーし、SHA256 がコピー元と一致。見本HTML 5点を `reference/` へ、陰性対照 PNG 12点を `docs/identity/negative-control/` へコピー。`npm run dev`（Astro v7.3.5）で http://localhost:4321/ が 200。確認後にサーバーを停止。
- 判断：`.nvmrc` は、いま使っている Node のメジャー版 `24` とした。見本での識別検査は判定者を手配していないため未実施とし、`docs/identity/2026-10-05-mock.md` に手順と結果の表だけを残した。空の `docs/qa/` は git に残すため `.gitkeep` を置いた。Astro の雛形は `AGENTS.md` と `CLAUDE.md` を同一ファイルのハードリンクにしているため、手順6の文面は両方に入っている。
- 残課題：見本での識別検査（2.16 の A・B・C・E・F）。工程20で実装に対して必ず行う。

## 工程1 依存・設定ファイル・スクリプト — 2026-10-05 完了

- 確認：`npm run lint` エラー 0。`npm run check` エラー 0（7 files、warnings 0、hints 0）。`npm ls astro` は `astro@7.3.5`（メジャー 7）。`package-lock.json` あり。`npx playwright install chromium` 済み（`%LOCALAPPDATA%\ms-playwright`）。`src/styles/global.css` あり。
- 採用した版：

  | パッケージ             | 版      |
  | ---------------------- | ------- |
  | astro                  | 7.3.5   |
  | @astrojs/mdx           | 8.0.2   |
  | @astrojs/rss           | 4.0.19  |
  | tailwindcss            | 4.3.3   |
  | @tailwindcss/vite      | 4.3.3   |
  | pagefind               | 1.5.2   |
  | typescript             | 6.0.3   |
  | @astrojs/check         | 0.9.10  |
  | vitest                 | 5.0.3   |
  | @playwright/test       | 1.63.0  |
  | @axe-core/playwright   | 4.13.0  |
  | eslint                 | 10.12.0 |
  | typescript-eslint      | 8.71.0  |
  | eslint-plugin-astro    | 3.2.1   |
  | eslint-plugin-jsx-a11y | 6.10.2  |
  | prettier               | 3.9.9   |
  | prettier-plugin-astro  | 1.1.0   |
  | node-html-parser       | 9.0.4   |
  | cross-env              | 10.1.0  |

- 判断：`npm install typescript` は 7.0.2 を入れたが、`astro check` と `typescript-eslint` が TypeScript 7.0 を拒否するため 6.0.3 に固定した（ADR-0002）。`eslint-plugin-jsx-a11y@6.10.2` の peer が ESLint 9 までなので、`overrides` でプロジェクトの ESLint 10 を参照させた（ADR-0001）。`legacy-peer-deps` は `@emnapi/runtime` まで落ちて `astro check` が止まったため使わない。Vitest 5 の `test` は `vitest/config` のモジュール拡張で Vite の `UserConfig` に付くため、`vitest.config.ts` に `/// <reference types="vitest/config" />` を足した。`astro add mdx` が `@astrojs/markdown-satteri@0.4.2` も dependencies に入れた。`.prettierignore` で `docs/spec/` と `reference/` を format の対象外にした。
- 残課題：なし。`npm run build` は工程7から確認する。

## 工程2 サイト設定・デザイン契約・生成処理 — 2026-10-05 完了

- 確認：`npm run dev` で `designSet=binder finish=flat` と出て、`src/generated/design.css` と `src/generated/ui.ts` が書かれた。確認後にサーバーを停止。`npx cross-env DD_DESIGN_SET=board npm run dev` は終了コード 1 で「セット board に tokens.css がない」。`npx cross-env DD_DESIGN_SET=desk npm run dev` は「design.designSet が不明: desk（binder / board / spread）」を出して停止した。その直後に Node の libuv アサーション（`UV_HANDLE_CLOSING`、終了コード -1073740791）が出る。`npm run check` はエラー 0（26 files、warnings 0、hints 0）。`git check-ignore -v src/generated/ui.ts` は `.gitignore:31:src/generated/`。`npm run lint` はエラー 0。
- 判断：`astro check` が `process`・`node:fs/promises`・`node:url` の型を見つけられなかったため、devDependency に `@types/node@^24.19.1` を足した。仮部品の `type Props` は Astro が props の型として読むので、`.astro` に限って未使用変数の対象から外した（ADR-0003）。Board と Spread の manifest は 3.8 の主な違いを全項目に展開した。label は「Board — 固定盤と差し替えパネル」「Spread — 曲面と見開き」。geometry は主な違いに書かれた項目だけにした。
- 残課題：なし。Board と Spread の部品・CSS は工程16・17で作る。

## 工程3 共通スタイル基盤・BaseLayout・明暗・識別検査モード — 2026-10-05 完了

- 確認：Playwright で次を確認した。`colorScheme` を dark / light に切り替えると、body の背景が `#121418` / `#ECE9E2` になる。JavaScript を切っても同じ。表示設定のラジオで `html` の `data-theme` / `data-font-scale` が即座に変わり、再読み込み後も残る。同じブラウザの2ページで、片方の変更がもう片方へ反映される。`Storage.prototype.setItem` が throw する状態で設定を変えると、`#dd-notice` に「この端末に保存できませんでした。ページを閉じると元に戻ります。」が入り、表示は変わる。`npm run dev:inspect` で `?inspect=L2` を付けると `html[data-inspect="L2"]` になり、`.dd-inspect` で L1・L3・L2 と通常を切り替えられる。flat では L3 は隠れない。`npm run dev` では `.dd-inspect` が出ず、`?inspect=L2` でも `data-inspect` は付かない。`npm run check` はエラー 0（33 files、warnings 0、hints 0）。`npm run lint` はエラー 0。確認後にサーバーを停止。
- 判断：手順書のインラインスクリプトは `catch (e) {}` だが、未使用の `e` が lint を止める。束縛を外した。localStorage が使えないときは、保存済みの設定を適用しない。`print.css` の非表示・影・背景画像の規則は `@media print` の中に置いた。表示設定を開くボタンは工程6の Frame が持つ。この工程の確認では popover を開いてラジオを操作した。
- 残課題：なし。表示設定を開くボタンは工程6。

## 工程4 コンテンツモデルとデータの骨組み — 2026-10-06 完了

- 確認：`npx astro sync` 成功。`npm run check` はエラー 0（34 files、warnings 0、hints 3）。`npm run lint` はエラー 0。件数は記事 6、用語 10、情報源 8、商品 3、棚 3、連載 1、著者 1。誤りの検査は `sample-work-style-basics` に1つずつ入れ、いずれも `InvalidContentEntryDataError` で止まった。戻したあと `git diff` はそのファイルに差分がない。
  1. `publishedAt` の引用符を外す → 項目 `publishedAt`（Expected type `"string"`, received `"object"`）とファイルパス。
  2. `category: money` → 項目 `category`（categories に「money」がない）とファイルパス。
  3. `format: review` → 項目 `format`（guide / tutorial / comparison / news / opinion / interview 以外）とファイルパス。
     エラーの直後に、工程2と同じ libuv の `UV_HANDLE_CLOSING`（終了コード -1073740791）が出る。スキーマのエラー文は、その前に出ている。
- 判断：Astro 7.3.5 は存在しない `reference` をログするだけで終了コード 0 になる。ファイル上の ID を読む `ref()` でスキーマエラーにし、sync を止める（ADR-0004）。`z.string().url()` は手順書のまま残した。hints 3 はこの非推奨で、エラーではない。記事本文は見出しだけ。`sample-social-insurance` の frontmatter は 7.1 の例。
- 残課題：なし。本文は工程19。公開判定は工程5。

## 工程5 公開判定・検査・共通ユーティリティ — 2026-10-06 完了

- 確認：`npm run test` は 4 files・14 tests が成功。`npm run check` はエラー 0（44 files、warnings 0、hints 3）。`npm run lint` はエラー 0。`npx astro build` は成功し、`products/sample-invoice-b` の確認期限（2026-09-30）だけを警告して止まらない。`getCollection("articles")` は `src/utils/content.ts` だけ。誤りの検査は戻したあと `git diff` が空。
  1. `sample-work-style-basics` の nextSteps に自分自身を書く → `npm run build` が「コンテンツの検査に失敗（1 件） / articles/sample-work-style-basics: nextSteps が自分自身を指している」で止まる。
  2. `sample-social-insurance` から review を消す → 「articles/sample-social-insurance: sensitive の記事は lastVerifiedAt・review・reviewDueAt が必要」で止まる。
     どちらの直後にも、工程2・4と同じ libuv の `UV_HANDLE_CLOSING`（終了コード -1073740791）が出る。検査の一覧は、その前に出ている。
- 判断：手順書の `dates.ts`・`url.ts`・`numbers.ts`・`content.ts` の公開判定はそのまま使った。広告関係は、affiliate のリンクには `commercial.affiliate`、sponsored のリンクには `commercial.sponsored` をそれぞれ要求する。`requiresSpecialist` で担当が specialist を持たない記事は、production では誤り、demo では警告して `getSiteData` の articles と byId から外す。期限切れと専門家待ちの警告は、見出しを分けて `console.warn` する。`kanaRow` は先頭の空白・「・」・長音を飛ばし、濁音・半濁音・小書きは清音の行、「ん」「を」は「わ」行にする。価格の `amount: null` は誤りにしない。ホームは仮のまま、frontmatter で `getSiteData()` を呼ぶ。
- 残課題：なし。ホームの仮ページは工程6で置き換える。本文は工程19。

## 工程6a 表示用のユーティリティとBinderの11部品 — 2026-10-06 完了

- 確認：`npm run check` はエラー 0（48 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`src/design-sets/binder/components/` を検索し、`<script>`・`<style>`・CSS の import は無い。画面は見ていない（仮ページは 6b、CSS は 6c）。
- 判断：手順書の `labels.ts`・`questions.ts`・`nav.ts`・`cards.ts` と、Frame・CategoryMark・SectionHeading・ArticleFace・CheckSlip・CheckPanel はそのまま使った。ArticleFace の見出し要素は、手順書の `` `h${headingLevel}` `` と同じ h2 / h3 になるよう、型が 2 か 3 の三項にした。SearchSurface の検索語・送信・目的ラジオは `id="dd-search-form"` の中、問いのリンクと結果の slot はその外。条件群は `details`（初期は開く）で、`legend` と `summary` の両方に群の名前と選択件数を出した。`data-sig="s5"` は main と aside の両方のルートに付けた。FaceGrid の列の形と CheckRow の出し分けはクラス名だけにし、見た目は 6c の CSS に残した。Frame の DOM 順は手順書どおり、スキップリンク、狭い画面の上部バー、棚のタブ列、索引、main、aside、フッター。
- 残課題：仮の4画面と撮影は 6b。`tokens.css` の確認と `parts.css`、見本との比較は 6c。引き出しの summary と legend が同じ文言を二重に持つので、6c でタブとして見える方を一つにする。

## 工程6b 仮の4画面と撮影スクリプト — 2026-10-06 完了

- 確認：`npm run dev:inspect` で `/`、`/category/finance/`、`/search/?q=保険料`、`/articles/sample-social-insurance/` が 200。Frame 直下の landmark は、4ページとも「スキップリンク → nav（棚）→ nav（索引）→ main → aside → footer」。記事の CheckRow（「この記事で確かめる」）は main の中の nav。`/category/finance/` のお金の爪は `aria-current="page"`、ホームの爪には付かない。`sample-social-insurance` は論点帯・h2 が3つ・綴じ線・目次のリンクが見出しの id と一致。`sample-work-style-basics` には論点帯がない。ホームは主記事1・新着4・短報1・連載・最近確認した記事。検索は目的4つ（すべて／知りたい／比べたい／手順を調べたい）、条件群は棚・記事型・確認日、結果の器は空。`npm run check` はエラー 0（52 files、warnings 0、hints 3。hints は工程4と同じ）。`npm run lint` はエラー 0。`node scripts/shoot.mjs --out .tmp/shots --inspect L2 --set binder` は実装8枚・見本4枚を書き出した。見本との配置の一致は見ていない（CSS は 6c）。確認後にサーバーを停止。
- 判断：主記事は `featured` の人物記事。新着はそれとニュースを除いた公開記事。短報は `format: news` で、見出し枠の装飾は「短報」、見出し文は「確認された変更」。記事面の `index` は、主記事・新着・短報・棚の一覧で、それぞれの並びの1から。連載のリンクは公開記事だけにし、`/series/` は工程8まで作らない。読みかけは工程12まで出さない。検索語は静的生成の `Astro.url` にクエリが付かないため、入力へは入れない（工程10）。撮影の画面名は home / list / search / article。`--inspect` があるときはファイル名の末尾に `-L2` 等を付け、L1 と L2 を同じフォルダに残せるようにした。見本は指定の `?screen=` のまま撮る（操作盤と 0.72 倍の zoom が写る。`embed=1` は付けない）。実装の撮影では Astro の開発ツールバーだけ隠す。
- 残課題：`tokens.css` の確認と `parts.css`、4画面の見た目、見本との比較、`docs/identity/s6/` への保存は 6c。見本の撮影に操作盤と縮小が写るので、6c で見比べるときはその差を除いて配置を見る。

## 工程6c BinderのフラットのCSSと見本との比較 — 2026-10-06 完了

- 確認：`tokens.css` は 3.8 の例と一致（足したのは `--g-binder-date` だけ）。`npm run check` はエラー 0（52 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`src/design-sets/binder/components/` に `<script>`・`<style>`・CSS の import は無い。`docs/identity/s6/` に L1・L2 各 12 枚（実装 4 画面×2 幅、見本 4 枚）。Playwright で、幅 320・375・840・1200・1440 の 4 ページは `scrollWidth <= clientWidth`。1280px のホームは Tab がスキップリンク → 索引 → 本文 → 確かめる。375px で「索引」が popover を開き、Esc で閉じる。`/category/finance/` のお金の爪は `aria-current="page"`、台紙側の辺がなく、右余白が -27px、`::after` は出ない。確認後にサーバーを停止。
- 判断：見本の CSS 変数は `--c-*` / `--g-*` に置き換えた。手順4が直書きしている余白はそのまま。日付の表示は `2026.10.03` なので、見本の 72px では足りず `--g-binder-date: 5.75rem` にした。`@container` は `html` の `dd-page` を見る。Frame 自身は自分のコンテナに一致せず、余白の分だけ 1199px がずれるため。`.bi-bar` などの `display: none` はコンテナクエリより前に置いた。手順4の並びのままだと、中間幅の `bi-checkrow` が後から隠れる。引き出しは `legend` をタブにし、`summary` は同じ位置の透明な開閉にした（文言が二つ見えない）。ホームと検索の台紙には上タブ（ホームは `--slot:1`、検索は `--slot:2`）を足した。人物の記事面は、題名票が写真に重なるよう、記事型の行を題の下に移した。角丸と影は付けていない。
- 見本との違い（配置の最終判断は人。操作盤と 0.72 倍、実装の右下の識別検査の切替は除く）：
  - ホームに「今週の問い」の列がない（工程9）。読みかけの付箋がない（工程12）。短報は 1 件。
  - 記事にリード・日付・本文・条件票・根拠票・次の台紙がない（工程7・13）。確かめる領域は目次だけ。本文にリンクがないため、記事ページの Tab は索引の次に目次へ進む（スキップリンクで本文へは移れる）。
  - 検索の結果・件数・選択中の条件がない（工程10）。検索語は欄に入らない（静的生成）。目的タブは 4 つで、開いているのは「すべて」。見本は 3 つで「比べたい」。
  - お金の棚の記事は 1 件。フッターの運営リンクは見本のシルエットにない。人物面に「人物」と話者名が出る。
- 残課題：L2 の配置が同じかの最終判断。上に挙げた差は、後の工程の中身か、見本に写る操作盤。形のずれとして直すべきものがあれば、その指示で直す。

## 工程7a 記事ページの骨組みと、条件・根拠・用語のブロック — 2026-10-06 完了

- 確認：`npm run build` が通る。`npm run check` はエラー 0（67 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`npm test` は 4 files・14 tests が成功。`/articles/sample-social-insurance/` は、棚の印、パンくず（ホーム > お金 > 記事）、サンプル表示、記事型と最終確認日、h1、リード、著者・公開日・更新日、論点帯、本文、見出し枠（01〜03）、条件票、根拠票、質問、要点、綴じ線、根拠・出典、著者と確認担当、タグ、の順。確かめる領域の目次から各節へ移る。1280px では本文冒頭の目次は隠れ、375px では確かめる領域が隠れて「目次」から本文冒頭の目次へ移る。JavaScript を切っても、目次・条件・根拠・用語のリンクと質問の開閉が使える。用語のリンク先 `/glossary/…` とタグの `/tags/…` は工程8までページがない。誤りの検査は戻したあと、注入した ID と期限は本文に残っていない。
  1. `<Conditions>` の source を `not-a-source` にする → 「source "not-a-source" を frontmatter の sources に宣言する」で build が止まる。
  2. `<Term id="not-a-term">` を書く → 「frontmatter の terms に宣言する」で build が止まる。
  3. `reviewDueAt` を `2026-10-05`（最終確認日のあと、今日より前）にする → `.dd-stale` と「この記事の条件は再確認中です」が出る。`2026-01-01` は最終確認日より前なので、検査が先に止まって表示まで届かない。
     1 と 2 の直後に、工程2・4・5と同じ libuv の `UV_HANDLE_CLOSING`（終了コード 3221226505）が出る。エラー文はその前に出ている。
- 判断：サンプル本文に `<Summary>` と `<Faq>` があるため、この2つは表の要件どおりに作り、`mdx-components.ts` に登録した。見た目の本格化と、Callout・Steps・ProductBox・CompareTable・ProsCons・LinkCard は 7b。`DecisionBrief` は本文に書くと build を止める。根拠の票は `data-check` の順で集め、確かめる領域の根拠パネルに項目として出す（件数と最終確認日は frontmatter の sources のまま）。パンくずは工程8の部品を先に置いた。ニュースの発生日時・確認時点と、履歴の同じ日の2件は時刻まで出す。表の横スクロール器は `role="region"` に `tabindex="0"` が要るので、その role だけ lint の tabindex 規則から外した。`NextSteps` は空。用語の補足面は工程11。
- 残課題：残りの6ブロック、`prose.css` と `blocks.css`、サンプル残り5記事への配置は 7b。次に確かめるは工程13。用語集・タグのページは工程8。

## 工程7b 残りのブロック・本文の組版・サンプル記事への配置 — 2026-10-06 完了

- 確認：`npm run build` が通る。`npm run check` はエラー 0（73 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。12ブロックはすべて `mdx-components.ts` に登録され、サンプルのどこかで使われている。幅 320・375・840・1200・1280・1440 の6記事は `scrollWidth <= clientWidth`。375px では比較表が器の中だけで横にスクロールし（959 > 313）、よい点と注意する点は縦に並ぶ。文字サイズ 200%（html の font-size）でもページの横スクロールは出ない。条件票の金額と項目名は同じ 14px で、本文 17px より大きくない。JavaScript を切っても、目次・出典・用語のリンクと質問の開閉が使える。人物記事に `img` はない。誤りの検査は戻したあと、注入した ID と期限は本文に残っていない。
  1. `<Conditions>` の source を `not-a-source` にする → build が止まる。
  2. `<Term id="not-a-term">` を書く → build が止まる。
  3. `reviewDueAt` を `2026-10-05` にする → `.dd-stale` と「再確認中」が出る。
  4. `<ProductBox id="not-a-product">` → 「products に宣言する」で build が止まる。
  5. `<LinkCard to="not-an-article">` → 「公開中の記事を指定する」で build が止まる。
     1・2・4・5 の直後に、工程2・4・5・7a と同じ libuv の `UV_HANDLE_CLOSING`（終了コード 3221226505）が出る。エラー文はその前に出ている。
- ブロックと記事：

  | ブロック      | 記事                                                                                                               |
  | ------------- | ------------------------------------------------------------------------------------------------------------------ |
  | DecisionBrief | `sample-social-insurance`（frontmatter の brief）                                                                  |
  | Summary       | `sample-social-insurance`、`sample-independence-steps`、`sample-interview-pricing`                                 |
  | Callout       | `sample-work-style-basics`（注記）、`sample-independence-steps`（注意）、`sample-interview-pricing`（補足）        |
  | Evidence      | `sample-social-insurance`、`sample-independence-steps`、`sample-invoice-service-compare`、`sample-news-e-document` |
  | Conditions    | `sample-social-insurance`（rows）、`sample-invoice-service-compare`（product B）                                   |
  | Steps         | `sample-independence-steps`（5手順）                                                                               |
  | Faq           | `sample-social-insurance`、`sample-work-style-basics`                                                              |
  | ProductBox    | `sample-invoice-service-compare`（A・B・C）                                                                        |
  | CompareTable  | `sample-work-style-basics`（雇用／業務委託）、`sample-invoice-service-compare`（3列×8行）                          |
  | ProsCons      | `sample-work-style-basics`、`sample-invoice-service-compare`                                                       |
  | Term          | 上の5記事（人物記事以外）                                                                                          |
  | LinkCard      | `sample-news-e-document`、`sample-interview-pricing`（どちらも比較記事へ）                                         |

- サンプルで見えた状態：初期費用 0円、税込／税別、月額／年額、カード決済手数料 3.25〜3.6%、サービスBの金額は「再確認中」（11,880円は出ない）。追加ユーザーは料金表の時点で未確認、と本文と比較表に書き、0円とは分けた。期限切れの票では、手順書どおり金額も未確認の欄も「再確認中」になる。比較記事の冒頭に `.dd-ad`。商品Cのリンクは `rel="sponsored noopener"`、`data-ad="affiliate"`、「広告」の文字、別タブ。
- 判断：ProductBox の料金と条件は、`<Conditions product>` を中に置いて同じ確認票にした。外側は「サービス」の文字ラベルと枠だけで、タブは付けない。広告リンクの `data-ad` の値は relation（affiliate / sponsored）。手順番号は、記事面の実務の目盛りと同じ罫の矩形にした（中の数字が読める高さ）。比較表の根拠の種類は「実測」「提供者の公表」「編集の判断」「仮定の試算」と書き、試算には将来を保証しない一文を添えた。項目列は横スクロール中も固定する。本文の最大幅・行高・段落間隔・表の数字は `prose.css` と `blocks.css`。字の大きさと形は Binder の `parts.css`。
- 残課題：次に確かめるは工程13。用語集・タグのページは工程8。本文の完成は工程19。

## 工程8a 一覧の部品と、記事一覧・棚・目的・タグ・連載 — 2026-10-06 完了

- 確認：`npm run build` が通る。`npm run check` はエラー 0（89 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`npm test` は 5 files・18 tests が成功。`dist/` にある一覧は、`/articles/`、`/category/`、棚3つ（work・business・finance）、`/purpose/` と目的5つ、`/tags/` とタグ6つ、`/series/hitori-keiei/`。公開記事は6件で12件に満たないため、`/articles/page/2/` と棚の `page/{n}/` は生成しない。1280px では記事一覧とお金の棚が、索引・台紙・付箋の3列。お金の爪と狭い画面の棚タブは `aria-current="page"`。記事一覧ではどの爪も開かない。`/purpose/learn/` の「知りたい」は `aria-current="page"`。`/purpose/choose/` は「まだ記事がありません」と、記事のある棚3つと検索で、記事面の枠はない。375px では上部に検索と索引、棚タブでお金が開いて台紙につながる。付箋の列は隠れる。記事一覧とお金の棚は `scrollWidth <= clientWidth`。連載は公開中の第3回だけ。お金の爪から棚へ、連載の記事面から記事へ移動できる。記事の日付行から連載へ戻れる。
- 判断：棚のページは、公開記事のある棚だけ生成する（3.4）。記事が0件の目的・タグはページを作り、空の記事面は出さない。ページ送りは `site.articlesPerPage`（12）。1ページのときは出さない。五十音は平仮名の符号順。`localeCompare("ja")` は濁音を無視して「ぜい」を「せいきゅうしょ」より前に出す。連載ページへのリンクは、ホームの連載名と、その回の記事の日付行に付けた。用語集・著者・運営情報は 8b。`slots.has("check")` は中身が無くても true になるので、確かめる領域は描画結果が空なら出さない。
- 残課題：用語・著者・保存一覧・運営情報・404 は 8b。`DD_BASE=/sub/` の確認は工程8全体の完了条件で、8b で行う。本文の完成は工程19。

## 工程8b 用語・著者・保存一覧・運営情報・404 — 2026-10-06 完了

- 確認：`npm run build` が通る。`npm run check` はエラー 0（100 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`npm test` は 5 files・18 tests が成功。1280px では用語集・用語・著者・保存・運営4ページ・404 が、索引・台紙・付箋の3列で、横スクロールはない。用語集と用語ページの「用語集」、保存ページの「保存した記事」は `aria-current="page"`。棚の爪は開かない。運営ページは、確かめる領域の該当項目が `aria-current="location"`。375px では上部に検索と索引、付箋と索引レールは隠れ、台紙は残る。同じ10ページに横スクロールはない。用語集の「さ行」で `#kana-さ` へ移る。用語集から確定申告を開き、記事の著者リンクから編集部を開いた。404 の検索欄は `/search/?q=確定申告` を開く。存在しない URL は 404。`npx cross-env DD_BASE=/sub/ npm run build` のあと、`node-html-parser` で 45 ページの `a[href]` と `form[action]` を検査した。内部リンクは `/sub/` で始まり、切れていない。届かないのはフッターの `/sub/rss.xml` だけ（工程14）。確かめたあと、通常の `npm run build` に戻した。
- 判断：用語の `data-pagefind-body` は、よみ・短い定義・本文だけを包む。関連用語・使われている記事・出典は外。属性が1つでもあると、Pagefind は付いていないページを索引から外す。いまの索引は用語10件だけ。記事へ付けるのは工程10。保存一覧は `#dd-bookmarks` の器だけ。noindex。中身は工程12が描く。連絡先が空のときは「連絡先は運営者が設定します」。運営4ページには「運営者が実態に合わせて書き換える」と書いた。行への目次はページ内の `#kana-` のままにする。`href()` に通すとホームの URL になる。使われている記事は、記事の `terms` と用語の `article` の公開分。所得控除は公開記事から参照されていないので、その旨を書いた。
- `dist/` と 3.4：

  | URL                                                 | dist                                             |
  | --------------------------------------------------- | ------------------------------------------------ |
  | `/`                                                 | あり                                             |
  | `/articles/`、記事6件                               | あり。2ページ目はない（公開6件で12件に満たない） |
  | `/category/`、棚3つ（work・business・finance）      | あり。棚の `page/{n}/` はない                    |
  | `/purpose/`、目的5つ                                | あり                                             |
  | `/tags/`、タグ6つ                                   | あり                                             |
  | `/series/hitori-keiei/`                             | あり                                             |
  | `/glossary/`、用語10件                              | あり                                             |
  | `/authors/editorial-team/`                          | あり                                             |
  | `/search/`                                          | あり                                             |
  | `/bookmarks/`                                       | あり                                             |
  | `/about/`・`/disclosure/`・`/privacy/`・`/contact/` | あり                                             |
  | `404.html`                                          | あり                                             |
  | `/styleguide/`                                      | なし（工程15）                                   |
  | `/rss.xml`・`/sitemap.xml`・`/robots.txt`           | なし（工程14）                                   |

- 残課題：スタイルガイドは工程15。RSS・sitemap・robots は工程14。保存一覧の中身は工程12。記事の `data-pagefind-body` は工程10。本文の完成は工程19。

## 工程8b 追補 レビュー指摘の修正 — 2026-10-08 完了

- 確認：`npm run build` が通る（`astro check` はエラー 0、99 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`npm test` は 5 files・18 tests が成功。`node-html-parser` の一時スクリプトで `dist/` の45ページを検査した。h1 はホームと検索を除いて各1つ（ホームは工程9、検索は工程10）。id の重複とページ内リンクの切れはない。`aria-current="location"` は `#…` へのリンクにだけ付く。`kind="selected"` の付箋は検索の外にない。`kind="shelf"` の付箋は棚の外にない。404・運営4ページ・保存一覧には aside がない。用語ページの付箋の目次に `#used-articles` があり、`data-pagefind-body` の中に h1（`data-pagefind-meta="title"`）がある。sample の用語・著者は noindex。内部リンクの切れはフッターの `/rss.xml` だけ（工程14）。Pagefind の索引は用語10件。Playwright（`npm run preview`）で全45ページを1280px・375pxで開いた。横スクロールはなく、landmark はスキップリンク → 索引 → main →（aside）→ footer の順。404 は 404 を返す。1280px で `/purpose/learn/`・`/purpose/compare/`・`/purpose/do/`・`/glossary/`・用語ページ・`/bookmarks/` の現在の項目は、面・輪郭・太字・高さ44pxで、台紙の左辺まで渡る（右端 294px、台紙の左端 292px）。375px で索引を開くと、用語集・知りたい・お金の現在の項目は閉じた枠になり、索引の中で横にあふれない。変えたページは撮影して目で確かめた。`npx cross-env DD_BASE=/sub/ npm run build` のあと、45ページの `a[href]`・`form[action]` は `/sub/` で始まり、切れていない（`/sub/rss.xml` を除く）。確かめたあと、通常の `npm run build` に戻した。確認後にサーバーを停止。
- 判断：手順書 v3.2 とプロンプト集に照らしたレビューで、次の点を直した。
  - 付箋（`CheckPanel`）は、確かめる情報があるページだけに出す（ADR-0005）。404 の「ほかの入口」は読む領域のリストに移した（`/articles/` への入口はここだけ）。運営4ページの相互リンク（`OperatingNav`）は削除した（運営情報への入口はフッター）。保存一覧の説明、用語ページの「この用語」、用語集0件・著者の代わりの付箋も消した。2.6 の部品表・0.2-7・1.3・3.7（`location` は目次の節）による。
  - 用語ページの確かめる領域は、2.3 のとおり「使われている記事、関連用語」にした。本文側の3節（関連する用語・使われている記事・出典）への目次（`kind="toc"`、件数付き）と、関連する用語（`kind="terms"`）。
  - 索引の目的・用語集・保存の現在地は、`aria-current` だけで見た目が変わっていなかった（8a から）。爪と同じく、開いて台紙とつながる形にした（2.4 S8、3.7「CSSはその属性で形を変える」）。狭い画面の索引は popover の中で、つなぐ台紙がない。そのため現在地は閉じた枠にした。棚の爪（工程6c）も、狭い画面の索引の中では列間を渡って 11px あふれていたので、同じ規則に入れた。
  - 8b の判断「用語の `data-pagefind-body` は、よみ・短い定義・本文だけを包む」を改めた。h1 も中に入れ、`data-pagefind-meta="title"` を付けた（工程10 の手順1、要件の「本文・タイトル」、例の h1）。そのため `ListLayout` の `heading` を省略できるようにした（省略したときは、ページが h1 を出す）。サンプルの表示は、記事と同じく h1 の前に置く。
  - sample の用語・著者のページを noindex にした（3.5「sample: true はサンプル表示・noindex・検索結果上の識別に使う」。記事と同じ）。
  - 7a〜8b は工程ごとのコミットが漏れていた。この環境に git の作成者情報がなかった。リポジトリに工程0〜6cと同じ作成者を設定し、7a〜8b をまとめて `7d0a3b4` にコミットした。複数の工程の変更が同じファイルに混ざっており、工程ごとには分けられないため。
- 残課題：
  - 工程16b・17b（Board・Spread）：8a・8b で足した共通クラス（`dd-index`・`dd-empty`・`dd-row`・`dd-kana-toc`・`dd-facts`・`dd-search`・`dd-episode`・`dd-shelf-notes`・`dd-foot`・`dd-toc`）は、3.7 の一覧になく、Binder の `parts.css` にしかない。各セットの `parts.css` にも見た目を書く。Frame は、check スロットが空なら aside を出さない（8a）。索引の目的・用語集・保存の現在地にも、そのセットの S8 の形を当てる。
  - 工程9・10：ホームと検索に h1 がない（工程20 の check-output は h1 が1つかを検査する。手順書 3881 行）。それぞれ1つ置く。検索の noindex（3.4）は工程10 で付ける。`/articles/` への入口はいま 404 にしかないので、工程9 のホームで検討する。
  - 工程12：保存一覧で JavaScript がないときの文言。
  - 任意：著者ページは「著者・確認担当」（3.4）。確認担当だけの人の記事（`review.by`）と担当する棚は、確認担当が増えたときに足す。

## 工程9 ホーム — 2026-10-08 完了

- 確認：`npm run build` が通る（`astro check` はエラー 0、99 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。公開6件のホームは、主記事（人物・featured）、今週の問い（解説・実務の2件）、新着4件（比較・解説・実務・解説）、短報1件、棚（仕事 2／ビジネス 3／お金 1）、連載、最近確認した記事3件。h1 は「ホーム」が1つ。読みかけの付箋は `hidden`。1280px・375px で `scrollWidth === clientWidth`。記事を1本にする確認では、残る人物記事の `nextSteps` と比較記事への `LinkCard` も一時的に外した（draft だけでは、非公開を指す検査で build が止まる）。そのホームは、主記事、ビジネス 1件の棚、連載だけが出て、新着・短報・問いの空枠はない。読みかけは `hidden`。戻したあと `git diff -- src/content/articles/` は空。`node scripts/shoot.mjs --out docs/identity/s9 --inspect L2 --set binder` で実装と見本を撮った。確認後にサーバーを停止。
- 判断：
  - 今週の問いの関連は、`QUESTIONS` 先頭の `query`（いまは「独立」）が、題・説明・タグの `label` に含まれる公開記事。新しい順に2件まで。主記事は含めない（同じ記事を大きな記事面と問いの列に重ねない）。0件なら区画ごと出さない。新着からは外さない。新着は新しさ、問いは編集の入口で、見本の新着にもこの2件が並ぶ。
  - 問いの列の記事は、記事面のカードにしない。見本の右列は説明の文で、カードを置くと主記事との2列が揃わない。記事型は文字（解説・実務）で出し、題から記事へ移る。記事型ごとの記事面は新着の `FaceGrid layout="latest"`。
  - h1 は「ホーム」を視覚的に隠す。見本の上タブがホームで、ページ見出しの行はない。工程20は h1 が1つかを見る。問いの見出しは見本どおり h2（24px）。
  - 読みかけは `CheckPanel` に `hidden` を足して出す。中身は工程12。見える付箋が無いとき、aside を隠し、台紙を2列にする（空の列を残さない）。
  - 連載の付箋は、連載名と公開中の最新回（第3回／全6回）。回の一覧は連載ページ。最近確認した記事は `lastVerifiedAt` の新しい順に3件。同じ日は、公開が新しい記事を先にする（安定ソート）。
  - 棚は公開記事がある棚だけ。0件の棚はページが無い。`/articles/` へのリンクはホームに置かない。見本の末尾は棚の1行で、記事一覧は 404 と各棚から辿れる。
- 見本との違い（配置の最終判断は人。操作盤と 0.72 倍、実装の右下の識別検査の切替は除く）：
  - 1280px の並びは、主記事と問いの2列、新着の2列、短報の日付の爪、綴じ線、棚の1行、付箋の列。読みかけの付箋は無い（工程12）。短報は1件（見本は2件）。問いの右列は説明文ではなく記事2件の題。棚の件数は実数（見本は 18／12／21）。
  - 375px は、上の検索と索引、棚タブ、主記事、問い、新着、短報、棚の順。見本の375ホームは問いの列を HTML から省いている。実装は狭い画面でも出す（2.4 P5）。新着は4件（見本は3件）。
  - フッターの運営リンクは見本のシルエットにない（工程6cから）。
- 残課題：L2 の配置が同じかの最終判断。検索の h1 と noindex は工程10。読みかけの中身は工程12。

## 工程10 検索 — 2026-10-08 完了

- 確認：`npm test` は 6 files・19 tests が成功（`checkedBucket` を含む）。`npm run build` が通る（`astro check` はエラー 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は `ja` で16ページ（公開記事6、公開用語10）、フィルター4。`npm run preview` で7語・条件・キーボード・1280px・375pxを見た。開発サーバーは「検索を読み込めませんでした。棚・目的・用語集から探せます。」。`DD_BASE=/sub/` では `/sub/search/?q=独立` の結果 URL が `/sub/articles/` で始まる。確かめたあと通常の build に戻した。記録は `docs/qa/search.md`。確認後にサーバーを停止。
- 判断：
  - 記事の索引は、見出しとリード、論点帯、本文の3つの `data-pagefind-body`。Pagefind は同じページの領域を1件にまとめる。パンくず、広告、サンプル表示、著者と日付、目次、次に確かめる、記事末、確かめる領域は外。
  - 絞り込みの値は、棚名、`FORMAT_LABELS`、`INTENT_LABELS[intent].short`、確認日の区分名。meta の `format` は型紙 id（`guide` など）のまま。確認日は排他で、`daysSince <= 30` が「30日以内」、`<= 90` が「90日以内」、それより前が「それ以前」。`lastVerifiedAt` が無い記事には付けない。いまのサンプルで確認日がある記事は、すべて「30日以内」。
  - 比較の `cols` は罫の本数（`compare.items + 1`）。検索結果では、その数を `--cols` にも入れる（手順書の `search.ts` は `<i>` の数だけを置き換える）。
  - 用語は 8b の本文に加え、表示用の meta だけ「用語」にする（棚タブと記事型）。棚・記事型・目的・確認日のフィルターは付けない。フィルターを選ぶと用語は外れる。
  - 静的生成では検索欄の初期値が空なので、開いたときに URL の `q` と条件をフォームへ戻してから検索する。戻さないと、レールの検索欄から来た `/search/?q=` が消え、再読み込みも再現しない。
  - 入力のたびに Pagefind を初期化すると、後の検索が「検索しています…」のまま止まる。読み込みは1回にする。Pagefind 1.5 は `bundlePath` を知らない（警告が出る）。索引は `pagefind.js` の場所から読む。`baseUrl` は結果の URL に使う。
  - 群の件数は JS が見出しへ入れる。0のときは出さない。初期 HTML には件数を書かない。「すべて解除」は検索語を残し、棚・記事型・確認日・目的だけ外す。
  - 検索の確かめる領域は引き出しで、付箋（`.bi-flag`）が無い。8a の「付箋が無い aside は隠す」だと、条件が画面から消える。引き出しがある aside は出す。839px 以下では、結果の下に出す。
  - h1「検索」は視覚的に隠す。検索面の中は `fieldset` / `legend`。ページは noindex。`/` と Cmd / Ctrl+K は足さない。
  - `search.ts` は `export {}` でモジュールにする。スクリプトのままだと、`inspect.ts` の `root` と型検査が衝突する。
- 残課題：Pagefind は日本語を語に切らない。「年会費」「AI活用」は、その語が本文に無くても件数が出る（`docs/qa/search.md`）。語幹処理や表記ゆれの辞書は入れていない。保存一覧が型紙を使うのは工程12。

## 工程11 補足（用語・注） — 2026-10-08 完了

- 確認：`npm run check` はエラー 0（103 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`npm run lint` はエラー 0。`npm run build` が通る。Playwright（preview）で `/articles/sample-work-style-basics/` を見た。Tab で「用語の補足を開く」へ進み、Enter で `term-sample-work-style-basics-koyo-keiyaku` が開き、Esc で閉じると同じボタンにフォーカスが戻る。`HTMLElement.prototype` から `popover` を消すと、ボタンは `hidden`、記事末の「用語の補足」に短い定義が出て、索引と表示設定の `popover` は残る。375×800 では、開いた補足（上 125px・下 381px）がフォーカス（上 389px）と本文の最終行（上 2361px）に重ならない。`glossaryPopovers: false` の build では、HTML と JS に `.dd-term__btn`・`.bi-pop`・`popover.ts` の処理が無く、用語のリンクは残る。セットの CSS には `.bi-pop` の規則が残る（部品のスタイルはフラグで分けない）。戻したあと `git diff -- src/site.config.ts` は空。用語が無い人物記事には、補足の節も `popover.ts` も出ない。確認後にサーバーを停止。
- 判断：
  - 脚注の Popover は足さない。`<Cite>` の末注リンクのまま（手順書は、Fn を採るときだけ脚注のポップオーバーを足す）。
  - 補足から出すのは、短い定義、用語ページ、関連用語。関連が 0 件ならその列は出さない。用語が指す記事へのリンクは出さない。
  - `popover` 属性があるあいだは、節見出し「用語の補足」を出さない。属性を外したあと、見出しと台紙が記事末に並ぶ。
  - Popover API が無いときは、用語の補足だけから `popover` と `role="dialog"` を外し、閉じるボタンを隠す。閉じるボタンは popover を隠すだけなので、一覧に残さない。索引と表示設定は外さない。
  - 広い画面は下寄りの中央、839px 以下は下のパネル。`position-area` が使えるとき（確認した Chromium は使える）は、トリガーの直上に置き、収まらなければ上下を反転する。フォーカストラップは入れない。
  - `popover.ts` は `export {}` でモジュールにする（工程10の `search.ts` と同じ）。
  - 工程9と工程10は、この作業の直前まで未コミットだった。ホームと検索が同じファイルに混ざっていたので、先にまとめてコミットした。
- 残課題：なし。読書機能は工程12。

## 工程12 読書機能と表示設定 — 2026-10-08 完了

- 確認：`npm test` は 7 files・25 tests が成功（`parseBookmarks`・`parseResume`・壊れた JSON の `read` を含む）。`npm run build` が通る（`astro check` はエラー 0、112 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Playwright（preview、1280×700）で `/articles/sample-independence-steps/` を見た。`localStorage` に `"{"` と `{"version":9}` を入れても、あとで読むは未保存、再開ボタンは出ず、見出しは残る。`setItem` が throw すると `#dd-notice` に「この端末に保存できませんでした。ページを閉じると元に戻ります。」が出て、ボタンの押下は切り替わり、ページは壊れない。Enter で保存すると別ページの `/bookmarks/` に題・棚「仕事」・日付 `2026.09.15` が出る。削除すると記事側の `aria-pressed` が外れ、公開終了の ID は「この記事は公開を終了しました」と整理ボタンで外せる。すべて削除で一覧は空になる。第2節まで進むと続きの位置が保存され、ホームの「読みかけ」に同じ題が出る（記事 URL にハッシュは付かない）。開き直しても自動では移動せず、「前回の続き（健康保険と年金の切り替え）から読む」でその節へ移る。広い画面の目次と本文の目次に `aria-current="location"` が付く。本文の終わりまで進むと続きの位置が消え、再開ボタンは出ず、ホームの読みかけも隠れる。確認後にサーバーを停止。
- 判断：
  - 表示設定は工程3のまま。この工程ではあとで読む・続きから読む・保存一覧・目次の現在地だけを足す。
  - 保存キーは `decision-desk:v1:bookmarks` と `:resume`。中身は記事 ID・見出し ID・節内の割合・日時だけ。`parseBookmarks` / `parseResume` は手順書のまま（ブックマークは先頭から200件、続きの位置は180日より古いものを捨てる）。50記事の上限は保存するときに、`at` が古いものから外す。
  - `articles-index.json` は公開記事だけ。`shelf` は `{ label, slot }`（ラベルだけだとタブの段が型紙の1のままになる）。`date` は日本時間の `YYYY-MM-DD`。ニュースは `eventAt`、それ以外は `publishedAt`。
  - 保存一覧は工程10の型紙を複製する。題・棚・リンクを書き、手順の目盛りと比較の罫は空にする。日付の欄が型紙に無い記事型（実務など）は、カードの下に `time` を足す。ニュースは型紙の日付欄を使う。
  - JavaScript が無いときは「保存した記事は、JavaScript が動くブラウザで表示します。」件数の上限と180日は、一覧のリードに書く。README は工程22までスターターのまま。
  - ホームの読みかけは、続きの位置のうち索引にある最新1件。索引に無い ID は飛ばす。保存が無ければ `hidden` のまま。
  - 今の節は、本文の h2 のうち画面上端から25%を通過した最後の見出し。目次の付箋と本文の `.dd-toc` に `aria-current="location"` を付ける。CheckRow は href が節の ID と一致するときだけ付ける（いまのリンクは目次・根拠なので、通常は付かない）。
  - 再開ボタンは、保存された見出しが本文にあるときだけ出す。自動では移動しない。見出しが消えていたら位置を消す。`EndMark` が見えているあいだは位置を消して書き戻さない。スクロールのたびに書かず、止まって1秒後と `pagehide` に書く。
  - `bookmarks` が false のときは保存ボタンと一覧の中身を出さない。`resumeReading` が false のときは再開の枠とホームの読みかけを出さない。
- 残課題：保存・再開の恒久 E2E は工程20。README への保持期限の記載は工程22。

## 工程13 次に確かめる — 2026-10-08 完了

- 確認：`npm test` は 8 files・30 tests が成功（`nextSteps` の手動順・自分自身と非公開・候補0件・連載の次の回・同点の新しい順）。`npm run build` が通る（`astro check` はエラー 0、113 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。preview で綴じ線の直後に「次に確かめる」が出る。1280px では手続き記事の主候補が幅 312px、補助2件が右列（幅 223px）に積まれる。補助が無い働き方の解説は、記事面が枠いっぱい（551px）。375px では3件が縦に積み、ページの横スクロールは無い（`scrollWidth === clientWidth`）。比較記事の主候補（ニュース）に「知るために」と理由が出る。ホームの短報は目的も理由も無く、高さ 46px の1行のまま。ニュース記事の主候補リンクを Enter で開くと、請求書の比較記事へ移る。確認後にサーバーを停止。
- 6記事の候補（描画した題・役割・目的・理由）:

  | 記事 | 役割 | 題 | 目的 | 理由 |
  | --- | --- | --- | --- | --- |
  | 働き方の解説 | 主 | 退職から独立までの手続きの順番 | 実行するために | 退職から独立までの手続きの順番を知りたい方へ（手動） |
  | 電子保存のニュース | 主 | 請求書サービス3つを、月額と機能で比べる | 比べるために | 同じ棚「ビジネス」で、タグ「請求書」が共通 |
  | 電子保存のニュース | 補助 | 「ひとり経営」を10年続けた人に聞く、値上げを伝えた日のこと | 解くために | 同じ棚「ビジネス」の人物記事 |
  | 社会保険 | 主 | 退職から独立までの手続きの順番 | 実行するために | 退職から独立までの手続きの順番を知りたい方へ（手動） |
  | 社会保険 | 補助 | 業務委託と雇用の違いを、働き方の条件から整理する | 知るために | 業務委託と雇用の違いから整理したい方へ（手動） |
  | 請求書比較 | 主 | 電子取引データの保存に関する案内が更新（架空） | 知るために | 電子取引データの保存に関する案内の更新を知りたい方へ（手動） |
  | 請求書比較 | 補助 | 「ひとり経営」を10年続けた人に聞く、値上げを伝えた日のこと | 解くために | 同じ棚「ビジネス」で、タグ「価格」が共通 |
  | 人物 | 主 | 請求書サービス3つを、月額と機能で比べる | 比べるために | 請求書サービスを月額と機能で比べたい方へ（手動） |
  | 人物 | 補助 | 電子取引データの保存に関する案内が更新（架空） | 知るために | 同じ棚「ビジネス」のニュース記事 |
  | 手続き | 主 | 独立したら、社会保険はどう変わる？ 国民健康保険と任意継続を比べる前に | 知るために | 独立後の社会保険で確認する条件を知りたい方へ（手動） |
  | 手続き | 補助 | 請求書サービス3つを、月額と機能で比べる | 比べるために | 請求書サービスを月額と機能で比べたい方へ（手動） |
  | 手続き | 補助 | 業務委託と雇用の違いを、働き方の条件から整理する | 知るために | 同じ棚「仕事」の解説記事 |

- 判断：
  - `nextSteps` の算出は手順書のまま。公開記事だけが母集団で、足りない件数は埋めない。目的のラベルは既存の「知るために」形式。
  - 見出しは h2「次に確かめる」。節番号の仕切りにはしない。補助は `dd-next__side` で右列に積む。補助が無いときは1列。
  - ニュース記事面は、目的と理由があるときだけその2つを出す。ホームの短報はどちらも渡さない。
  - 所見：ニュースから請求書比較が主候補になるのは、同じ棚とタグ「請求書」の一致である。保存の案内と月額の比較は主題がずれる。比較記事は広告関係（affiliate）もある。理由の文言は一致した分類だけを述べているので、件数を埋めるための変更はしない。人物の連載は公開が1本なので、次の回は出ない。手続き以外は、候補が足りず2件または1件で止まっている。妥当かどうかの最終判断は人。
- 残課題：候補の採否は人が決める。SEO・構造化データは工程14。

## 工程14 SEO・構造化データ・RSS・sitemap・robots — 2026-10-08 完了

- 確認：`npm test` は 9 files・41 tests が成功（`isIndexable`、demo の空 sitemap、production で含めるページと除くページ、`lastmod` の更新日優先、`base` `/sub/`、JSON-LD）。`npm run lint` はエラー 0。`npm run build` が通る（`astro check` はエラー 0、120 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。dist の45ページで、`<title>`・description・canonical を照合した。ホームの title はサイト名、ほかは「題｜サイト名」。canonical は `https://example.com` から始まる絶対URL。demo なので全ページが `noindex`。`sitemap.xml` は空の `urlset`。`robots.txt` は `Allow: /` と Sitemap だけで、`Disallow` はない。`application/ld+json` はすべて `JSON.parse` でき、記事の headline・datePublished・dateModified・author は h1・`<time datetime>`・著者リンクと一致する。ニュースは `NewsArticle`。パンくずの名前と最後の URL は表示と canonical と一致する。ホームは `WebSite` と `Organization`。`/rss.xml` は公開記事6件。人物記事を一時的に `draft: true` にして build すると `/rss.xml` に出ない。戻してから通常の build に戻した。ニュース記事は請求書比較の `nextSteps` が指しているので、draft にすると参照検査で build が止まる。production で sample が出ないことは、工程5の `isPublished` のテストのまま。preview でホームの title は「Decision Desk Media」、ニュース記事は「電子取引データの保存に関する案内が更新（架空）｜Decision Desk Media」。フッターの RSS は `/rss.xml` を返す。確認後にサーバーを停止。
- 判断：
  - index 判定は `isIndexable` の1つ。`mode` が production 以外、`noindex`、`sample`、種別 `search` は index しない。Head の robots と sitemap がこれを使う。404 は `noindex`。
  - sitemap の中身は production の偽データで確かめる。通常記事、記事のある棚とタグ、sample でない用語と著者、ホーム、記事一覧とページ送り、目的5つ、`/tags/`、`/glossary/`、連載、運営4ページを含める。sample・noindex・記事0件のタグ・検索・保存は出さない。`lastmod` は `updatedAt`、無ければ `publishedAt`（日本時間の `YYYY-MM-DD`）。記事が無いページは `lastmod` を付けない。
  - 記事に cover が無いので `og:image` は `public/og-default.png`（1200×630）。`scripts/og-default.mjs` が、地色 `#ECE9E2` の HTML（台紙と縦線、サイト名、タグライン）を Playwright で撮影する。`public/favicon.svg` は文字なしの台紙と縦線。Astro のロゴは置き換えた。
  - `theme-color` は Binder の `--c-bg`（light `#ECE9E2`、dark `#121418`）。
  - RSS の `pubDate` は公開日。新しい順に20件まで。Product / Review は付けない。
- 残課題：スタイルガイドの noindex は工程15。`theme-color` は Binder の地色で、他セットは工程16以降。本番 build での sample 除外は工程20の production 検査。

## 工程15 スタイルガイド — 2026-10-08 完了

- 確認：`npm test` は 9 files・41 tests が成功（sitemap の除外に `styleguide` を足した。件数は工程14と同じ）。`npm run lint` はエラー 0。`npm run build` が通る（`astro check` はエラー 0、121 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。`/styleguide/` の h1 は「スタイルガイド」の1つ。robots は `noindex`。`data-pagefind-body` は無い。id の重複は無い。Pagefind は16ページ（記事6・用語10）で、この URL は索引に無い。商品Aは「1,078円／月（税込）」と「0円」。商品Bは金額が「再確認中」。商品Cは「980円／月（税込）」と「3.25〜3.6%」。比較表に月額・年額・税込・税別・0円・未確認・再確認中・金利の範囲がある。表示設定を開くとダークが `html` の `data-theme` に入り、閉じたあとに端末合わせへ戻した。用語の補足と見本の補足面が開いて閉じる。記事面のリンク先（働き方の解説）は表示される。パンくずのホーム、`/articles/`、用語ページ、検索は 200。色見本の `bg` は light `rgb(236, 233, 226)`、dark `rgb(18, 20, 24)`。`ink` と `accent` も Binder の明暗で分かれ、未定義の `panel` は透明。1280px・375px・文字200%（html の font-size）でページの `scrollWidth` は `clientWidth` と同じ。比較表の器は3幅とも中で横に溢れ、コントラスト比の表は200%のときだけ器の中で溢れる。撮影は `docs/qa/styleguide-binder-flat/`。確認後にサーバーを停止。
- 判断：
  - Frame はこのページの枠にする。中に入れ子にしない。
  - `DecisionBrief` は本文に置くと build が止まる。論点帯は記事レイアウトと同じ `CheckSlip kind="brief"`（分かること・対象・範囲。短い要点と長い文）で出す。
  - 検索面の form id はページに1つなので、main は1つ（目的は「すべて」、検索語は空）。aside は棚「ビジネス」と記事型「比較」だけ選択する。選択ありとなしは、同じフォームのラジオとチェックに並ぶ。
  - ブロックの文脈は `sample-invoice-service-compare`。記事・商品・情報源は増やさない。商品Bは確認期限（2026-09-30）を過ぎているので、料金と条件の金額は「再確認中」になる。税別・年額・未確認の文言は、比較表のセルに残る。
  - 写真ありの見本は `src/assets/styleguide/photo.png`。無地に近い PNG をその場で書き、外部からは取らない。論考と人物だけに付ける（Binder で写真枠があるのはこの2型）。
  - 色見本は `color-scheme: light` と `dark` を並べ、背景は `var(--c-*)` だけを読む。16進はページに書かない。
  - sitemap はパスを列挙する方式なので `/styleguide/` は入らない。`noindex` に加え、`body` に `data-pagefind-ignore` を付ける。
  - ページ送りの見本は2/3。サンプルの記事は1ページに収まるので、2ページ目と3ページ目は 404。前へと1ページ目は `/articles/`。
- 残課題：ページ送りの2ページ目・3ページ目は、記事数が増えるまで存在しない。工程16〜18で、セットと質感を変えるたびにこのページを確かめる。`theme-color` は Binder の地色のまま。

## 工程16a Board の tokens.css と11部品 — 2026-10-08 完了

- 確認：`npx cross-env DD_DESIGN_SET=board npm run build` が通る（`astro check` はエラー 0、133 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。配信 CSS に `--c-panel`・`--c-shade`・`--g-off` があり、`--m-` と `.bi-` は無い。続けて通常の `npm run build`（binder）も通る。比較用に置いた `tmp/board-dist` を検査が拾って hints が46件に増えたので、消したあとに `astro check` をやり直した（133 files、エラー 0、hints 3）。`src/generated/ui.ts` は binder を指す。`scripts/compare-structure.mjs` で `/` と `/articles/sample-social-insurance/` を比べ、見出し・landmark・main のリンク先は一致（ホーム 15・12・11、記事 19・22・35）。`src/design-sets/board/components` に `<script>`・`<style>`・CSS の import は無い。`eslint` はこの部品と比較スクリプトでエラー 0。Board の dist をブラウザで開くと、ホームの `main` は `bo-main`（`bo-panel` は無い）。「索引」で固定盤が開き、棚スイッチ・検索・表示設定が出る。ホームの社会保険の記事リンクから `/articles/sample-social-insurance/` へ進み、`main` は `bo-main bo-panel`、h1 は記事の題。配置用の CSS が無いので、座標クリックは見出しの箱に当たる。確認後にサーバーを停止。
- 判断：
  - `--c-shade` は `--c-hair` と同じ `#CDD3DB` / `#2C3646`（ADR-0006）。外側の線は `--c-line`。
  - `--g-off: 0.375rem` は manifest の `geometry.protrude` と同じ値。キー名は変えない。
  - Frame は、静的 HTML の landmark を Binder と揃えるため、header・`nav`「棚」・`nav`「索引」（`popover`）を残す。中身は固定盤（番号は `aria-hidden`）。`page="article"` のときだけ `main` に `bo-panel`。check が空なら aside を出さない。
  - 見出しの文字は Binder と同じ。節番号・目盛り・「ここまで」は見出しの外か `aria-hidden`。論点帯の題だけ行帯で包む。ニュースの題は行帯にしない。`ArticleFace` の `index` は使わない。
  - `parts.css` と `finish-real.css` は空（コメントのみ）。寸法と出し分けは工程16b、質感は工程18。
- 残課題：見た目は工程16b。ホーム・検索・一覧に直書きの `bi-tab`・`bi-home-lead`・`bi-grid`・`bi-shelves` がある。`bookmarks.ts`・`toc.ts`・`popover.ts` は `.bi-` を見ている。`theme-color` は Binder の地色のまま。

## 工程16b Board の parts.css と見本比較 — 2026-10-08 完了

- 確認：`npx cross-env DD_DESIGN_SET=board npm run build` が通る（`astro check` はエラー 0、133 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。配信 CSS に `.bi-` は無い。`theme-color` は light `#E6E9EE`、dark `#0E131B`。続けて通常の `npm run build`（binder）も通る。binder の `theme-color` は `#ECE9E2` / `#121418`。`scripts/compare-structure.mjs` で `/` と `/articles/sample-social-insurance/` を比べ、見出し・landmark・main のリンク先は一致（ホーム 15・12・11、記事 19・22・35）。`eslint` は変えたスクリプトとページでエラー 0。`DD_DESIGN_SET=board npm run dev:inspect` のあと、`node scripts/shoot.mjs --out docs/identity/s16 --inspect L2 --set board` と L1 を実行した。ホーム、棚3つ、記事一覧、検索、記事6本、用語集、用語、保存、運営4ページ、目的、タグ、連載、著者、スタイルガイド、404 を 1280px と 375px で開いた。ページの `scrollWidth` は `clientWidth` と同じ。スタイルガイドは `docs/qa/styleguide-board-flat/`（1280、375、文字200%）。200% でもページは横に溢れない。比較表の器の中は溢れる。確認後にサーバーを停止。
- 判断：
  - ページに直書きしていた `bi-tab`・`bi-home-lead`・`bi-home-q`・`bi-shelves` は `dd-*` にした。検索結果の空格子は、生成された `FaceGrid layout="results"`。Binder の `parts.css` も同じクラスを見る。`bookmarks.ts` の棚の色は `[data-sig="s2"]`。空のリードは `.bi-face__lead, .bo-face__lead`。`toc.ts` は Board の目次と CheckRow も見る。`popover.ts` は `[data-sig="s7"]`。
  - Board の「ホーム」「検索」などのページ名札は視覚的に隠す。現在地は固定盤の押し込まれたスイッチ。一覧の棚の番号札は、記事パネルが無いので見出しの前に置く。
  - ずらした二重輪郭は `.bo-panel` と `.bo-face`。同心の二重輪郭は `.bo-meter`。Popover は `.bo-pop` だけの小パネルで、記事面のクラスは付けない。Callout・Faq・商品・広告にはどちらの輪郭も付けない。
  - 狭い画面の固定盤は上部の帯で、棚スイッチは横並びのまま出す。目的・検索欄・ユーティリティは「索引」で開く（用語集と表示設定へ届くようにするため）。
  - `theme-color` は選んでいるセットの `--c-bg`。Spread の値も同じ表にある。
- 見本との違い（配置の最終判断は人。操作盤と縮小、実装の右下の識別検査の切替は除く）：
  - 1280px のホームは、固定盤、主記事と問いの2列、新着の格子、短報、終端、棚の1行、計器の列。見本は問いの帯の下に、記事型の違うパネルを1つの格子へ混ぜる。実装は DOM の順を変えない。問いの列は記事の題。短報は1件。読みかけの計器は無い（工程12。保存が無いと隠れる）。フッターの運営リンクは見本に無い。
  - 1280px の記事は、固定盤、番号札の付いた記事パネル、行帯の h1、計器（論点帯・条件・根拠）、節番号と行帯、終端、次の2列、右の計器列。見本は次のパネルで終わる。実装はその下に記事末がある。パンくず、保存、サンプルの表示が題の前にある。
  - 1280px の検索は、同心の検索欄、目的のキー、右の操作盤（正方形のキー）。見本の「選択中の条件」の計器は、部品としては無い。選んだ条件はキーの押し込みで示す。開発サーバーでは Pagefind の結果カードが出ない（工程10と同じ。「検索を読み込めませんでした」）。
  - 375px の記事は、上部の帯、横並びの棚スイッチ、番号札、行帯、3つのキー、計器、終端、次の1列。見本の狭い画面は目的・検索欄・ユーティリティを出さない。実装は「索引」で開く。
- 2.9 の差（Binder と Board）：
  - S1：Binder は開く爪と台紙。Board は全高の濃い固定盤と、1.5rem 離したパネルの地。記事の main だけがずらした二重輪郭の一枚になる。
  - S2：Binder は棚の位置のタブ。Board は番号札（番号が大きく、棚名と記事型が小さい）。
  - S4：Binder はタブ付き台紙の変形。Board は寸法で分ける。解説と実務は 2×1（実務は区切った目盛り）、比較は 2×2 とミニ表、ニュースは 1×1 と日付の帯、論考と人物は 1×2（写真か、文字の縦面）。
  - S5：Binder は引き出し。Board は同心の検索欄、目的のキー、正方形のキーを並べた操作盤。
  - S3：Binder はずれる番号タブ。Board は行帯。記事の h2 は左に節番号の札。
  - S6：Binder は横向きタブの票。Board は同心の計器と、見出しの横の目盛り。
  - S7：Binder は上タブの小台紙。Board は `.bo-pop` のずらした小パネル。見出しは行帯。
  - S8：Binder は開いて台紙とつながる。Board は二重線が重なって押し込まれる。棚スイッチ、目次の現在の節、索引の目的・用語集・保存。
  - S9：Binder は綴じ線。Board は上辺 10px の終端と「ここまで」。その下に次のパネル群。
- 残課題：L2 の配置が同じかの最終判断は人。`finish-real.css` は空のまま（工程18）。検索結果のカードを見本と並べるのは、Pagefind のある preview で見る。

## 工程17a Spread の tokens.css と11部品 — 2026-10-08 完了

- 確認：`npx cross-env DD_DESIGN_SET=spread npm run build` が通る（`astro check` はエラー 0、144 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。続けて board、binder の build も通る。`scripts/compare-structure.mjs` で `/` と `/articles/sample-social-insurance/` を Binder と比べ、見出し・landmark・main のリンク先は Board・Spread とも一致（ホーム 15・12・11、記事 19・22・35）。比較用 HTML は作業ディレクトリの外に置き、検査のあと消した。`src/generated/ui.ts` は binder を指す。`src/design-sets/spread/components` に `<script>`・`<style>`・CSS の import は無い。`eslint` は部品・呼び出し・比較スクリプトでエラー 0。`DD_DESIGN_SET=spread` の開発サーバーでホームを開くと、`main` は `sp-faces` で、直下は `.sp-face` だけ（after は無い）。h1 は「ホーム」。社会保険の記事は URL で開いた（配置用の CSS が無く、ホームの記事リンクは重なってクリックが遷移しなかった）。記事の `main` は `.sp-face` と `.sp-nextface` を包み、h1 は記事の題、「次に確かめる」は main の中。確認後にサーバーを停止。
- 判断：
  - `--c-face` は `#EAD9BE` / `#2A231C`、`--c-accent-ink` と `--c-focus` は `#9A3A24` / `#F4A285`。`--f-serif` は手順書 2.12 の明朝。幾何は `--g-line` `1px`、`--g-arc-x` `360px`、`--g-arc-y` `300px`、`--g-spine` `4.75rem`（ADR は不要。名前は手順どおり）。
  - `main` は `sp-faces` として主面と次の見開きを包む。`sp-nextface` に名前は付けない（ADR-0007）。landmark を揃えるため、`header` と `nav`「棚」も残す。check が空なら aside を出さない。
  - 見出しの文字は Binder と同じ。章番号・棚の番号・縦書きの短い語は見出しの外で `aria-hidden`。`sp-vlabel` は、区画の label、確認票の「条件」「根拠」、補足の「用語」、CheckPanel の題が4文字以下のときだけ。章番号と項目の文には付けない。縦書きの指定は 17b の CSS。
  - 大きな番号は解説・実務だけ。`01` 形式で `data-field="index"`。次に確かめるは主の候補から回り道まで 1 から。リンクカードは `1`。検索結果は表示順、保存一覧は新しい順を JS が埋める（ADR-0008）。
  - CheckPanel の本文スロットは出さない。ホームの連載リンクと `[data-reading]`、棚の説明、根拠パネルの「最終確認日」は Spread では出ない。読みかけの再開は動かない。比較した2ページでは、これらは aside の中で見出しではない。
  - SearchSurface の aside は空。条件群は main の中。`/search/` では aside が消え、landmark は Binder と異なる。比較した2ページには検索面が無い。
  - `parts.css` と `finish-real.css` は空（コメントのみ）。
- 残課題：見た目・見本との比較・狭い画面・スタイルガイドの撮影は工程17b。通常の build の `theme-color` は Binder の地色。Spread の build では `#F4EEE4` / `#19150F`。

## 工程18a Binder のモダンリアルと寸法比較 — 2026-10-08 完了

- 確認：`DD_DESIGN_SET=binder DD_FINISH=flat` の build が通る（`astro check` はエラー 0、146 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。dist に `--m-` は無い。`tests/identity/finish.spec.ts` が `docs/identity/geometry-binder.json` を書いた。続けて `DD_FINISH=real` の build も通る（同じ件数・hints）。dist の CSS に `--m-hair` がある。同じテストで、4画面の `[data-sig]` の位置と大きさの差は 1px 以内。`forced-colors: active` と `print` で、索引・付箋・条件群・台紙・記事面の `backdrop-filter` と `box-shadow` は `none`。`prefers-reduced-transparency: reduce` は Playwright の `emulateMedia` に無いので CDP で emulate し、すりガラスが外れることを確かめた（⏳ではない）。`scripts/check-finish-props.mjs` は禁止プロパティなし、gzip 3547 bytes。L1・L2 は `docs/identity/binder-real/`。スタイルガイドは `docs/qa/styleguide-binder-real/`（1280、375、文字200%）。200% でもページは横に溢れない。1280 と 375 で、ホーム・一覧・検索・記事の `scrollWidth` は `clientWidth` と同じ。台紙（`.bi-sheet`）の `backdrop-filter` は `none`。すりガラスはホーム 5（索引、人物の題、付箋3。読みかけは hidden）、一覧 3、検索 4（索引と条件群3）、記事 4。いずれも 6 面以内。狭い画面のぼかしは `blur(12px)`。ライトでホーム・記事・検索を開き、索引はすりガラス、台紙と記事面は白い面、検索ボタンは青のグラデーションに白文字。検索の dev では Pagefind が無く「検索を読み込めませんでした」と出る（preview の寸法テストは Pagefind あり）。確認後にサーバーを停止。
- 判断：
  - `--m-e1` から `--m-e3` は、影のリスト全体を `light-dark()` に入れられないので、各層の色を `light-dark()` にする。使わない側は `transparent`。`--m-blur` の saturate（160% / 140%）は filter なので、`data-theme` と `prefers-color-scheme` で切り替える。
  - 綴じ線の見本にある `height`・`margin`・`border: 0` は写さない。穴の `background` だけを、フラットの高さ 0・6px の二重線の中に置く。
  - 条件群の `rotateX(5deg)` は `.bi-drawer__group` に付ける。`data-sig` は親の `.bi-drawer` にある。
  - L3 では、このファイルが変えた影・角・ぼかし・地の画像を戻す。識別検査のボタンは、既存の `inspect.ts` が real のとき L3 を出さない。
  - 禁止プロパティの検査は `scripts/check-finish-props.mjs` に置く。`npm run lint` には足さない（工程20a）。
- 残課題：Board と Spread の `finish-real.css`、6通りの撮影、1画面のすりガラス数えは工程18b。L2 の配置が flat と同じかの最終判断は人。

## 工程18b Board・Spread のモダンリアルと6通りの確認 — 2026-10-08 完了

- 確認：`scripts/finish-matrix.mjs` で binder / board / spread × flat / real の6通りを順に実行した。各 build の `astro check` はエラー 0、147 files、warnings 0、hints 3（hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。flat の dist に `--m-` は無く、real にはある。`tests/identity/finish.spec.ts` は、各セットで flat が `docs/identity/geometry-{set}.json` を書き、real で4画面の `[data-sig]` の差が 1px 以内。real では本文の面の `backdrop-filter` が `none`、見えるすりガラスは 6 面以内、`forced-colors` と印刷で影とぼかしが外れ、`prefers-reduced-transparency` は CDP で emulate してすりガラスが外れた（⏳ではない）。各 real は 4 passed。`scripts/check-finish-props.mjs` は禁止プロパティなし。gzip は Binder 3547、Board 3080、Spread 3047 bytes。L1・L2 は `docs/identity/{set}-{finish}/`。スタイルガイドは `docs/qa/styleguide-{set}-{finish}/`（1280、375、文字200%）。1280 で4画面の `scrollWidth` は `clientWidth` と同じ。数は `docs/qa/finish.md`。Board real をブラウザで開き、ホームの固定盤は角 18px でぼかしなし、記事面は角 14px でぼかしなし、計器は `blur(18px)`。検索欄に「保険料」を入れて `/search/?q=保険料` へ進み、すりガラスは検索欄の1面。記事は h1 が題で、パネルのぼかしはなく、計器は6面。Spread real では主面の円弧が `360px / 300px` のままぼかしなし、背はすりガラス。ホームの「お金」から `/category/finance/` へ進んだ。記事の目次から節へ移り、URL に見出しの fragment が付いた。検索は問いの円3面で、主面のぼかしはない。dev の検索は Pagefind が無く「検索を読み込めませんでした」（preview の寸法テストは Pagefind あり）。確認後にサーバーを停止。
- 判断：
  - 見本の `width`・`height`・`margin`・`padding`・`content`・`border` の幅・選択中の `translateY` は写さない。沈みは parts.css の `transform` のまま、色と影だけを足す。タイルと比較面の `:hover` の `translateY(-3px)` だけを finish に書く。
  - Spread の曲面の光は `::before` の `position` を使わず、`.sp-face` の `background-image` に畳む。円弧の `border-radius` は変えない。
  - 固定盤と背は sticky なので、ぼかしの大きい影は付けず、上端の光と短い影にする。
  - すりガラスの上限は ADR-0009。索引の問いと、検索画面の棚スタンプは不透明。検索画面のすりガラスは問いの円3つ。
  - 禁止プロパティの検査は3セットを見る。Binder だけ傾きと `perspective` を要する。`npm run lint` には足さない（工程20a）。
  - 6通りの手順は `scripts/finish-matrix.mjs` に残す。工程19b は `--shoot-only --dest docs/qa/samples --paths …` で記事を撮れる。
- 残課題：L2 の配置が flat と同じかの最終判断は人。スタイルガイドは部品を並べる画面なので、計器やすりガラスが6面を超える。数えたのは識別検査の4画面。

## 工程19a サンプル記事（前半3本）の本文 — 2026-10-08 完了

- 確認：`npm run build` が通る（`astro check` はエラー 0、147 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。`check-output` は仮の検査。build の警告は既存の `products/sample-invoice-b: 確認期限 2026-09-30 を過ぎている` の1件（工程19bで意図した警告かを見る）。本文の字数は、生成した HTML の `.dd-prose` から空白を除いた概算。h2 はその中の見出し。
  - `sample-work-style-basics`：2,997字。h2 は5（この記事で分かること／雇用契約と業務委託の定義／指揮命令、報酬、保護の仕組み／名称と実態がずれるとき／確認してから次の手続きを見る）。
  - `sample-independence-steps`：2,984字。h2 は5（対象と、終わったときに揃うもの／手続きは五つの順で進める／判断が分かれる期限／遅れたときと完了の確認／要点）。`##` は4。Steps は5。`steps: 5` と一致。
  - `sample-social-insurance`：2,905字。h2 は4（退職後の健康保険は3つから選ぶ／保険料を比べるときにそろえる条件／年金は国民年金へ切り替える／要点）。`##` は7.1の例と同じ3。
- ブラウザ：3本を開いた。解説は目次から「名称と実態がずれるとき」へ移り、質問を開いた。実務は手順5、出典、開業届と確定申告、注意、根拠、要点が出る。社会保険は条件3行、出典が `#src-sample-kenpo-voluntary` へ移る。確認後に preview を停止。
- 判断：解説には情報源が無いので Cite は付けず、制度の金額と期限は書かない。比較表の基準日は公開日、根拠の種類は編集の判断。実務と社会保険の期限は、架空の案内の例示として、単位・期間・基準日・条件・Cite を本文に置く。円の金額は書かない。切り替えの可否は、質問だけでなく本文にも書く。
- 残課題：文の最終確認は人。後半3本、用語・情報源・商品、状態の網羅、6通りの撮影は工程19b。

## 工程19b 後半3本・用語・情報源・商品の完成 — 2026-10-08 完了

- 確認：`npx cross-env DD_MODE=demo npm run build` が通る（`astro check` はエラー 0、147 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。`check-output` は仮の検査。コンテンツ検査の警告は次の1件だけ。
  ```
  [decision-desk] 期限切れ 1 件
  - products/sample-invoice-b: 確認期限 2026-09-30 を過ぎている
  ```
  Vite は6本の MDX すべてで `use astro:head-inject` の MODULE_LEVEL_DIRECTIVE を出す。これはバンドラの通知で、期限の検査ではない。本文の字数は、生成した HTML の `.dd-prose` から空白を除いた概算。h2 はその中の見出し。
  - `sample-invoice-service-compare`：2,946字。h2 は5（比べる対象、評価軸、重み／五つの軸を同じ基準で並べる／三つのサービスの料金と広告／契約条件と、よい点・注意する点／条件が違うときの見方）。CompareTable は3列×8行。
  - `sample-news-e-document`：1,637字。h2 は4（発生日と確認時点／確認できた事実／まだ確定していない事項／続報と訂正は別の履歴にする）。
  - `sample-interview-pricing`：1,827字。h2 は5（問題と、架空の話者／話者が語った事実／見解と、引用の主体／反対の見方と限界／要点）。`##` は4。画像は0。
- ブラウザ：比較は目次から「条件が違うときの見方」へ移り、出典1が `#src-sample-invoice-a-pricing` へ移る。適格請求書の補足を開き、閉じるとボタンにフォーカスが戻る。375px ではページの `scrollWidth` は `clientWidth` と同じで、比較表は器の中だけ横に溢れる（959 > 313）。ニュースは発生 `2026.10.03 15:00`、確認時点 `2026.10.05 09:00`、履歴は更新・続報・訂正。リンクカードから比較記事へ進む。人物記事に `img` は無く、要点と補足が出る。375px でページは横に溢れない。用語「所得控除」から手続き記事へ進める。確認後に preview を停止。
- 撮影：`node scripts/finish-matrix.mjs --shoot-only --dest docs/qa/samples --paths …`。6通り×6記事×2幅で72枚。`docs/qa/samples/{set}-{finish}/p1` から `p6` が、働き方、手続き、比較、社会保険、ニュース、人物の順。1280 と 375。比較の375（binder・board・spread の flat、binder の real）、比較の1280（board real）、社会保険の375（binder flat）、ニュースの375（spread flat）、人物の375（spread real）を見て、ページの横溢れや重なりは無かった。開発サーバー起動直後の再読み込みで `document.fonts.ready` が切れるので、`shootCustom` は最大3回やり直す。
- 判断：
  - 情報源8件と商品3件は、7.1の表とすでに一致していたので、データの中身は変えていない。用語10件は本文が各5文、`related` あり。`shotoku-kojo` だけ `article` が無かったので、`sample-independence-steps` を足した。
  - サービスBの円は、確認期限を過ぎているので本文に書かない。年額・税別は周期と税の欄で示す。カード決済手数料の 3.25〜3.6% は金利ではなく、`rates` の範囲の例である。
  - ニュースの `asOf` と `updatedAt` と `lastVerifiedAt` は、訂正の 2026-10-05 09:00 に合わせた。情報源の確認日は7.1のとおり 2026-10-04 のまま。
- 状態の網羅：

  | 状態 | どこで確かめるか |
  |---|---|
  | 0円の料金 | `products.yaml` の `sample-invoice-a` 初期費用 `amount: 0`。比較記事の ProductBox A と CompareTable「初期費用」 |
  | 未確認（`amount: null`） | `sample-invoice-b` の追加ユーザー。比較記事の本文と CompareTable「追加費用」。料金票は期限切れのため「再確認中」 |
  | 税込・税別の混在 | A・C は税込、B は税別。比較記事の本文、CompareTable「税の扱い」、ProductBox |
  | 月額・年額の混在 | A・C は月、B は年。比較記事の本文と CompareTable「料金の周期」 |
  | 金利の範囲 | `sample-invoice-c` の `rates`（カード決済手数料 3.25〜3.6%）。比較記事の本文と ProductBox C |
  | 期限が近い条件 | `sample-invoice-c` の初年度半額（`2026-12-31` まで、新規契約のみ）。比較記事の本文と ProductBox C の注記 |
  | 期限切れ | `sample-invoice-b` の `reviewDueAt: 2026-09-30`。料金は「再確認中」。上の警告1件 |
  | 写真の無い人物記事 | `sample-interview-pricing`。`cover` なし。生成 HTML に `img` は無い |
  | 長い日本語の題 | `sample-social-insurance` の題（35字）。6記事の中で最長。上限は80字 |
  | 比較の列が多い表 | `sample-invoice-service-compare` の CompareTable。項目・3サービス・根拠の種類で5列、8行 |

- 12ブロック（ブロック → 記事）：

  | ブロック | 記事 |
  |---|---|
  | DecisionBrief | `sample-social-insurance`（frontmatter の `brief`） |
  | Summary | `sample-independence-steps`、`sample-social-insurance`、`sample-interview-pricing` |
  | Evidence | `sample-independence-steps`、`sample-social-insurance`、`sample-invoice-service-compare`、`sample-news-e-document` |
  | Conditions | `sample-social-insurance`（rows）、`sample-invoice-service-compare`（product。ProductBox の中と、Bの単独） |
  | Callout | `sample-work-style-basics`、`sample-independence-steps`、`sample-interview-pricing` |
  | Steps | `sample-independence-steps` |
  | Faq | `sample-work-style-basics`、`sample-social-insurance` |
  | ProductBox | `sample-invoice-service-compare`（A・B・C） |
  | CompareTable | `sample-work-style-basics`、`sample-invoice-service-compare` |
  | ProsCons | `sample-work-style-basics`、`sample-invoice-service-compare` |
  | Term | `sample-work-style-basics`、`sample-independence-steps`、`sample-social-insurance`、`sample-invoice-service-compare`、`sample-news-e-document` |
  | LinkCard | `sample-news-e-document`、`sample-interview-pricing` |

- 残課題：文の最終確認は人。識別検査の判定、読み上げ、実機は工程20。

## 工程20a 出力検査の完成 — 2026-10-08 完了

- 確認：`npm run lint` はエラー 0。`npx cross-env DD_DESIGN_SET=… DD_FINISH=… npm run build` を6通り実行し、いずれも `check-output: OK`。`astro check` はエラー 0、147 files、warnings 0、hints 3（hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。コンテンツの警告は `products/sample-invoice-b: 確認期限 2026-09-30 を過ぎている` の1件。
  - binder / flat：CSS gzip 8921 bytes、初期JS gzip 最大 3924 bytes、style 要素 1、広告リンク 2
  - binder / real：CSS gzip 11430、JS 3924、style 1、広告 2
  - board / flat：CSS gzip 9256、JS 3924、style 1、広告 2
  - board / real：CSS gzip 11499、JS 3924、style 1、広告 2
  - spread / flat：CSS gzip 9916、JS 3924、style 1、広告 2
  - spread / real：CSS gzip 12113、JS 3924、style 1、広告 2
  予算は初期JS 20KB、CSS は flat 30KB・real 38KB。広告リンク2件は比較記事とスタイルガイドの商品Cで、`data-ad="affiliate"` と `rel="sponsored noopener"`。
- 意図的な誤り（binder / flat。戻したあと、この2ファイルの差分に検査用の行は残っていない）:
  1. `binder/parts.css` の `.bo-x { color: var(--c-ink); }` → `/_astro/nav.….css: 未選択セット board のCSSが含まれている`。空の `.bo-x{}` はビルドが落とすので、宣言を1つ残した。
  2. ホームに h1 を2つ → `/index.html: h1 が1つでない`
  3. `/missing-page/` → `/index.html: リンク切れ: /missing-page/`
  4. `parts.css` の `--m-probe` → `/_astro/nav.….css: flat なのにモダンリアルの層が含まれている`
  加えて、スタイルガイドの `<style>` に `.bo-x` と `--m-probe` を一時的に入れ、`/styleguide/index.html` が未選択セットと flat の `--m-` で止まった。戻したあと `check-output` は OK。
- production：`npx cross-env DD_MODE=production npm run build` は次で止まる。
  ```
  site.config.ts の検査に失敗:
  - production では site.url に実際のURLを設定する
  - production では contact.email または contact.formUrl が必要
  ```
  サンプルは、設定の検査が先に止まるのでこのコマンドでは見えない。`DD_SITE_URL=https://www.example-media.invalid` と連絡先を一時的に足すと、`[decision-desk] コンテンツの検査に失敗（28 件）` となり、記事6・用語10・著者1・情報源8・商品3が `production に sample: true が残っている` で止まる。サンプルは削除していない。連絡先は戻した。
- 判断：
  - 禁止プロパティの検査は `scripts/check-finish-props.mjs` のまま、`npm run build` の先頭で呼ぶ。`check-output` にも `npm run lint` にも入れない（ADR-0010）。
  - HTML の `<style>` も、未選択セットの接頭辞と flat の `--m-` を見る。この build ではスタイルガイドの小さい CSS が1つ入る（`build.inlineStylesheets` の既定 auto。セットの CSS は外部ファイル）。CSS の gzip 予算は、手順書どおり外部の CSS だけを数える。
  - `rel="sponsored"` のリンクに `data-ad` が無いときも止める。
  - スタイルガイドのページ送り見本は3ページに見えるが、記事一覧は1ページしか無い。`Pager` に `sampleHref` を足し、番号のリンク先を `/articles/` にした。
- 残課題：E2E・axe・構造比較は工程20b。性能・a11y・識別検査の記録は工程20c。`check-output` の production 分岐（HTML 内の仮URL、`.dd-sample`、識別検査モード）は、設定とコンテンツの検査が先に止まるため、このテンプレートでは build がそこまで進まない。作業ツリーには工程20aより前の未コミットが残っている。この工程のコミットは、出力検査と、そのために足した `Pager` の `sampleHref` だけにした。

## 工程20b E2E・アクセシビリティの自動検査・3セットの構造比較 — 2026-10-08 完了

- 確認：binder / board / spread の flat で、それぞれ `npm run build` のあと `npm run test:e2e`（desktop と mobile）。最後に `npm run verify`（binder / flat）。`npm run lint` はエラー 0。単体は 9 files、41 tests。`astro check` はエラー 0、150 files、warnings 0、hints 3（hints は工程4と同じ `z.string().url()`）。Pagefind は16ページ。コンテンツの警告は `products/sample-invoice-b: 確認期限 2026-09-30 を過ぎている` の1件。`check-output: OK`。E2E は 70 passed、2 skipped（構造比較は desktop だけ、375px の索引は mobile だけ）。
- 構造：`docs/qa/structure-{binder,board,spread}.json`。見出し・landmark・main のリンク・`data-pagefind-body` の文字は3セットで一致。
- 判断：
  - 検索の landmark が2つあるページでは、索引のフォームを「索引の検索」、検索面を「記事を検索」、404 のフォームを「キーワードで検索」と名付けた。
  - スタイルガイドの確認票見本は、見出しが同じ「この記事で分かること」が2つあった。短い見本の題を「短い確認票」にした。
  - 1200px 以上では本文の `#toc` を隠し、確かめる領域の目次を出す。E2E はその幅で見えている目次から節へ移動する。
  - Board と Spread の棚印に出ていた記事型は、型の行と二重だった。読み上げと検索対象からは外し、見た目は残した。
  - Spread の検索条件は main の中にあり、確かめる領域が無かった。条件群は check スロットへ移し、検索ページでは背を条件の列として残す。
- 残課題：性能・a11y の記録・識別検査は工程20c。読み上げ、実機、識別検査の判定は人が行う。作業ツリーには工程20bより前の未コミットが残っている。この工程のコミットは、E2E と、それを通すために直した部品だけにした。

## 工程20c 識別検査の自動補助・性能・アクセシビリティと識別検査の記録 — 2026-10-08 完了

- 確認：`DD_INSPECT=1` で binder / board / spread × flat / real の6通りを build し、`npm run test:identity`。flat は 5 passed・3 skipped（質感の試験は real だけ）。real は 8 passed。`check-output` は6通りとも `識別検査モード あり（.dd-inspect 46）`。その後、`DD_INSPECT` なしで binder-flat・board-real・spread-real を build し、いずれも `識別検査モード なし（.dd-inspect 0）`。最後の `npm run verify`（binder / flat）は、lint エラー 0、単体 9 files・41 tests、`astro check` エラー 0（154 files、warnings 0、hints 3。hints は工程4と同じ `z.string().url()`）、Pagefind 16ページ、コンテンツの警告は `products/sample-invoice-b: 確認期限 2026-09-30 を過ぎている` の1件、`check-output: OK`、E2E は 70 passed・2 skipped。
- 性能：Lighthouse 13.5.0、モバイル、simulated、各3回の中央値。`docs/qa/performance.md`。ホームと記事は Performance 100、LCP 1.3秒未満、CLS 0.05 以下、TBT 0。検索の CLS は binder 0.413、board 0.206、spread 0.227。検索の Performance は 81 / 90 / 89。Accessibility は3ページとも 100。SEO 66 は demo の noindex。初期 JS gzip 3924 bytes。CSS gzip は binder-flat 8921、board-real 11499、spread-real 12142。
- 判断：
  - 識別検査モードの有無は、production 以外でも `check-output` が見る（ADR-0011）。`DD_INSPECT=1` でパネルが無いときも止める。
  - 4画面の枠は、先頭の `s{番号}` で判定する。S5 は検索画面。ホームの欄は索引の入口。S7 は記事で補足を開いてから大きさを見る。S9 はホームと記事。一覧と検索の末尾には置いていない。
  - L3 は flat だけ撮る。撮影では右下の切替を隠す（モードの CSS は残す）。
  - 検索結果の題は h2 にした。h1 の次が h3 で、Lighthouse の見出し順が落ちていた。見た目のクラスは変えていない。
  - 検索の CLS は直していない。狭い幅で条件の列が結果の後にあり、結果を入れると列が動く。形の並べ替えは識別検査の画像を変えるので、この工程では記録にとどめた。
- 残課題：識別検査 A〜F の判定（5名以上、制作者以外3名以上）。読み上げ（`docs/qa/a11y.md` の手順）。実機（README の対応ブラウザ）。検索の CLS。実ユーザーの Core Web Vitals。工程22 の導入時間。作業ツリーには工程20cより前の未コミットが残っている。この工程のコミットは、識別検査・性能・a11y の記録と、そのために直した検査と検索結果の見出しだけにした。

## 工程20 追補 レビュー指摘の修正（注入対策・Playwright のスクリプト） — 2026-10-08 完了

- 確認：先に、工程12〜20 の未コミット分を `npm run verify`（binder / flat）で確かめてコミットした（`43aa19d`）。HEAD の `styleguide.astro` が未追跡の `src/assets/styleguide/photo.png` を import していて、clone した HEAD の build は落ちていた。修正のあと、`npm run verify`（binder / flat）が通った。lint はエラー 0。単体は 10 files・50 tests。`astro check` はエラー 0（157 files、warnings 0、hints 0。工程4 からの `z.string().url()` の hints 3 が消えた）。Pagefind は16ページ。コンテンツの警告は `products/sample-invoice-b` の期限切れ1件。`check-output: OK`。初期 JS gzip は最大 3967 bytes。E2E は 76 passed・2 skipped（新しい `security.spec.ts` の 3 件 × desktop・mobile を含む）。`DD_DESIGN_SET=board` と `spread` の build も通り、`check-output: OK`。`node scripts/finish-matrix.mjs --shoot-only --dest .tmp/fm-check --paths /` は6通りで dev を起動・停止し、12枚を撮った。DEP0190 の警告は出ず、4321 番は空いた。確かめたあと、`.tmp/fm-check` は消した。
  意図的な誤り（戻したあと、該当ファイルに差分は無い）:
  1. `sources.yaml` の url を `javascript:alert(1)` → `astro sync` が「http(s) の URL を書く（javascript: や data: は使えない）」で止まる。
  2. `contact.email` を `a@b.example?bcc=x@y.example`、`formUrl` を `javascript:alert(1)` → `site.config.ts の検査に失敗` で2件。
  3. `dist/about/index.html` に、`" java<TAB>script:"` のリンク、`rel="noopener"` の無い `target="_blank"`、`data:` の form、inline の `<script>` を足す → `check-output` が4件で止まる。元のファイルに戻すと OK。
  4. `node scripts/record-performance.mjs "x&echo pwned" flat` → 使い方を出して終了コード 1。Lighthouse もシェルも起動しない。
  5. `finish-matrix.mjs --paths` に `@example.org/` と `/\example.org/` → dev とブラウザを起動する前に止まる。後者は先頭の `//` の検査を抜け、origin の比較で止まる。`shoot.mjs --base javascript:alert(1)` も止まる。
  6. `src/scripts/toc.ts` に `innerHTML` への代入・`insertAdjacentHTML`・`document.write` → lint が3件で止まる。
- 判断：
  - 注入対策は、入口の検証・出力の検査・lint の3か所で止める（ADR-0012）。外部 URL は `z.httpUrl()`。`validateSite` は、mode を問わず `site.url`・`contact.email`・`contact.formUrl` を見る。`check-output` は、スキーム（http・https・mailto・相対だけ）、`target="_blank"` の `noopener`、ページあたり1つまでの実行される inline script を見る。
  - `set:html` は7か所とも、Astro がエスケープした描画結果か、`<` をエスケープした JSON-LD。理由を書いて1行ずつ lint から外した。`astro/no-unsafe-inline-scripts` は、Astro が外部ファイルにまとめる `<script>` 8か所も報告するので使わない。
  - 記事の条件・根拠の題は、描画済み HTML の属性から拾っていて、`&` が `&amp;amp;` と二重にエスケープされていた。`decodeAttr` で戻す（XSS ではなく表示の誤り）。
  - 保存データの `parseBookmarks` / `parseResume` は、知っている項目だけを詰め直す。`ratio` は 0〜1 に収め、有限でない値と 200 字を超える見出し id は捨てる。検索結果は、同じ origin の URL だけをカードにする。古い Safari に無い `URL.canParse` はクライアントで使わない。
  - Playwright のスクリプト：`record-performance.mjs` は引数を許可リストで検査し、Lighthouse を shell なしで起動する。Chrome は `chromium.executablePath()` から取る（`CHROME_PATH` に空白があると壊れていた。`chrome-win64` しか探していなかった）。`finish-matrix.mjs` は、`--paths` を `http://localhost:4321` の中のパスに限る。node は shell なしで起動し、npm / npx には固定の文字列だけを渡す。`freePort` は4321番の node だけを止め、ほかのアプリは止めない。`shoot.mjs` の `--base` は http(s) だけ。`playwright` の import は、package.json にある `@playwright/test` に揃えた。識別検査のテストは、`DD_DESIGN_SET` / `DD_FINISH` を `tests/identity/target.ts` で検査してから、ファイル名に入れる。
  - `playwright.config.ts`：ローカルは今の運用（4321 番のサーバーを再利用）のまま。CI では毎回サーバーを立て、`forbidOnly` と `retries: 2` を付ける。失敗したテストの trace は残す。
  - `.gitattributes` で改行を LF に揃えた（Windows の `core.autocrlf` で CRLF の警告が出ていた）。Prettier は、HEAD で整形済みだったファイルと新しいファイルだけに掛けた。手順書のコードのまま整形されていないファイルは、差分を混ぜないため触っていない。
- 残課題：
  - 工程21 の CSP：全ページの `style="--slot:…"` などの属性は、ハッシュを入れた `style-src` で止まる。`style-src-attr` の扱いか、クラスへの置き換えが要る。Pagefind は WebAssembly に `'wasm-unsafe-eval'` が要る。明暗の初期化の inline script はハッシュが要る（`check-output` はこれを1つに保つ）。`frame-ancestors`・`X-Content-Type-Options`・`Referrer-Policy`・`Permissions-Policy` はヘッダーでしか付かない。
  - 工程21：CI（手順書の GitHub Actions の例）、`build:demo` の `scripts/build-demo.mjs`。
  - 既知のまま：検索の CLS（工程20c）。`finish-matrix.mjs` の `freePort` は Windows だけで働く。`build-identity-kit.mjs` の並べ替えは `randomBytes(1) % n` で、わずかな偏りがある（判定に影響しない程度）。

## 工程21 本番の仕組み・比較デモ・デプロイの準備 — 2026-10-09 完了

- 確認：
  - `npx cross-env DD_MODE=production DD_SITE_URL=https://www.example-media.invalid npm run build` は、`production では contact.email または contact.formUrl が必要` で止まる。`contact.email` を一時的に足すと、記事6・用語10・著者1・情報源8・商品3の `production に sample: true が残っている`（28件）で止まる。連絡先は戻した。サンプルは削除していない。
  - `npm run build:demo` は6通りとも `check-output: OK`。`dist-demo/demo/index.html` と `binder-flat`・`binder-real`・`board-flat`・`board-real`・`spread-flat`・`spread-real` がある。静的サーバーで開くと、HTML 277件がすべて noindex。各ホームの `data-design-set` と `data-finish` が名前と一致し、`--slot` が適用され、検索「保険」が件数を返す。CSP の違反は無い。確認後にサーバーを停止。通常の `dist/` に `/demo/` は無い。
  - `npm run verify`（binder / flat）は、lint エラー 0、単体 10 files・50 tests、Pagefind 16ページ、コンテンツの警告は `products/sample-invoice-b` の期限切れ1件、`check-output: OK`（CSS gzip 8921 bytes、初期 JS gzip 最大 3967 bytes、style 要素 1、広告リンク 2、識別検査モードなし）。E2E は 76 passed・2 skipped。このときの `astro check` は `dist-demo` の Pagefind を見て 266 files・hints 258 だった。`tsconfig.json` の `exclude` に `dist-demo` を足したあとの `npm run check` は 158 files、エラー 0、warnings 0、hints 0。
- 判断：
  - production 以外の noindex は、工程14の `isIndexable` のまま。`check-output` が、production 以外で `noindex` の無い HTML を止める。`BaseLayout` には重ねない。
  - CSP は Astro 7.3 の `security.csp`（ADR-0013）。手動のハッシュは使わない。`style-src-attr` は `'unsafe-inline'`。Pagefind に `'wasm-unsafe-eval'`。紙の粒の data URL に `img-src data:`。`frame-ancestors` は `public/_headers` だけ。4KB 未満の JS を HTML に埋め込まない（識別検査のスクリプトが2つ目の inline になるため）。
  - ホスティングは未定。キャッシュとセキュリティヘッダーは `public/_headers`。手順は `docs/deploy.md`。定期 build は毎週月曜 09:00 JST。テンプレートでは demo のまま（production にするとサンプルで毎回失敗する）。`DEPLOY_HOOK_URL` があるときだけ成功後に POST する。
  - build は、`style-src` と `style-src-attr` の併記と、Shiki について警告する。属性へ `'self'` は足さない。本文にコードブロックは無い。
- 残課題：ホスティングの選定、本番 URL、環境変数、デプロイ、通知の受け取り先、本番用の文言とセットの決定、実コンテンツへの置き換え（別リポジトリ）。本番 URL での `check-output`（production）と、直前のリリースへ戻す手順の実地確認は人が行う。検索の CLS、読み上げ、実機、識別検査の判定は工程20のまま。

## 工程22 配布 — 2026-10-09 完了

- 確認：
  - 公開名称は Decision Desk。`site.config.ts` の `name` は Decision Desk、`organization.name` は Decision Desk 編集部。パッケージ名は `decision-desk-template`、版は `0.1.0`。ライセンスは MIT。
  - `npm test` は 10 files、50 tests が成功。
  - 導入練習は `.tmp/onboarding`（作業ツリーのコピー。`node_modules` と `dist` は除いた。未コミットの README は `git clone` に入らない）。`npm ci` は 17秒。`npm run dev` は Astro のログで ready in 2067 ms。ホームは 200、title は Decision Desk、`data-design-set=binder`、`data-finish=flat`。依存取得のあと5分以内。
  - `npx cross-env DD_DESIGN_SET=board DD_FINISH=real npm run dev` のホームは 200。`data-design-set=board`、`data-finish=real`。HTML に「Decision Desk Media」は無い。確認後にサーバーを停止。
  - README の最小例を `src/content/articles/practice-contract-check/index.mdx` として足し、`npm run build` が通った。`check-output: OK`（binder / flat / demo。CSS gzip 15518 bytes、初期 JS gzip 最大 3967 bytes、style 要素 1、広告リンク 2、識別検査モードなし）。`/articles/practice-contract-check/` が生成された。練習用の記事はコピーから削除した。本体の `src/content` には置いていない。
- 判断：
  - サイトの既定表示名は、作業名のまま Decision Desk にした。過去の工程記録と、手順書の正本 `docs/spec/manual-v3.2.md` にある「Decision Desk Media」は、当時の記録と手順書の写しなので変えていない。`tests/unit/seo.test.ts` は関数へ渡す例示なので変えていない。
  - 保存キー `decision-desk:v1` は変えていない。続きの位置だけが180日で捨てられる。あとで読むは200件で、保存一覧から消す。
  - `AGENTS.md` と `CLAUDE.md` のハードリンクは残した。
  - 依存のライセンスは `node_modules` の package.json から619件。集計スクリプトは残していない。書体ファイルとアイコンフォントは同梱していない。
  - 5.5 は `docs/qa/release-checklist.md`。検索の CLS は工程20c の ❌ のまま。
- 残課題：GitHub への公開と、テンプレートとしての設定（`npm create astro@latest -- --template <github-user>/decision-desk-template`）。制作者以外の人が README だけで導入できるかの確認。識別検査 A〜F、読み上げ、実機のブラウザ確認。ホスティング、本番 URL、実コンテンツへの置き換えは工程21のまま。

