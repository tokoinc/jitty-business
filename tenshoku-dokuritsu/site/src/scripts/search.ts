interface Result {
  url: string;
  excerpt: string;
  meta: Record<string, string>;
}
interface PF {
  options(o: object): Promise<void>;
  init(): void;
  debouncedSearch(
    q: string | null,
    o?: object,
    ms?: number,
  ): Promise<{ results: { data(): Promise<Result> }[] } | null>;
}

const root = document.querySelector<HTMLElement>("[data-search-root]");
const form = document.getElementById("dd-search-form") as HTMLFormElement | null;
if (root && form) setup(root, form);

async function load(base: string): Promise<PF> {
  const pf = (await import(/* @vite-ignore */ `${base}pagefind/pagefind.js`)) as PF;
  await pf.options({ bundlePath: `${base}pagefind/`, baseUrl: base });
  pf.init();
  return pf;
}

function setup(root: HTMLElement, form: HTMLFormElement) {
  const rawBase = root.dataset.base ?? "/";
  const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  const out = root.querySelector<HTMLElement>('[data-sig="s4-grid"]')!;
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const empty = root.querySelector<HTMLElement>("[data-empty]");
  let loading: Promise<PF> | null = null;
  let seq = 0;

  function getPf(): Promise<PF> {
    loading ??= load(base).catch((err: unknown) => {
      loading = null;
      throw err;
    });
    return loading;
  }

  const showEmpty = (on: boolean) => {
    if (empty) empty.hidden = !on;
  };

  function updateCounts() {
    document.querySelectorAll<HTMLElement>("[data-filter-group]").forEach((group) => {
      const name = group.dataset.filterGroup ?? "";
      const n = Array.from(form.elements).filter(
        (el) => el instanceof HTMLInputElement && el.type === "checkbox" && el.name === name && el.checked,
      ).length;
      group.querySelectorAll<HTMLElement>("[data-filter-count]").forEach((node) => {
        node.textContent = n > 0 ? ` ${n}` : "";
      });
    });
  }

  /** 静的生成では入力の初期値が空。URL の条件を戻してから検索する */
  function applyUrl() {
    const params = new URLSearchParams(location.search);
    const q = form.elements.namedItem("q");
    if (q instanceof HTMLInputElement) q.value = params.get("q") ?? "";
    const purpose = params.get("purpose") ?? "";
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement)) continue;
      if (el.type === "checkbox") el.checked = params.getAll(el.name).includes(el.value);
      if (el.type === "radio" && el.name === "purpose") el.checked = el.value === purpose;
    }
    updateCounts();
  }

  async function run() {
    const fd = new FormData(form);
    const q = String(fd.get("q") ?? "").trim();
    const filters: Record<string, string[]> = {};
    for (const key of ["shelf", "format", "checked", "purpose"]) {
      const v = fd.getAll(key).map(String).filter(Boolean);
      if (v.length) filters[key] = v;
    }
    const params = new URLSearchParams();
    for (const [k, v] of fd) if (String(v)) params.append(k, String(v));
    history.replaceState(null, "", params.size ? `?${params}` : location.pathname);
    updateCounts();
    if (!q && !Object.keys(filters).length) {
      out.replaceChildren();
      status.textContent = "検索語を入れるか、条件を選んでください。";
      showEmpty(false);
      return;
    }
    const my = ++seq;
    status.textContent = "検索しています…";
    showEmpty(false);
    try {
      const pf = await getPf();
      const res = await pf.debouncedSearch(q || null, { filters }, 250);
      if (res === null || my !== seq) return;
      const data = (await Promise.all(res.results.slice(0, 30).map((r) => r.data()))).filter((item) =>
        sameSite(item.url),
      );
      if (my !== seq) return;
      out.replaceChildren(...data.map((item, i) => face(item, i + 1)));
      const none = data.length === 0;
      status.textContent = none
        ? "見つかりませんでした。言い換えるか、カテゴリ・目的から探してください。"
        : `${res.results.length}件見つかりました。`;
      showEmpty(none);
    } catch {
      status.textContent = "検索を読み込めませんでした。カテゴリ・目的・用語集から探せます。";
      showEmpty(false);
    }
  }

  function clearFilters() {
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement)) continue;
      if (el.type === "checkbox") el.checked = false;
      if (el.type === "radio" && el.name === "purpose") el.checked = el.value === "";
    }
    void run();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void run();
  });
  (form.elements.namedItem("q") as HTMLInputElement | null)?.addEventListener("input", () => void run());
  document.addEventListener("change", (e) => {
    if ((e.target as HTMLInputElement).form === form) void run();
  });
  document.querySelector("[data-clear-filters]")?.addEventListener("click", clearFilters);
  applyUrl();
  if (location.search) void run();
}

/** 索引の URL は同じサイトのページだけを出す。ほかの origin やスキームはリンクにしない */
function sameSite(url: string): boolean {
  try {
    return new URL(url, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

function face(d: Result, index: number): HTMLElement {
  const tpl = (document.getElementById(`face-${d.meta.format}`) ??
    document.getElementById("face-guide")) as HTMLTemplateElement;
  const el = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
  el.style.setProperty("--slot", d.meta.shelfSlot ?? "1");
  const set = (f: string, t: string) =>
    el.querySelectorAll<HTMLElement>(`[data-field="${f}"]`).forEach((n) => (n.textContent = t));
  set("title", d.meta.title ?? "");
  set("shelf", d.meta.shelf ?? "");
  set("format", d.meta.formatLabel ?? "");
  set("date", d.meta.date ?? "");
  set("index", String(index).padStart(2, "0"));
  el.querySelectorAll<HTMLAnchorElement>("a[data-field-href]").forEach((a) => (a.href = d.url));
  const marks = (n: number) =>
    Array.from({ length: n }, () => Object.assign(document.createElement("i"), { ariaHidden: "true" }));
  el.querySelector('[data-field="steps"]')?.replaceChildren(...marks(Number(d.meta.steps ?? 0)));
  const cols = el.querySelector<HTMLElement>('[data-field="cols"]');
  if (cols) {
    const n = Number(d.meta.cols ?? 0);
    if (n > 0) cols.style.setProperty("--cols", String(n));
    cols.replaceChildren(...marks(n));
  }
  const ex = document.createElement("p");
  ex.className = "dd-excerpt";
  ex.append(...excerpt(d.excerpt));
  el.append(ex);
  return el;
}

/** Pagefind の抜粋から <mark> だけを残し、ほかはすべて文字として入れる */
function excerpt(html: string): Node[] {
  const doc = new DOMParser().parseFromString(`<p>${html}</p>`, "text/html");
  return [...(doc.body.firstChild?.childNodes ?? [])].map((n) => {
    if (n.nodeName !== "MARK") return document.createTextNode(n.textContent ?? "");
    const m = document.createElement("mark");
    m.textContent = n.textContent;
    return m;
  });
}

export {};
