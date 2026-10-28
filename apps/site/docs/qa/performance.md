# 性能の記録（5.1）

## 測り方

| 項目 | 値 |
| --- | --- |
| 日 | 2026-10-28 |
| Node | v22.22.0 |
| Lighthouse | 13.5.0（devDependency） |
| Chrome | Playwright の Chromium（`CHROME_PATH`） |
| フォームファクター | mobile |
| スロットリング | simulate（Lighthouse のモバイル既定） |
| 回数 | 各ページ 3 回の中央値 |
| サーバー | `npm run preview`（`DD_INSPECT` なしの静的 build） |
| ページ | ホーム `/`、記事 `/articles/sample-social-insurance/`、検索 `/search/?q=保険料` |

測った構成は4セットの flat（`node scripts/record-performance.mjs <set> flat`）。生の3回は `docs/qa/performance-{set}-{finish}.json`。Binder・Board・Spread の記録（2026-10-08）は、セットと一緒に削除した。

スコアは 0〜1 を百分率にした。LCP はミリ秒、CLS はそのまま、TBT はミリ秒。

## 中央値

### tally / flat

初期 JS gzip 3983 bytes。CSS gzip 11489 bytes（予算 30KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1387 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1247 | 0.017 | 0 |
| 検索 | 93 | 100 | 100 | 66 | 1242 | 0.168 | 0 |

### answer / flat

初期 JS gzip 3983 bytes。CSS gzip 11257 bytes（予算 30KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1389 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1250 | 0.017 | 0 |
| 検索 | 100 | 100 | 100 | 66 | 1234 | 0.026 | 0 |

### figure / flat

初期 JS gzip 3983 bytes。CSS gzip 10693 bytes（予算 30KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1246 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1237 | 0.015 | 1 |
| 検索 | 96 | 100 | 100 | 66 | 1259 | 0.113 | 0 |

### inline / flat

初期 JS gzip 3983 bytes。CSS gzip 11031 bytes（予算 30KB）。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ホーム | 100 | 100 | 100 | 66 | 1377 | 0 | 0 |
| 記事 | 100 | 100 | 100 | 66 | 1243 | 0.015 | 0 |
| 検索 | 86 | 100 | 100 | 66 | 1263 | 0.280 | 0 |

real の CSS gzip は、識別検査の build（`DD_INSPECT=1`。`inspect.css` の約 200 bytes を含む）で次のとおり。予算は 38KB。

| 構成 | CSS gzip |
| --- | --- |
| tally / real | 13247 |
| answer / real | 12848 |
| figure / real | 12168 |
| inline / real | 12395 |

上の中央値の表の予算の数は、検査モードの無い build。

## 目標との差

- 初期 JS 20KB 以下、CSS は flat 30KB / real 38KB 以下。すべて満たす。
- LCP 2.0秒以下、TBT 200ms 以下。ホーム・記事・検索とも満たす。
- CLS 0.05 以下。ホームと記事は4セットとも満たす。検索は Answer が満たし、Tally・Figure・Inline は満たさない（Tally 0.168、Answer 0.026、Figure 0.113、Inline 0.280）。狭い幅では確かめる領域が結果の後にあり、Pagefind が結果を入れたときに下へ動く。Lighthouse が挙げた要素は、Tally と Inline が `aside.ta-side`・`aside.il-side`、Figure と Answer が aside の中の条件群（`details.fi-filters__group`・`details.an-filters__group`）。Binder・Board・Spread でも同じ未達だった。
- Performance 90 以上。ホームと記事は 100。検索は Tally 93、Answer 100、Figure 96、Inline 86。検索の未達は、上の CLS がスコアを下げている。
- Accessibility 100。4構成の3ページとも 100。
- Best Practices 100（目標 95）。
- SEO 66。demo は全ページ noindex のため `is-crawlable` が落ちる。本番の索引は、production の build で noindex を外したときに見る（工程21）。未達の理由はこれ。
- 実ユーザーの Core Web Vitals は測っていない。⏳
- Web フォントの別リクエストは、初期の HTML から追加していない。広告と解析も入れていない。
