# Spread の main は主面と次の見開きの両方を包む

## 状況

3.7 の Spread は、`after` スロット（次に確かめる・記事末）を `<main class="sp-face">` の外の `section.sp-nextface` に出す。Binder と Board は、default と after をどちらも `<main id="main">` の中に置く。手順書 3.7 は after を「読む領域の続き」としている。

工程20は、3セットで見出しの一覧・landmark・main の中のリンク先が同じことを検査する。after を main の外に出すと、次に確かめるの節と記事末のリンクが main の外に出る。

## 選択肢

1. 3.7 の HTML のまま、after を main の外に出す。
2. `<main id="main" class="sp-faces">` が `div.sp-face`（本文）と `section.sp-nextface`（after があるときだけ）を包む。見た目は CSS で 3.7 の見開きにする。

## 決定

選択肢2。`sp-nextface` には `aria-label` を付けない。中の「次に確かめる」がすでに節の名前を持つ。名前を足すと landmark が Binder より一つ増える。

静的な landmark を揃えるため、3.7 の図に無い `header.sp-bar` と `nav[aria-label="棚"]` も残す。索引は `nav.sp-sub`。check の描画結果が空なら `aside` は出さない。

## 理由

読む領域の続きは、セットが違っても main の中にある。円弧で分かれて見えるのは、17b の CSS の仕事にする。
