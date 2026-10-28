const LINE = 0.25;
let bound = false;
let frame = 0;

function hashId(a: HTMLAnchorElement): string {
  const raw = a.hash.startsWith("#") ? a.hash.slice(1) : "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function currentId(): string | null {
  const line = window.innerHeight * LINE;
  let current: HTMLElement | null = null;
  for (const h of document.querySelectorAll<HTMLElement>(".dd-prose h2")) {
    if (!h.id) continue;
    if (h.getBoundingClientRect().top <= line) current = h;
  }
  return current?.id ?? null;
}

function apply() {
  const id = currentId();
  for (const sel of [
    ".bi-flag--toc a",
    ".bi-checkrow a",
    ".bo-meter--toc a",
    ".bo-checkrow a",
    ".sp-spine__item--toc a",
    ".sp-checkrow a",
    ".ta-panel--toc a",
    ".ta-checkrow a",
    ".an-panel--toc a",
    ".an-checkrow a",
    ".fi-panel--toc a",
    ".fi-checkrow a",
    ".il-panel--toc a",
    ".il-checkrow a",
    ".dd-toc a",
  ]) {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(sel)) {
      if (id !== null && hashId(a) === id) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  }
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    apply();
  });
}

function start() {
  if (bound || !document.querySelector(".dd-prose h2")) return;
  bound = true;
  const io = new IntersectionObserver(() => schedule());
  for (const h of document.querySelectorAll<HTMLElement>(".dd-prose h2")) io.observe(h);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  apply();
}

start();

export {};
