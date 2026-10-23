import { loadArticleIndex, type ArticleIndexItem } from "./article-index";
import { onExternalChange, parseResume, read } from "./store";

let bound = false;

function showLatest(link: HTMLAnchorElement, index: Map<string, ArticleIndexItem>) {
  const panel = link.closest("section");
  if (!panel) return;
  const resume = read("resume", parseResume) ?? {};
  const hit = Object.entries(resume)
    .sort((a, b) => Date.parse(b[1].at) - Date.parse(a[1].at))
    .map(([id]) => index.get(id))
    .find((item) => item !== undefined);
  if (!hit) {
    panel.hidden = true;
    link.textContent = "読みかけ";
    link.href = link.dataset.base ?? "/";
    return;
  }
  link.href = hit.href;
  link.textContent = hit.title;
  panel.hidden = false;
}

async function start() {
  const link = document.querySelector<HTMLAnchorElement>("[data-reading]");
  if (!link) return;
  let index: Map<string, ArticleIndexItem>;
  try {
    index = await loadArticleIndex(link.dataset.base ?? "/");
  } catch {
    return;
  }
  const update = () => showLatest(link, index);
  update();
  if (bound) return;
  bound = true;
  onExternalChange("resume", update);
  addEventListener("pageshow", update);
}

void start();

export {};
