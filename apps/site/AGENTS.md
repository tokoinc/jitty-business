# AGENTS.md — Decision Desk

記事の追加と、テンプレートの運用で守ること。導入と画面の手順は README.md。設計契約を実装から変えるときだけ、docs/spec/manual-v3.2.md を読む。通常の記事追加では、手順書は読まない。

## 記事型と読者の目的

`format` は記事の型、`intent` は読者の目的。混ぜない。`intent` に `review` は無い。

| format | 意味 |
| --- | --- |
| `guide` | 解説 |
| `tutorial` | 実務・手順 |
| `comparison` | 比較 |
| `news` | ニュース |
| `opinion` | 論考 |
| `interview` | 人物 |

| intent | 意味 |
| --- | --- |
| `learn` | 知る |
| `compare` | 比べる |
| `choose` | 選ぶ |
| `do` | 実行する |
| `solve` | 困りごとを解く |

記事型と `reviewProfile` は、セットや質感で変えない。ニュースや論考に、商品購入や一つの結論を機械的に要求しない。

## 対象・条件・根拠・確認日

- 読者が何を、どの範囲で確かめられるかを、`brief.audience` と `brief.scope` に書く。sensitive の記事（お金の棚、または記事の `reviewProfile: sensitive`）では必須。
- 条件は `<Conditions>`、根拠は `<Evidence>` と `<Cite>`。確かめる領域は本文への入口であり、条件と出典の唯一の置き場所にしない。
- 本文で使う用語 id は `terms`、情報源 id は `sources`、商品 id は `products` に宣言する。宣言の無い id を本文に書くと build が止まる。
- 情報源は `src/data/sources.yaml`。`checkedAt` は、その資料を見た日であり、参照している全記事を再確認した意味にはしない。記事の `lastVerifiedAt` と `review` は、その記事の確認記録。
- 重要な数値と条件は、情報源の `note` だけに置かない。本文か商品データに書き、情報源 id で結ぶ。
- 確認日は `"YYYY-MM-DD"` を引用符で囲む。日時は `"2026-10-01T09:00:00+09:00"` を引用符で囲む。
- 仕事・キャリアでは、対象者、働き方、地域、調査時点、体験者の立場を書く。事業では、規模、利用条件、料金の周期、追加費用、一般化の限界を書く。金融では、対象地域、対象者、確認日、手数料・金利・期間、対象外、一次の根拠を書く。ニュースでは、発生日、確認時点、一次の発表、未確定、続報を分ける。論考では、事実と見解、評価の軸、反対の点、広告関係を分ける。

## 数値の精度と丸め

- 費用・金利・税・制度の数値には、単位、期間、基準日、適用条件、情報源を付ける。
- 月額と年額、税込と税別、固定と変動、初年度と通常時を区別する。換算するときは、元の条件、式、丸め方を本文に書く。
- 金額の `amount: null` は未確認。0円とは別。表示は「未確認」になる。
- 表示の整形は `src/utils/numbers.ts` が行う。円は桁区切りを付けるだけで、端数は丸めない。金利は `min` と `max` を、書いた桁のまま出す。
- 試算は、入力、式、対象範囲、除いた費用、丸めを示す。将来の値を確定した結果として出さない。`<CompareTable>` の `basis: estimate` は、その一文を付ける。
- 公式の公表、実測、編集の判断、推定は `basis` で分ける。架空の口コミ、監修、実績を、実在の情報として出さない。
- 確認期限を過ぎた金額は、`editorial.staleNumbers` が `hide` のとき「再確認中」になる。build は警告して止まりはしない。静的 HTML は、次の build を配るまで古い数字のまま残る。

## 公開判定

- `draft: true` と、`publishedAt` が build 時点より未来の記事は、一覧、検索、RSS、推薦に出ない。
- `nextSteps` は primary が最大1件、detour が最大2件。理由（`reason`）を書く。0件でも記事は成立する。自分自身と、非公開の記事は指せない。
- sensitive の記事には、`brief.audience`、`brief.scope`、`sources` が1件以上、`lastVerifiedAt`、`review`、`reviewDueAt` が必要。棚の sensitive を、記事の `reviewProfile: standard` では下げられない。
- `requiresSpecialist: true` の記事は、`review.by` の著者が `specialist`（分野、資格、確認日）を持つ。production では欠けると build が止まる。demo では警告して、その記事を公開から外す。
- `sample: true` は同梱の見本だけに付ける。production では、記事・用語・著者・情報源・商品のどれかに残っていると build が止まる。
- production では、実在の `site.url` と、`contact.email` または https の `contact.formUrl` が必要。`example.com` などの仮 URL は拒否する。
- 識別検査モード（`DD_INSPECT=1`）は、開発とデモの build だけ。production では拒否する。

## 広告・引用・監修

- 商品 id の有無で広告と決めない。リンクの `relation`（`none` / `affiliate` / `sponsored`）と、記事の `commercial`（`affiliate` / `sponsored` / `provided`）を別々に書く。affiliate のリンクがある記事は `commercial.affiliate: true`。sponsored のリンクがある記事は `commercial.sponsored: true`。
- 広告関係の定型文はタイトル付近に出す。報酬に関係する推薦は、その箇所の近くにも書く。
- 広告リンクは `rel="sponsored"`。通常の編集リンクと混ぜない。
- 引用は `<Cite>` と `<Evidence>`。情報源の URL は http または https。`javascript:` と `data:` は拒否する。
- 監修は、実在の専門家で資格を確認したときだけ `specialist` を書く。サンプルに、実在の監修者は置かない。
- 同梱の商品・サービスに、実際の申込 URL や広告 URL を付けない。

## 確認担当と訂正

- 確認担当は著者の `role`。記事の `review.by` がその記事を確認した人。`review.scope` に、確認した範囲を書く。
- 訂正、更新、続報は `history` に残す。`type` は `correction`、`update`、`follow-up`。日付の自動更新で、鮮度を装わない。
- 訂正の窓口は `contact.email` か `contact.formUrl`。連絡先ページの文だけでは、フォームは送信されない。
- 期限を過ぎた記事は、担当が条件を確認してから `lastVerifiedAt` と `reviewDueAt` を更新し、再 build して配る。build を止めただけでは、すでに配った HTML は消えない。

## 直書きの禁止

- セットの表示部品（`src/design-sets/*/components`）に、ロジック、`<script>`、`<style>`、CSS の import を書かない。
- 色と寸法は CSS 変数（`--c-*` / `--g-*` / `--m-*`）から取る。部品と記事に、色・余白・角丸の値を直書きしない。
- `finish-real.css` は寸法と配置を変えない。変えてよいのは、色、影、光、角の丸み、透明度、transform。
- セットは、本文の直接上書きと、共通ロジックの複製をしない。
- 検査（`astro check`、lint、test、`check-output`）を飛ばさない。`--no-verify` を使わない。

## 新しいセットを足すとき

フォルダを足すだけでは使えない。次が揃ってから `registry.ts` に登録する。

- `src/design-sets/<id>/manifest.ts`。`SetManifest` の全項目（`contractVersion` は 3、原形 `primitive`、9枠 `s1`〜`s9`、`reservedShapes`、`geometry`、`finishes.real`、`narrowMax`、`middleMax`）。新しい `id` と `primitive` は `contract.ts` の型に足す。書体（`tokens.css` の `--f-sans`、使うなら `--f-num`・`--f-serif`）、ライセンス、対応する機能は、そのセットの README に書く。
- `tokens.css`、`parts.css`、`finish-real.css`。
- 11部品。`Frame`、`CategoryMark`、`SectionHeading`、`ArticleFace`、`FaceGrid`、`SearchSurface`、`CheckSlip`、`CheckPanel`、`CheckRow`、`Popover`、`EndMark`。props の型は既存のセットと同じ。
- そのセットの README。9枠の形と、形の予約。
- `src/design-sets/contract.ts` の `SetId` と、`src/design-sets/registry.ts` への登録。クラスの接頭辞は `scripts/check-output.mjs`、本文の目次の現在地は `src/scripts/toc.ts`、質感の検査は `scripts/check-finish-props.mjs` にも足す。
- 識別検査 A〜F の合格記録（判定者5名以上、制作者以外3名以上）。
- 既存のセットとの差。どの2つを比べても（`tests/unit/design-sets.test.ts` が manifest の宣言で確かめる）、S1・S2・S4・S5 の形が異なり、残る5枠のうち3枠以上で形が異なる。色、書体、角丸の値の違いだけは、形の差に数えない。

ページは `src/generated/ui.ts` から、選んだセットの部品だけを読む。共通のページに、セット専用の分岐を足さない。

## コマンド

- 開発: `npm run dev`
- セットと質感: サイトごとに `sites/<slug>/site.json` の `design`。試すときは `npx cross-env DD_DESIGN_SET=answer DD_FINISH=real npm run dev`
- 完了前: `npm run verify`
- 比較デモ: `npm run build:demo`
