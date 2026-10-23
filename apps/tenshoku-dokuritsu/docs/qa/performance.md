# 性能の記録（5.1）

## 測り方

| 項目 | 値 |
| --- | --- |
| 日 | 2026-10-08 |
| Node | v24.19.0 |
| Lighthouse | 13.5.0（devDependency） |
| Chrome | Playwright の Chromium（`CHROME_PATH` が無いときの `ms-playwright`） |
| フォームファクター | mobile |
| スロットリング | simulate（Lighthouse のモバイル既定） |
| 回数 | 各ページ 3 回の中央値 |
| サーバー | `npm run preview`（`DD_INSPECT` なしの静的 build） |
| ページ | ホーム `/`、記事 `/articles/sample-social-insurance/`、検索 `/search/?q=保険料` |

測った構成は binder-flat、board-real、spread-real。生の3回は `docs/qa/performance-{set}-{finish}.json`。

スコアは 0〜1 を百分率にした。LCP はミリ秒、CLS はそのまま、TBT はミリ秒。

## 中央値

### binder / flat

初期 JS gzip 3924 bytes。CSS gzip 8921 bytes（予算 30KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1211 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1061 | 0.022 | 0 |
| 検索 | 81 | 100 | 100 | 66 | 1211 | 0.413 | 0 |

### board / real

初期 JS gzip 3924 bytes。CSS gzip 11499 bytes（予算 38KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1213 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1134 | 0.011 | 0 |
| 検索 | 90 | 100 | 100 | 66 | 1208 | 0.206 | 0 |

### spread / real

初期 JS gzip 3924 bytes。CSS gzip 12142 bytes（予算 38KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1210 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1135 | 0.009 | 0 |
| 検索 | 89 | 100 | 100 | 66 | 1210 | 0.227 | 0 |

残りの3通りの gzip は工程20a（CSS は今回変えていない）。初期 JS は同じく 3924 bytes。

| 構成 | CSS gzip |
| --- | --- |
| binder / real | 11430 |
| board / flat | 9256 |
| spread / flat | 9916 |

`DD_INSPECT=1` の build は `inspect.css` が足され、CSS が約 200 bytes 増える。上の予算の数は、検査モードの無い build。

## 目標との差

- 初期 JS 20KB 以下、CSS は flat 30KB / real 38KB 以下。すべて満たす。
- LCP 2.0秒以下、TBT 200ms 以下。ホーム・記事・検索とも満たす。
- CLS 0.05 以下。ホームと記事は満たす。検索は満たさない。狭い幅では条件の列が結果の後にあり、Pagefind が結果を入れたときにその列が下へ動く。Binder の実測では、動かした要素は `aside.bi-flags`。
- Performance 90 以上。ホームと記事は 100。検索は Binder 81、Board 90、Spread 89。検索の未達は、上の CLS がスコアを下げている。
- Accessibility 100。3構成の3ページとも 100。検索結果の題は、h1 の次が h3 だったので h2 にした（`FaceTemplates.astro`）。直す前の Binder の検索は 98 だった。
- Best Practices 100（目標 95）。
- SEO 66。demo は全ページ noindex のため `is-crawlable` が落ちる。本番の索引は、production の build で noindex を外したときに見る（工程21）。未達の理由はこれ。
- 実ユーザーの Core Web Vitals は測っていない。⏳
- Web フォントの別リクエストは、初期の HTML から追加していない。広告と解析も入れていない。
