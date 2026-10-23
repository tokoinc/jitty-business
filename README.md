# jitty-business

business.jitty.jp の下に並べる、ジャンル別のメディアです。どのサイトも、同じ Astro アプリ（`apps/site`）から build します。サイトごとに違うのは、名前・記事・data・企画メモだけで、それらは `sites/<slug>/` に置きます。

## フォルダ

```
apps/
  site/                 共通の Astro アプリ（Decision Desk テンプレート）
  tenshoku-dokuritsu/   「独立か、転職か。」独自に改修したアプリ（共通アプリとは別）
sites/
  <slug>/
    site.json           サイトの名前・キャッチコピー・説明
    content/            記事（articles/<id>/index.mdx）・著者・用語
    data/               棚（categories）・タグ・連載・情報源・商品・ホームの問い（questions.ts）
    ideas/              記事の切り口のメモ（build には使わない）
  tenshoku-dokuritsu/
    docs/               企画書・サイト設計書・記事リスト・記事管理表
scripts/                build-all.mjs（全サイトの build）、site.mjs（1サイトで npm script を動かす）
dist/                   build:all の出力（git の対象外）
```

## サイト

| slug | 名前 | URL | 切り口のメモ |
| --- | --- | --- | --- |
| `advisors` | 税理士・社労士の紹介 | https://business.jitty.jp/advisors/ | 4 |
| `ai` | 生成AI導入・AIツール・AI研修 | https://business.jitty.jp/ai/ | 4 |
| `benefits` | 福利厚生・食事補助 | https://business.jitty.jp/benefits/ | 3 |
| `bpo` | BPO・オンラインアシスタント・経理代行 | https://business.jitty.jp/bpo/ | 4 |
| `cybersecurity` | サイバーセキュリティ | https://business.jitty.jp/cybersecurity/ | 4 |
| `funding` | 資金調達 | https://business.jitty.jp/funding/ | 4 |
| `hr-cloud` | 給与・勤怠・労務のクラウド | https://business.jitty.jp/hr-cloud/ | 4 |
| `recruiting` | 採用支援 | https://business.jitty.jp/recruiting/ | 4 |
| `store-dx` | 省人化・店舗DX | https://business.jitty.jp/store-dx/ | 4 |
| `succession` | M&A・事業承継 | https://business.jitty.jp/succession/ | 4 |
| `tenshoku-dokuritsu` | 独立か、転職か。 | https://business.jitty.jp/dokuritsu-tenshoku/ | — |

記事・data は、どのサイトもまだテンプレートのサンプル（`sample: true`）のままです。

## コマンド

リポジトリのルートで実行します。依存は npm workspaces で、ルートの `node_modules` に1つだけ入ります。

```sh
npm ci                          # 依存を入れる（Node は .nvmrc の版）
npm run site -- ai dev          # ai を開発サーバーで開く（http://localhost:4321/ai/）
npm run site -- ai build        # ai だけ build する（apps/site/dist）
npm run build:all               # 全サイトを dist/<base>/ に build する
npm run build:all -- ai bpo     # 指定したサイトだけ build する
npm run verify                  # lint・単体テスト・build・e2e
```

`npm run dev` は advisors を開きます。どのサイトで動かすかは、環境変数 `DD_SITE`（slug）で決まります（`npm run site` が設定します）。`SITE` は Astro が使う名前なので使いません。

e2e は base が `/` のときだけ通ります（テストが `/search/` のように書かれているため）。`npm run verify` は `DD_BASE=/` を付けて動かします。

## 新しいサイトを足す

1. `sites/advisors/` を `sites/<slug>/` にコピーする（`ideas/` は消す）。
2. `sites/<slug>/site.json` の `slug`・`name`・`tagline`・`description` を書き換える。URL（`https://business.jitty.jp/<slug>/`）、base、保存データの名前、編集部の名前は slug と name から作られる。
3. `content/` と `data/` を、そのサイトの記事に入れ替える。
4. `npm run site -- <slug> build` で通ることを確かめる。

URL・base などを1サイトだけ変えたいときは、`DD_SITE_URL`・`DD_BASE` などの環境変数で上書きできます（`apps/site/src/site.config.ts`）。

## 共通アプリ（apps/site）

記事の書き方とテンプレートの運用ルールは `apps/site/AGENTS.md`、画面と設定は `apps/site/README.md`、本番の公開は `apps/site/docs/deploy.md` にあります。

取り込み元は [tokoinc/decision-desk-template](https://github.com/tokoinc/decision-desk-template)（e3b14b6）です。手元の `decision-desk-template/` は別リポジトリなので、このリポジトリでは管理しません（`.gitignore`）。テンプレートの更新を取り込むときは、差分を `apps/site` に当てます。

## tenshoku-dokuritsu

部品を独自に改修しているので、共通アプリとは別のアプリ（`apps/tenshoku-dokuritsu`）です。記事は `apps/tenshoku-dokuritsu/src/content/` にあります。`npm run verify` では lint と単体テストだけを動かします。e2e の構造比較（`tests/e2e/structure.spec.ts`）は、改修したホームのリンクがセットごとに違うため、いまは通りません。
