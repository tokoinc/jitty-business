# 1.3 完成の定義

工程20c の時点。根拠はパスか、工程の記録。人の判定が残るものは ⏳。2026-10-28 に、セットを Tally・Answer・Figure・Inline の4つに入れ替えた（Binder・Board・Spread は削除）。セットに関わる行は、4セットで確かめ直した。

## 識別性

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 識別検査 A〜F に合格し、記録がある | ⏳ 人 | 回答用紙はまだ作っていない（`scripts/build-identity-kit.mjs`）。結果の表は `docs/identity/2026-10-28-impl.md`（判定前） |
| L2 で4画面が同じ媒体に見え、汎用テンプレートと混同されない | ⏳ 人 | L2 は `docs/identity/{set}-{finish}/screen-*-L2.png`。検査A・E |
| 9枠のすべてに、そのセットの原形の形がある | ✅ | 各セットの README の9枠。4画面で宣言した枠が空でないことは `tests/identity/signature.spec.ts` |
| 形の予約を守っている | ✅ | 各セットの README の「形の予約」（Tally のマスは数と進み具合と現在地、Answer の判定の札は条件と答え、Figure の朱の数字は記事の数と締切、Inline の小さな図は数と進み具合と範囲）。商品枠は文字ラベル（工程7b）。広告に `data-sig` は付いていない |
| 375px でも原形と3領域が残り、索引・本文・条件へ届く | ✅ 自動 / ⏳ 見た目 | 375px の L2 を撮影。E2E は索引の開閉と、目次・条件・根拠への移動（工程20b）。形が残るかの最終判断は検査E |
| 陰性対照と同じ構図が無い。セット間は 2.9 の差 | ⏳ 人 | 陰性対照は `docs/identity/negative-control/`。検査A〜D に混ぜてある |
| 形が読みやすさ・条件の発見・操作を下げていない（検査F） | ⏳ 人 | 検査Fの回答用紙（`scripts/build-identity-kit.mjs` で作る） |
| flat と real で L1・L2 の配置と輪郭が一致する | ✅ 寸法 / ⏳ 見た目 | `tests/identity/finish.spec.ts` は `[data-sig]` の差が 1px 以内。見た目は `docs/identity/{set}-{finish}/` |
| real でも forced-colors・印刷で読みやすい表示に戻る | ✅ | `finish.spec.ts`。すりガラスと影が外れる。`a11y-record` は forced-colors でも main と h1 が残る |

## 設計・使いやすさ

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 目的、条件、根拠、次に確認する内容を見つけられる | ✅ 自動 / ⏳ 検査F | 記事の E2E（目次、条件、根拠）。検査F が成功率 |
| designSet の変更で全ページと12ブロックが切り替わる | ✅ | 6通りの build（工程20a、20c）。セット専用の記事は無い |
| 目次、検索、一覧へ戻る。補足を閉じると操作位置へ戻る | ✅ | `tests/e2e/flows.spec.ts` |
| 次の記事は主候補最大1、補助最大2。ゼロでも成立 | ✅ | `tests/unit/related.test.ts`。候補が無い記事もある |
| 空の論点帯・条件・根拠を穴埋めに出さない。空のシグネチャ枠を出さない | ✅ | シグネチャ試験は、幅と高さが 0 より大きい枠に文字・子要素・`aria-label` があることを要求する。読みかけは `hidden` |
| ニュースや論考に、商品購入や一つの結論を機械的に要求しない | ✅ | ニュースと人物記事に ProductBox は無い（工程19b のブロック表） |

## 編集・数値・運用

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 公開日、更新日、最終確認日、発生日を意味に合わせて出す | ✅ | 記事ヘッダー。ニュースは発生と確認時点（工程19b） |
| 日付の自動更新で鮮度を装わない | ✅ | 表示は frontmatter の日付。`DD_BUILD_TIME` で本文の日付は更新しない |
| 影響が大きい記事で、対象・範囲・根拠・担当・確認日がそろう | ✅ | 社会保険の記事の brief、sources、review。検査は工程5 |
| 監修は役割があるときだけ | ✅ | サンプルに監修者は出していない |
| 金額・金利・手数料・試算に単位・期間・条件・情報源が付く | ✅ | 比較記事と `products.yaml`。工程19b の状態の表 |
| 基準が違う比較を検出し、換算したときは方法を示す | ✅ | CompareTable の根拠の種類。試算には将来を保証しない一文（工程7b） |
| 商品、広告リンク、記事の広告関係を別に管理する | ✅ | `products.yaml` と記事の `commercial`。`data-ad` は check-output |
| 編集者がコードを変えずに記事・条件・根拠・推薦理由を更新できる | ✅ | `src/content` と `src/data`。推薦理由は `nextSteps.reason` |
| 更新期限と、期限超過の表示・再確認 | ✅ | `reviewDueAt`。期限切れは警告し、金額は「再確認中」 |

## 品質・汎用性

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| モバイル Lighthouse。Performance 90、Accessibility 100、Best Practices / SEO 95（未達は理由） | ❌ 検索の Performance と CLS / ✅ 他 | `docs/qa/performance.md`。ホームと記事は Performance 100、Accessibility 100、Best Practices 100。検索は Accessibility 100、Performance は 81 / 90 / 89。SEO 66 は demo の noindex |
| ラボ目標 LCP 2.0秒、CLS 0.05、TBT 200ms | ❌ 検索の CLS | ホームと記事は満たす。検索の CLS は 0.413 / 0.206 / 0.227。原因は性能の記録 |
| 実ユーザーの Core Web Vitals | ⏳ | フィールドデータは無い |
| 初期 JS 20KB、CSS 30KB（real は 38KB）gzip | ✅ | JS 3924 bytes。CSS は性能の記録。すべて予算内 |
| check、lint、単体、E2E、axe | ✅ | `npm run verify`（2026-10-08）。lint エラー 0。単体 9 files・41 tests。E2E は 70 passed、2 skipped。axe は工程20b の対象ページ |
| キーボード、読み上げ、ズーム | ✅ キーボードとズーム / ⏳ 読み上げ | `docs/qa/a11y.md` |
| JS なしで本文、目次、用語、根拠、商品リンク | ✅ | E2E の `javaScriptEnabled: false`（工程20b） |
| スタイルガイドと主要画面。未選択セットの資産を取得しない | ✅ | check-output の接頭辞。スタイルガイドは工程15・18 |
| 不明なセット、契約版、必須トークン、編集上の必須不足を build で検知 | ✅ | 工程2・5。production はサンプルと連絡先で止まる（工程20a） |
| セットを変えても URL、見出し ID、公開状態、検索、保存の意味が変わらない | ✅ | 構造比較 `docs/qa/structure-*.json`。保存キーは `site.storage.namespace` |
| 機能 OFF で専用 UI と JS が消え、通常リンクは残る | ✅ | `site.features`。用語はリンクが残り、補足ボタンは OFF で出さない（工程11） |
| 空データ、長文、削除記事、保存不能、通信失敗でも閲覧できる | ✅ | E2E の障害系（工程20b）。空の目的ページは工程8 |
| 手順だけで起動でき、依存取得後5分以内 | ✅ ローカル / ⏳ 制作者以外 | 工程22。`.tmp/onboarding` で README の手順。`npm ci` のあと `npm run dev` は ready in 2067 ms。ホームは 200。制作者以外の確認は未実施 |

## 工程20の完了条件

| 条件 | 状態 |
| --- | --- |
| `npm run verify` | ✅ lint エラー 0、単体 41、build の check-output OK（識別検査モードなし）、E2E 70 passed / 2 skipped。2026-10-28 の4セットでは、lint エラー 0、単体 53、E2E は各セット 76 passed / 2 skipped |
| 8通りの check-output | ✅ 2026-10-28。`DD_INSPECT=1` の8通り（4セット × flat・real）と、検査モードなしの4セットの flat |
| 4セットの構造比較 | ✅ 2026-10-28。`docs/qa/structure-*.json`（`tests/e2e/structure.spec.ts`） |
| 性能・a11y・識別検査の記録と、1.3 | 記録はある。上の ❌ と ⏳ が残る |
