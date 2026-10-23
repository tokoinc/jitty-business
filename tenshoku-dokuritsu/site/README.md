# 独立か、転職か。

仕事とお金の記事を、条件と根拠を確かめながら読めるメディアのテンプレートです。パッケージ名は `tenshoku-dokuritsu`（版 0.1.0）。

同梱の6記事、用語10件、情報源8件、商品3件、著者1件は架空のサンプルです。実在の評価、金融条件、購入体験、口コミ、監修ではありません。サンプルの商品に、実際の申込リンクや広告リンクは付いていません。`DD_MODE=production` の build は、`sample: true` が1件でも残っていると止まります。

## 必要な環境

- Node.js 22.12 以上。このリポジトリの `.nvmrc` は 24
- npm

## 導入

リポジトリのルートで実行します。

```sh
npm ci
npm run dev
```

ブラウザで http://localhost:4321/dokuritsu-tenshoku/ を開きます。止めるときは、そのターミナルで Ctrl+C を押します。

Windows で環境変数を付けてコマンドを走らせるときは、`npx cross-env` を使います。

## 設定

既定値は `src/site.config.ts` にあります。本番の build では `DD_MODE=production` と `DD_SITE_URL=https://business.jitty.jp/dokuritsu-tenshoku` を付けます。未設定の `DD_SITE_URL` も同じ URL です。公開パスは `DD_BASE=/dokuritsu-tenshoku/` です。

| 項目 | 既定 | 意味 |
| --- | --- | --- |
| `name` | 独立か、転職か。 | サイト名。ホームの title になる |
| `tagline` | 50代からの次の働き方を、比べて、選んで、準備する。 | 短い説明 |
| `description` | 早期退職・役職定年のあと、独立と転職を同じ基準で比べ、退職前と退職後の確認事項を整理するメディア。 | サイトの説明 |
| `mode` | `DD_MODE`。未設定なら `demo` | `demo` は全ページ noindex で、サンプルを許可する。`production` は本番 |
| `url` | `DD_SITE_URL`。未設定なら `https://business.jitty.jp/dokuritsu-tenshoku` | canonical と RSS の起点。production では `example.com` / `example.org` / `example.net` を拒否する |
| `base` | `DD_BASE`。未設定なら `/dokuritsu-tenshoku/` | `/` で始まり `/` で終わる。公開パス |
| `outDir` | `DD_OUT_DIR`。未設定なら `./dist` | build の出力 |
| `lang` / `locale` / `timezone` | `ja` / `ja_JP` / `Asia/Tokyo` | 言語と日付 |
| `design.designSet` | `DD_DESIGN_SET`。未設定なら `binder` | `binder` / `board` / `spread` |
| `design.finish` | `DD_FINISH`。未設定なら `flat` | `flat` / `real` |
| `inspect` | `DD_INSPECT=1` のときだけ | 識別検査モード。production では拒否する |
| `storage.namespace` | `tenshoku-dokuritsu:v1` | ブラウザ内の保存キー。変えると、そのブラウザに残っていた保存は読めなくなる |
| `editorial.sensitiveCategories` | `before-leaving` と `after-leaving` | 影響の大きい棚の目安。実際の必須条件は棚の `reviewProfile` |
| `editorial.staleNumbers` | `hide` | 確認期限を過ぎた金額は「再確認中」にする。`warn` は警告だけ |
| `features.bookmarks` | `true` | あとで読む |
| `features.resumeReading` | `true` | 続きから読む |
| `features.glossaryPopovers` | `true` | 用語の補足。切っても用語へのリンクは残る |
| `analytics` | 無効 | 有効にするときは `ga4Id` が必要。検索語は既定では送らない |
| `organization` | 独立か、転職か。編集部 | 運営者名とロゴ |
| `disclosure` | アフィリエイト、記事広告、提供の定型文 | 記事の `commercial` に合わせてタイトル付近へ出す |
| `contact.email` / `contact.formUrl` | メールは空。フォームは `https://business.jitty.jp/contact` | production ではどちらかが必要。フォーム URL は https。サイト内に送信処理はない |
| `articlesPerPage` | 12 | 一覧の件数 |

production の build は、次のどれかがあると止まります。

- `site.url` に `example.com` / `example.org` / `example.net` が残っている
- `contact.email` と `contact.formUrl` が両方空
- 記事・用語・著者・情報源・商品のどれかに `sample: true` が残っている
- `DD_INSPECT=1`

連絡先の文言、組織名、セットと質感は、本番のリポジトリで実態に合わせて書き換えます。ホスティングの手順は [docs/deploy.md](docs/deploy.md) です。

## セットと質感

セットは配色ではなく、空間の規則です。記事のデータ、URL、見出し、条件・根拠・広告の意味は3セットで同じです。セットを変えて再 build すると、全ページと12ブロックの見た目が切り替わります。

| セット | 原形 | 向く媒体 |
| --- | --- | --- |
| Binder（既定） | タブ付きの台紙。索引の爪が開き、確かめる領域の付箋が台紙の右辺へ差し込まれる | 仕事・ビジネス・金融を横断し、解説と比較が中心の媒体 |
| Board | 太い輪郭の差し替えパネル。左が濃い固定盤、右が明るいパネル | 短報・実務・比較が多く、更新が多い媒体 |
| Spread | 大きな曲面で切った見開き。右端に縦の章標題 | 人物・論考・連載・特集が中心の媒体 |

質感は `design.finish` です。`flat` が既定です。`real` は、選んだセットの CSS の上に `finish-real.css` を重ねます。`flat` の build には、リアル用の層は入りません。

読者向けのセット切替と質感切替はありません。読者が選べるのは、明暗と文字サイズだけです。明暗は OS の設定に追従し、表示設定で固定することもできます。

切り替えの例です。開発サーバーが動いているときは、一度止めてから実行します。

```sh
npx cross-env DD_DESIGN_SET=board DD_FINISH=real npm run dev
```

`DD_DESIGN_SET` は `binder`、`board`、`spread`。`DD_FINISH` は `flat`、`real`。

6通りを並べて見るときは、次を実行します。

```sh
npm run build:demo
```

`dist-demo/demo/index.html` から、binder / board / spread と flat / real の6通りを開けます。中身は同じ記事です。すべて noindex で、本番の `dist/` には入りません。

## 記事の書き方

記事は `src/content/articles/<id>/index.mdx` です。`<id>` は英小文字、数字、ハイフンだけにします。本文は MDX です。信頼する編集者だけが編集します。

見本は `src/content/articles/sample-social-insurance/index.mdx` です。お金の棚（`finance`）は `reviewProfile: sensitive` なので、対象・範囲・情報源・確認日・確認担当・次回確認期限が必要です。仕事の棚（`work`）で足す最小の例は、次のとおりです。

```mdx
---
title: "独立の前に、契約の種類を確認する"
description: "業務委託と雇用の違いを、契約書で見る項目だけに絞って整理します。"
publishedAt: "2026-10-01T09:00:00+09:00"
category: work
author: editorial-team
format: guide
intent: learn
---

## 契約書で見る項目

報酬の単位、期間、解約の条件を、契約書の条文で確認します。
```

日時と日付は、YAML で引用符に囲みます。囲まないと日付オブジェクトになり、build が止まります。

| 項目 | 要否 | 書き方 |
| --- | --- | --- |
| `title` | 必須 | 1〜80字 |
| `description` | 必須 | 20〜160字 |
| `publishedAt` | 必須 | `"2026-10-01T09:00:00+09:00"` の形。未来の日時は公開されない |
| `updatedAt` | 任意 | `publishedAt` 以降 |
| `category` | 必須 | `src/data/categories.yaml` の id |
| `tags` | 任意 | `src/data/tags.yaml` の id |
| `series` | 任意 | `id` と `order`。同じ連載で `order` は重複させない |
| `author` | 必須 | `src/content/authors/` の id |
| `format` | 必須 | `guide` / `tutorial` / `comparison` / `news` / `opinion` / `interview` |
| `intent` | 必須 | `learn` / `compare` / `choose` / `do` / `solve` |
| `cover` | 任意 | `src` と `alt`。無いときは共通の OG 画像 |
| `speaker` | 任意 | 論考・人物の話者名 |
| `steps` | 任意 | 実務記事の手順数。記事面の目盛りに使う |
| `compare` | 任意 | `items` と `axes` |
| `summary` | 任意 | 120字まで |
| `brief` | 任意 | `points`（1〜5）、`audience`、`scope`。sensitive では `audience` と `scope` が必須 |
| `limitations` | 任意 | 文字列の配列 |
| `sources` | 任意 | 情報源の id。sensitive では1件以上。本文の出典も、ここに宣言したものだけ |
| `lastVerifiedAt` | 任意 | `"YYYY-MM-DD"`。sensitive では必須。未来の日付は拒否する |
| `reviewProfile` | 任意 | `standard` / `sensitive`。棚が sensitive のとき、記事側で `standard` には下げられない |
| `review` | 任意 | `by`（著者 id）、`checkedAt`、`scope`、任意の `method`。sensitive では必須 |
| `reviewDueAt` | 任意 | `"YYYY-MM-DD"`。sensitive では必須。過ぎると build が警告し、金額は「再確認中」 |
| `requiresSpecialist` | 任意 | 既定 `false`。`true` のとき、`review.by` の著者に `specialist` が必要。production では欠けると止まり、demo ではその記事を公開から外す |
| `eventAt` | 任意 | ニュースの発生日時 |
| `asOf` | 任意 | ニュースの確認時点 |
| `history` | 任意 | `at`、`type`（`update` / `correction` / `follow-up`）、`note` |
| `products` | 任意 | 商品 id。本文の商品枠も、ここに宣言したものだけ |
| `terms` | 任意 | 用語 id。本文の用語も、ここに宣言したものだけ |
| `nextSteps` | 任意 | 最大3件。`role: primary` は1件、`detour` は2件。`purpose` は intent と同じ語。`reason` は5〜80字。自分自身と非公開記事は指せない |
| `draft` | 任意 | 既定 `false`。`true` は一覧・検索・RSS に出ない |
| `noindex` | 任意 | 既定 `false` |
| `featured` | 任意 | ホームの主記事 |
| `sample` | 任意 | 既定 `false`。同梱サンプルは `true`。production では残っていると build が止まる |
| `commercial` | 任意 | `affiliate` / `sponsored` / `provided` と、任意の `note`。既定はすべて false |

`format` は記事の型、`intent` は読者の目的です。レビューだからといって `intent` に `review` は書きません。

## 12ブロック

本文では、宣言したコンポーネントだけを使います。Markdown の `##` は見出し枠になります。Markdown の表は、横スクロールできる表の器に入ります。

論点帯（この記事で分かること）は、frontmatter の `brief` から出します。本文に `<DecisionBrief>` を書くと build が止まります。

| ブロック | 用途 | 書き方 |
| --- | --- | --- |
| DecisionBrief | 対象・範囲・要点 | 本文には書かない。`brief.points` / `audience` / `scope` |
| Summary | 要点の箇条書き | `<Summary points={["...", "..."]} />` |
| Callout | 注記・注意・補足 | `<Callout kind="warning" title="任意">本文</Callout>`。`kind` は `note` / `warning` / `tip` |
| Steps | 手順 | `<Steps items={[{ title: "...", body: "..." }]} />` |
| Conditions | 条件 | `id` と `title`。`rows` か `product`。`rows` の `source` は frontmatter の `sources` にある id |
| Evidence | 根拠 | `id`、`ids`（情報源 id の配列）、`note`、任意の `method`。`ids` は `sources` に宣言する |
| CompareTable | 比較 | `caption`、`asOf`（`"YYYY-MM-DD"`）、`columns`、`rows`。各行に `label`、`cells`、`basis`（`measured` / `provider` / `editorial` / `estimate`）。`estimate` があると、将来を保証しない一文が出る |
| Table | 表 | Markdown の表。任意で `<table id="...">` |
| ProsCons | よい点と注意 | `<ProsCons pros={["..."]} cons={["..."]} />` |
| ProductBox | 商品・サービス | `<ProductBox id="商品id" />`。frontmatter の `products` に宣言する |
| Faq | 質問と答え | `<Faq items={[{ q: "...", a: "..." }]} />` |
| Term / Cite | 用語と出典 | `<Term id="用語id">表示名</Term>`、`<Cite id="情報源id" />`。それぞれ `terms` と `sources` に宣言する |

別の公開記事への記事面は `<LinkCard to="記事id" />` です。12ブロックの外にある補助です。

条件の数値や商品の金額を、ポップオーバーや薄い文字だけに置きません。本文の条件欄・根拠欄に書きます。

## 用語・情報源・商品

用語は `src/content/glossary/<id>.md` です。

| 項目 | 書き方 |
| --- | --- |
| `term` | 見出し語 |
| `reading` | ひらがな |
| `short` | 10〜120字。補足に出る短い定義 |
| `category` | 任意。棚の id |
| `related` | 任意。ほかの用語 id |
| `article` | 任意。詳しい記事の id |
| `sources` | 任意。情報源 id |
| `sample` | 同梱分は `true` |
| 本文 | 3〜6文 |

情報源は `src/data/sources.yaml` です。`id`、`title`、`url`（http または https）、`publisher`、`checkedAt`（`"YYYY-MM-DD"`）。任意で `publishedAt`、`section`、`note`、`sample`。記事の主張は、情報源の注記だけに書かず、本文か商品データに書き、同じ id で結びます。

商品は `src/data/products.yaml` です。`id`、`kind`（`product` / `service` / `financial-service`）、`name`、`provider`、`description`、`links`（1件以上）。リンクは `url`、`use`（`official` / `editorial`）、`relation`（`none` / `affiliate` / `sponsored`）。料金は `prices`（`amount` は円の整数。未確認は `null` で、0円とは別）、`tax`（`included` / `excluded` / `not-applicable`）、`period`（`once` / `month` / `year` / `transaction`）、`asOf`、`source`。金利は `rates`。条件は `conditions`。`lastVerifiedAt`、`reviewDueAt`、`reviewer` を持ちます。

棚は2〜5個です。`shelf: true` の棚には、重複しない `tabSlot`（1〜5）と `order` が必要です。棚の数や順序を変えたら、識別検査の画面を撮り直します。

## 広告関係の表示

商品 id があるだけでは広告になりません。リンクの `relation` と、記事の `commercial` を別々に書きます。

- 商品リンクに `relation: affiliate` がある記事は、`commercial.affiliate: true`
- `relation: sponsored` がある記事は、`commercial.sponsored: true`
- 無償提供を受けた検証は、`commercial.provided: true`

`true` にした種類の定型文は、`site.disclosure` からタイトル付近へ出ます。広告リンクには `rel="sponsored"` が付きます。テンプレートは表示を助けます。個別の関係が法令や媒体の規約に合うかは、運営者が判断します。

## 検索

`npm run build` が、静的な HTML のあとに Pagefind で索引を作ります。索引は `dist/` に入ります。HTML と索引は同じ release で配ります。開発サーバー（`npm run dev`）では、build 済みの索引は使いません。検索まで確かめるときは `npm run build` のあと `npm run preview` です。

## デプロイ

build コマンド、出力 `dist`、環境変数、ヘッダー、失敗したときの通知、直前のリリースへ戻す手順は [docs/deploy.md](docs/deploy.md) です。

## 識別検査の行い方

セットの形が、色や書体を外しても見分けられるかを人が判定します。判定そのものは、このリポジトリの中ではまだ行われていません。

1. 判定者に渡すのは `docs/identity/kit/` の画像と、同じ名前の回答用紙だけです。`docs/identity/kit/answers.md` は答えなので、判定者には渡しません。
2. 判定者は5名以上、うち制作者以外を3名以上にします。
3. 結果は `docs/identity/2026-10-08-impl.md` の表に書きます。合格の基準もそのファイルにあります。
4. 実装を撮るときは、`DD_INSPECT=1` を付けて build し、`npm run test:identity` を実行します。終わったら `DD_INSPECT` を外して build し直し、通常の出力に検査モードが残っていないことを確かめます。

読み上げ（NVDA または VoiceOver）の手順は [docs/qa/a11y.md](docs/qa/a11y.md) の末尾です。

## 対応ブラウザ

確認は人が実機で行います。版が分かったら、下の表の「確認した版」に書きます。自動検査（Playwright の Chromium）は、この表の実機確認には数えません。

| ブラウザ | 対応 | 確認した版 | 確認日 | 確認した人 |
| --- | --- | --- | --- | --- |
| iOS Safari | 主要画面と操作（ホーム、記事、検索、用語の補足、保存、表示設定） |  |  |  |
| Android Chrome | 上と同じ |  |  |  |
| Windows Chrome | 上と同じ |  |  |  |
| Windows Edge | 上と同じ |  |  |  |
| macOS Safari | 上と同じ |  |  |  |
| Firefox | 上と同じ |  |  |  |

確認した版だけを対応の根拠にします。

## 保存データ

あとで読むと、続きから読む位置は、そのブラウザの中だけに残ります。サーバーへは送りません。

| 種類 | 上限 | 消えるとき |
| --- | --- | --- |
| あとで読む | 200件。超えると、保存が古いものから外れる | 保存一覧で1件ずつ削除するか、「すべて削除」 |
| 続きから読む | 50記事。超えると、位置の記録が古いものから外れる | 180日より古い位置は捨てる |

JavaScript が動かないブラウザでは、保存した一覧は表示しません。

## ライセンス

テンプレート本体は [LICENSE](LICENSE) の MIT License です。依存パッケージ、書体、画像は [docs/licenses.md](docs/licenses.md) にまとめてあります。

## コマンド

| コマンド | 動作 |
| --- | --- |
| `npm ci` | ロックファイルどおりに依存を入れる |
| `npm run dev` | 開発サーバー |
| `npm run build` | 検査、静的 build、検索の索引 |
| `npm run preview` | build 結果をローカルで見る |
| `npm run check` | 型と Astro の検査 |
| `npm test` | 単体テスト |
| `npm run test:e2e` | ブラウザの操作テスト。先に `npm run build` |
| `npm run verify` | lint、単体、build、E2E |
| `npm run build:demo` | 6通りの比較デモ |
