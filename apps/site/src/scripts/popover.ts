if (!("popover" in HTMLElement.prototype)) {
  document.querySelectorAll<HTMLButtonElement>(".dd-term__btn").forEach((b) => {
    b.hidden = true;
  });
  // 索引と表示設定の popover は外さない。用語の補足だけを記事末の一覧にする。
  document.querySelectorAll<HTMLElement>('.dd-terms [data-sig="s7"]').forEach((el) => {
    el.removeAttribute("popover");
    el.removeAttribute("role");
    el.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      button.hidden = true;
    });
  });
}

export {};
