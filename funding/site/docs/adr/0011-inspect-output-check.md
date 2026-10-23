# 識別検査モードの有無は、どの mode の build でも check-output が見る

## 状況

手順書の `check-output` は、`DD_MODE=production` のときだけ、HTML に識別検査モードが残っていないかを見る。このリポジトリは配布用テンプレートで、サンプルが残っているため production の build は設定とコンテンツの検査で先に止まる。工程20c は、`DD_INSPECT` を付けない build の出力に識別検査モードが残っていないことを、`check-output` で確かめる。

## 選択肢

1. production の分岐だけを残し、demo の build は目で HTML を見る。
2. `DD_INSPECT=1` の build では `.dd-inspect` が全ページにあり、それ以外の build では 0 件であることを、mode に関係なく `check-output` が止める条件にする。

## 決定

選択肢2。

## 理由

識別検査モードは build 時に HTML へ入る（`site.inspect`）。production まで進まないテンプレートでも、通常の build で残存を落とせる必要がある。`DD_INSPECT=1` の build は撮影に使うので、パネルが無いときは逆に止める。CSS に残る `data-inspect` の選択子は、属性が付かない限り画面を変えないので、この検査の対象は `.dd-inspect` 要素にする。
