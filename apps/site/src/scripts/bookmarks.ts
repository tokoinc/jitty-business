import { loadArticleIndex, type ArticleIndexItem } from "./article-index";
import { onExternalChange, parseBookmarks, read, write, type Bookmark } from "./store";

let bound = false;
let index = new Map<string, ArticleIndexItem>();

function dotDate(isoDay: string): string {
  const [y, m, d] = isoDay.split("-");
  return y && m && d ? `${y}.${m}.${d}` : isoDay;
}

function fillFace(item: ArticleIndexItem, position: number): HTMLElement {
  const found = document.getElementById(`face-${item.format}`) ?? document.getElementById("face-guide");
  const tpl = found instanceof HTMLTemplateElement ? found : null;
  const source = tpl?.content.firstElementChild;
  if (!source) {
    const a = document.createElement("a");
    a.href = item.href;
    a.textContent = item.title;
    return a;
  }
  const el = source.cloneNode(true) as HTMLElement;
  el.style.setProperty("--slot", String(item.shelf.slot));
  el.querySelectorAll<HTMLElement>('[data-sig="s2"]').forEach((n) =>
    n.style.setProperty("--slot", String(item.shelf.slot)),
  );
  const set = (field: string, text: string) =>
    el.querySelectorAll<HTMLElement>(`[data-field="${field}"]`).forEach((n) => {
      n.textContent = text;
    });
  set("title", item.title);
  set("shelf", item.shelf.label);
  set("date", dotDate(item.date));
  set("index", String(position).padStart(2, "0"));
  el.querySelectorAll<HTMLTimeElement>("time").forEach((t) => {
    t.dateTime = item.date;
  });
  el.querySelectorAll<HTMLAnchorElement>("a[data-field-href]").forEach((a) => {
    a.href = item.href;
  });
  for (const field of ["steps", "cols"]) {
    el.querySelectorAll<HTMLElement>(`[data-field="${field}"]`).forEach((n) => {
      n.replaceChildren();
      n.hidden = true;
    });
  }
  el.querySelectorAll(
    ".bi-face__lead, .bo-face__lead, .sp-card__lead, .ta-face__lead, .an-face__lead, .fi-face__lead, .il-face__lead",
  ).forEach((n) => {
    if (!n.textContent?.trim()) n.remove();
  });
  return el;
}

function render() {
  const root = document.getElementById("dd-bookmarks");
  if (!root) return;
  const items = [...(read("bookmarks", parseBookmarks) ?? [])].sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt),
  );
  root.replaceChildren();
  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "保存した記事はありません。";
    root.append(p);
    return;
  }
  const actions = document.createElement("div");
  actions.className = "dd-bookmark-actions";
  if (items.some((b) => !index.has(b.id))) {
    const prune = document.createElement("button");
    prune.type = "button";
    prune.textContent = "公開を終了した記事を整理する";
    prune.addEventListener("click", () => {
      const kept = (read("bookmarks", parseBookmarks) ?? []).filter((b) => index.has(b.id));
      write("bookmarks", kept);
      render();
    });
    actions.append(prune);
  }
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "すべて削除";
  clear.addEventListener("click", () => {
    write("bookmarks", []);
    render();
  });
  actions.append(clear);
  root.append(actions);
  items.forEach((b, i) => root.append(row(b, i + 1)));
}

function row(b: Bookmark, position: number): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "dd-bookmark";
  const item = index.get(b.id);
  if (item) {
    const face = fillFace(item, position);
    wrap.append(face);
    if (!face.querySelector("[data-field='date']")) {
      const time = document.createElement("time");
      time.dateTime = item.date;
      time.textContent = dotDate(item.date);
      time.className = "dd-bookmark__date";
      wrap.append(time);
    }
  } else {
    const p = document.createElement("p");
    p.textContent = "この記事は公開を終了しました";
    wrap.append(p);
  }
  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "削除";
  if (item) del.setAttribute("aria-label", `「${item.title}」を削除`);
  del.addEventListener("click", () => {
    write(
      "bookmarks",
      (read("bookmarks", parseBookmarks) ?? []).filter((x) => x.id !== b.id),
    );
    render();
  });
  wrap.append(del);
  return wrap;
}

async function start() {
  const root = document.getElementById("dd-bookmarks");
  if (!root) return;
  try {
    index = await loadArticleIndex(root.dataset.base ?? "/");
  } catch {
    root.replaceChildren();
    const p = document.createElement("p");
    p.textContent = "記事の一覧を読み込めませんでした。";
    root.append(p);
    return;
  }
  render();
  if (bound) return;
  bound = true;
  onExternalChange("bookmarks", render);
  addEventListener("pageshow", render);
}

void start();

export {};
