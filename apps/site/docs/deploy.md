# デプロイ

このリポジトリは配布用のテンプレートである。サンプルの記事・用語・著者・情報源・商品は残す。本番の公開は、テンプレートから作った別のリポジトリで、人が行う。

静的なファイルを配る。build のあと、HTML は自動では書き換わらない。確認期限を過ぎた条件の縮退表示（「再確認中」）は、次の build を配るまで古い HTML のまま残る。週1回の定期 build はそのためにある。日次にしたときは、予約した公開は予定日時のあと、次の build で出る。時刻を保証するなら、その時刻に合うスケジュールにする。

## 環境変数

| 名前 | 本番 | このテンプレートの既定 |
| --- | --- | --- |
| `DD_MODE` | `production` | `demo`（全ページ noindex。サンプルを許可） |
| `DD_SITE_URL` | `https://` から始まる本番の URL | `https://example.com`（production では build が止まる） |

ホスティングの build 環境に、この2つを置く。`site.config.ts` の `organization`・`contact`・`disclosure` は、本番のリポジトリで実態に合わせて書き換える。サイト名・キャッチ・説明・置き場所（`base`）・セットと質感（`design`）は、サイトごとに `sites/<slug>/site.json` に書く。

`DD_MODE=production` の build は、次のどれかがあると止まる。

- `site.url` に `example.com` / `example.org` / `example.net` が残っている
- `contact.email` と `contact.formUrl` が両方空
- `sample: true` の記事・用語・著者・情報源・商品が残っている
- `DD_INSPECT=1`（識別検査モード）

連絡先のページを置いただけでは、フォームは送信されない。`contact.email` か、送信できる `contact.formUrl`（https）を設定する。

Node.js は `.nvmrc` の版（22.12 以上の偶数版）。

## build

| 項目 | 値 |
| --- | --- |
| コマンド | `npm run build` |
| 出力 | `dist` |
| インストール | `npm ci` |

`npm run build` は、禁止プロパティの検査、`astro check`、静的 build、Pagefind、`check-output` の順で行う。検索の索引は HTML と同じ `dist/` に入る。配るときはこの一式を同じリリースにする。HTML だけ先に出すと、検索が古い索引を読む。

比較デモは本番の build には入らない。`dist/` に `/demo/` は無い。

## 比較デモ

```sh
npm run build:demo
```

`dist-demo/demo/` に、7セット × 2質感と、索引の `index.html` ができる。すべて noindex。Pagefind・sitemap・RSS は各デモの中だけにあり、本番の `dist/` には混ざらない。識別検査モード（`?inspect=L2`）はデモの build にだけ入る。

置く場所は本番とは別（デモ用のサブドメインなど）にする。本番のサイトの公開ディレクトリに `dist-demo` を混ぜない。

## ヘッダー

`public/_headers` が `dist/_headers` にコピーされる。Cloudflare Pages と Netlify は、出力のルートにあるこのファイルを読む。複数のサイトを並べるリポジトリのルートの `npm run build:all` は、この規則を各サイトの置き場所（`/` と `/<slug>/`）ごとに並べ直した `dist/_headers` を1つ作る。

| パス | キャッシュ |
| --- | --- |
| `/_astro/*` | 1年、`immutable`（ファイル名にハッシュがある） |
| それ以外（HTML を含む） | `max-age=0, must-revalidate` |
| `/pagefind/*` | 再検証。索引の固定名ファイルに `immutable` を付けない |
| `/rss.xml`・`/sitemap.xml` | 再検証 |

全パスに次を付ける。

- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Content-Security-Policy: frame-ancestors 'none'`

スクリプトとスタイルの CSP は、このヘッダーには書かない。Astro が各 HTML の meta 要素に、そのページのハッシュを出す（`docs/adr/0013-csp.md`）。ヘッダーと meta は両方が効く。ヘッダー側の `script-src` にハッシュが無いと、明暗の初期化スクリプトが止まる。`frame-ancestors` は meta では無視されるので、ヘッダーだけに置く。

`dev`（`npm run dev`）では Astro の CSP は効かない。確かめるときは `npm run build` のあと `npm run preview` を使う。

### Cloudflare Pages

- ビルドコマンド: `npm run build`
- ビルド出力: `dist`
- 環境変数: `DD_MODE`、`DD_SITE_URL`
- ヘッダー: `dist/_headers` をそのまま読む。追加の設定は要らない
- 戻す: Workers & Pages → プロジェクト → Deployments で、直前の成功したデプロイを Rollback

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- 環境変数: `DD_MODE`、`DD_SITE_URL`
- ヘッダー: 公開ディレクトリの `_headers` を読む
- 戻す: Deploys で直前の公開を Publish deploy する

### Vercel

`_headers` は読まない。プロジェクトの設定で、Build Command を `npm run build`、Output Directory を `dist` にする。環境変数は同じ。

ヘッダーは `vercel.json` に書く。リポジトリには置いていない（ホスティングが未定のため）。選んだら、次を本番リポジトリに足す。`/_astro/` だけ長期キャッシュにし、ほかは再検証する。CSP の `script-src` は書かない。

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { "key": "Content-Security-Policy", "value": "frame-ancestors 'none'" }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/pagefind/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

戻す: Deployments で直前のデプロイを Promote to Production する。

## build の失敗

`.github/workflows/verify.yml` は、push と pull request で `npm run verify`（lint、単体、build、E2E）を行う。失敗すると、そのコミットは緑にならない。

`.github/workflows/scheduled-build.yml` は、毎週月曜 09:00（日本時間）に `npm run build` を行う。失敗すると、その workflow の実行が失敗になる。GitHub の通知で分かるようにするには、リポジトリの Watch で Actions の失敗を受け取る。受け取り先の確認は人が行う。

このテンプレートの定期 build は、既定の demo のままである。`DD_MODE=production` にすると、サンプルが残っているため毎回失敗する。本番のリポジトリでは、ホスティングと同じ `DD_MODE` と `DD_SITE_URL` を workflow の `env` に足す。

デプロイのフックは任意である。リポジトリの Actions シークレット `DEPLOY_HOOK_URL` があるときだけ、定期 build の成功後にその URL へ POST する。無いときは何もしない。フックの URL はログに出さない。

ホスティング側の build 失敗メール（Cloudflare、Netlify、Vercel の通知設定）も、本番のリポジトリで有効にする。

build や配布に失敗すると、すでに出ているページは残る。担当者が修正して再配布するか、ホスティングの画面でそのデプロイを取り下げる。古い配信が残る時間は、失敗に気づいてから戻すまでの時間である。
