# Figure — 大きな数字と太い罫

原形は、新聞の組みのような「大きな数字と太い罫」。8px の罫で閉じる題字の帯（探す）、読む領域、細い縦の罫で分けた確かめる領域で3領域を分ける。数字は端末の詰めた書体で大きく組み、朱は数と締切だけに使う。デザイン案 E（Figure）を移植した。

## 幾何トークン

`tokens.css` の `--g-*` は `manifest.geometry` と一致する。

| トークン | 値 |
| --- | --- |
| `--g-line` | 1px |
| `--g-rule` | 4px |
| `--g-heavy` | 8px |
| `--g-double` | 9px |
| `--g-numeral` | 4.5rem |
| `--g-radius` | 0 |

## 9枠

| 枠 | 形 |
| --- | --- |
| S1 | 8px の罫で閉じる題字の帯と、読む｜確かめるの縦の罫 |
| S2 | 大きな棚番号と棚名（記事の冒頭は反転した札） |
| S3 | 太い罫と大きな節番号（「01/06」） |
| S4 | 太い罫で始まる段と大きな通し番号。実務は縦の罫と手順の数（朱）、比較は帳簿の罫、ニュースは大きな日付、論考・人物は罫の下の写真 |
| S5 | 見出しの大きさの検索欄と、番号付きの目的の行 |
| S6 | 太い罫で始まり罫で閉じる票。見出しの札が罫から下がる |
| S7 | 太い罫で始まる小さな票 |
| S8 | 今いる棚・節の行が反転する |
| S9 | 二重の罫 |

## 形の予約

- 朱の数字は「その記事の数」（手順の数・要点の数・件数）と締切だけに使う。飾りや広告の数字には使わない。
- 反転した行は現在地と、選んでいる条件だけに使う。

## 12ブロックとシグネチャ枠の対応

| ブロック | 対応する枠 | Figure での形 |
| --- | --- | --- |
| DecisionBrief | S6 | 太い罫の票。分かることは大きな番号の行 |
| Summary | S9 に準じる | 8px の罫と朱の大きな番号 |
| Evidence | S6 | 大きな番号と資料名の行 |
| Conditions | S6 | 罫から下がる「条件」の札と、細い罫の表 |
| Callout | — | 太い罫の下の灰の面と、罫から下がる札（注意は朱） |
| Steps | S4（実務）と同じ | 大きな番号と罫 |
| Faq | — | 「問」の反転した札と「答」の札 |
| ProductBox | — | 点線の太い罫で囲む段。料金・条件は Conditions と同じ票 |
| CompareTable | — | 上を太い罫、行を細い罫 |
| ProsCons | — | 縦の罫で分けた2段（＋と−） |
| Term | S7 | 点線の下線と反転した ? の札 |
| LinkCard | S4 | 記事面を小さくした形 |

## 書体

フォントファイルは同梱しない。端末にある書体を指名する。

- `--f-sans`：system-ui、Hiragino Sans、Hiragino Kaku Gothic ProN、Yu Gothic UI、Yu Gothic、Meiryo、Noto Sans JP
- `--f-num`（数字）：Bahnschrift Condensed・Bahnschrift（Windows）、Avenir Next Condensed（macOS・iOS）、Roboto Condensed（Android）、Arial Narrow、Helvetica Neue、Arial。`font-stretch: condensed` で詰める。無いときは `--f-sans`

## 対応する機能

全セット共通の機能（保存・続きから読む・用語の補足・検索・明暗・文字サイズ）にすべて対応する。質感は `flat` と `real`（`finish-real.css`）。

## 識別検査

人による識別検査（A〜F）はまだ行っていない（`docs/identity/2026-10-28-impl.md`）。
