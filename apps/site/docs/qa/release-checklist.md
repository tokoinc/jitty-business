# リリース前の最終確認（5.5）

工程22の時点。テンプレートとして配る段階で確かめられるものと、人が本番のリポジトリで行うものを分けている。2026-10-28 に、セットを Tally・Answer・Figure・Inline の4つに入れ替えた（Binder・Board・Spread は削除）。セットに関わる行は、4セットで確かめ直した。

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 要点・条件と根拠・次に確かめるが、Tally / Answer / Figure / Inline で成立している | ✅ 自動 / ⏳ 検査F | 4セットそれぞれの記事の E2E（目次、条件、根拠）。4セットの構造は `docs/qa/structure-*.json`。検査Fの成功率は人が判定する（回答用紙は `scripts/build-identity-kit.mjs` で作る） |
| 4セットが識別検査 A〜F に合格し、記録がある。陰性対照と同じ構図の画面がない | ⏳ 人 | 回答用紙はまだ作っていない（`DD_INSPECT=1` の build で `npm run test:identity`、陰性対照を `docs/identity/negative-control/` に置き、`node scripts/build-identity-kit.mjs`）。結果の表は `docs/identity/2026-10-28-impl.md`（判定前） |
| 9つのシグネチャ枠が4画面に描画され、形の予約に違反する部品がない | ✅ | `tests/identity/signature.spec.ts`。形の予約は各セットの README。広告に `data-sig` は付いていない |
| Core と、採用した Optional が完成条件を満たしている | ✅ | 12ブロックはスタイルガイドと8通り（4セット × 2質感）の build。保存・続きから読む・用語の補足は E2E（工程20b） |
| 主候補最大1件、補助最大2件。理由があり、候補がゼロでも成立する | ✅ | `tests/unit/related.test.ts`。`nextSteps` の検査は工程5 |
| 4セット × 質感2 × 明暗2、OS 追従、機能 OFF を確認した。flat の本番はリアルの層を取得しない | ✅ | 8通りの `check-output`。明暗の追従と再読み込みは `tests/e2e/flows.spec.ts`。flat の出力に `--m-` が無いことは check-output |
| `design.designSet` と `design.finish` の変更と再 build で、全ページと12ブロックが切り替わる | ✅ | 8通りの build。セット専用の記事は無い |
| 本番ページが未選択セットの資産を取得しない。本番 build に識別検査モードと比較デモが無い | ✅ | check-output の接頭辞。`DD_INSPECT` なしの build は `.dd-inspect` が 0。通常の `dist/` に `/demo/` は無い（工程21） |
| 比較デモの生成条件、noindex、検索と sitemap の分離 | ✅ | `npm run build:demo`（4セット × 2質感、2026-10-28）。HTML 369件がすべて noindex。デモは `dist-demo/demo/` だけ（工程21） |
| JS なし、未対応機能、保存不能、通信失敗で行き止まりがない | ✅ | E2E。JS なしで本文・目次・条件・根拠が読める。ストレージ拒否で通知。Pagefind の失敗で「読み込めませんでした」（工程20b） |
| 本番の出力・検索・RSS・sitemap・JSON に、下書きと未来の記事が出ない | ✅ 検査 / ⏳ 本番URL | `isPublished` の単体テスト。人物記事を draft にすると RSS から外れる（工程14）。このリポジトリの production build は、サンプルが残っているため HTML を出す前に止まる |
| 対象・範囲、費用と金利の単位と条件、基準日・確認日・担当、根拠、広告、訂正窓口が実態に合っている | ⏳ 人 | 同梱は架空のサンプル。本番の文言と実データへの置き換えは、別リポジトリで人が行う（工程21） |
| L1〜L3 と 375px でも4セットの違いが残り、記事型を替えても必要な情報が欠けない | ✅ 寸法と撮影 / ⏳ 見た目 | L1・L2・L3 は `docs/identity/{set}-{finish}/`。375px の E2E。見た目の識別は検査 A〜E |
| 期限超過の表示、再 build、失敗通知、本番のサンプル除外 | ✅ 表示と除外 / ⏳ 通知の受け取り | 期限切れは警告し、金額は「再確認中」（工程5・19）。定期 build は `.github/workflows/scheduled-build.yml`。戻す手順は `docs/deploy.md`。通知の受け取り先と、戻す操作の実地は人が行う。production は `sample: true` が残ると止まる（工程21） |
| 設定の URL と全出力が一致し、example.com や仮の送信先が残っていない | ✅ 検査 / ⏳ 本番URL | demo の URL は `https://example.com` のまま（テンプレートの既定）。production は example.com と空の連絡先で止まる（工程21） |
| 新規展開、編集、更新、障害時の復旧 | ✅ ローカルの導入 / ⏳ 人 | `.tmp/onboarding` で README の手順（`npm ci`、`npm run dev`、セットと質感の変更、記事追加、`npm run build`）。制作者以外の確認、通知の受け取り、直前リリースへ戻す実地は人が行う。編集は `src/content` と `src/data`。復旧手順は `docs/deploy.md` |
| 読者向けのセットと質感の切替が無く、読者が選べるのは明暗と文字サイズだけ | ✅ | 切替は `sites/<slug>/site.json` の `design` と再 build。表示設定は明暗と文字サイズ（E2E） |
| `docs/progress.md` に工程0〜22の完了がある | ✅ | `docs/progress.md` の工程0〜22 |

## 1.3 から残っている未達

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| 検索の Performance と CLS | ❌ | `docs/qa/performance.md`（2026-10-28）。検索の Performance は Tally 93 / Answer 100 / Figure 96 / Inline 86。CLS は 0.168 / 0.026 / 0.113 / 0.280（目標 0.05 以下を満たすのは Answer だけ） |
| 実ユーザーの Core Web Vitals | ⏳ | フィールドデータは無い |
| 読み上げ（NVDA / VoiceOver） | ⏳ 人 | `docs/qa/a11y.md` の手順 |
| 実機のブラウザ | ⏳ 人 | README の対応ブラウザ。確認した版は空 |
| GitHub への公開と、テンプレートとしての利用 | ⏳ 人 | `npm create astro@latest -- --template <github-user>/decision-desk-template` |
| 手順だけで起動でき、依存取得のあと5分以内 | ✅ ローカル / ⏳ 制作者以外 | `npm ci`（17秒）のあと、`npm run dev` は ready in 2067 ms。ホームは 200、title は Decision Desk。制作者以外の確認は未実施 |
