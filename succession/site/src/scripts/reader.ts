import {
  notify,
  onExternalChange,
  parseBookmarks,
  parseResume,
  read,
  write,
  type Bookmark,
  type ResumePoint,
} from "./store";

const MAX_BOOKMARKS = 200;
const MAX_RESUME = 50;
const LINE = 0.25;

let bound = false;
let resumeBlocked = false;
let saveTimer = 0;
let atEnd = false;
let bookmarks: Bookmark[] = [];
let resume: Record<string, ResumePoint> = {};

function articleId(): string | null {
  return document.querySelector<HTMLElement>(".dd-prose")?.dataset.article ?? null;
}

function headings(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(".dd-prose h2")].filter((h) => h.id);
}

function endMark(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-sig="s9"]');
}

function endVisible(): boolean {
  const end = endMark();
  if (!end) return false;
  const rect = end.getBoundingClientRect();
  // hr は高さ 0 のことがある。上端が画面の中にあれば見えている。
  if (rect.height === 0) return rect.top >= 0 && rect.top < window.innerHeight;
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function measure(): ResumePoint | null {
  if (atEnd) return null;
  const hs = headings();
  if (!hs.length) return null;
  const line = window.innerHeight * LINE;
  let current: HTMLElement | null = null;
  for (const h of hs) {
    if (h.getBoundingClientRect().top <= line) current = h;
  }
  if (!current) return null;
  const next = hs[hs.indexOf(current) + 1] ?? endMark();
  const start = current.getBoundingClientRect().top + window.scrollY;
  const end = next ? next.getBoundingClientRect().top + window.scrollY : start + 1;
  const y = window.scrollY + line;
  const ratio = end > start ? Math.min(1, Math.max(0, (y - start) / (end - start))) : 0;
  return { headingId: current.id, ratio, at: new Date().toISOString() };
}

function capResume(map: Record<string, ResumePoint>): Record<string, ResumePoint> {
  const entries = Object.entries(map).sort((a, b) => Date.parse(b[1].at) - Date.parse(a[1].at));
  return Object.fromEntries(entries.slice(0, MAX_RESUME));
}

function paintSave() {
  const btn = document.querySelector<HTMLButtonElement>("[data-save]");
  if (!btn) return;
  const id = btn.dataset.save ?? "";
  btn.hidden = false;
  btn.setAttribute("aria-pressed", bookmarks.some((b) => b.id === id) ? "true" : "false");
}

function paintResume() {
  const slot = document.querySelector<HTMLElement>("[data-resume]");
  if (!slot) return;
  const id = articleId();
  const point = id ? resume[id] : undefined;
  const heading = point ? document.getElementById(point.headingId) : null;
  const inProse = heading?.closest(".dd-prose");
  if (!point || !heading || !inProse) {
    slot.hidden = true;
    slot.replaceChildren();
    if (point && id) {
      const next = { ...resume };
      delete next[id];
      resume = next;
      if (!resumeBlocked && !write("resume", resume)) resumeBlocked = true;
    }
    return;
  }
  const name = heading.textContent?.replace(/\s+/g, " ").trim() ?? "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = `前回の続き（${name}）から読む`;
  btn.addEventListener("click", () => {
    heading.tabIndex = -1;
    heading.scrollIntoView({ block: "start" });
    heading.focus({ preventScroll: true });
  });
  slot.replaceChildren(btn);
  slot.hidden = false;
}

function refreshBookmarks() {
  bookmarks = read("bookmarks", parseBookmarks) ?? [];
  paintSave();
}

function refreshResume() {
  resume = read("resume", parseResume) ?? {};
  paintResume();
}

function refresh() {
  refreshBookmarks();
  refreshResume();
}

function toggleSave() {
  const btn = document.querySelector<HTMLButtonElement>("[data-save]");
  const id = btn?.dataset.save ?? "";
  if (!/^[a-z0-9-]+$/.test(id)) return;
  if (bookmarks.some((b) => b.id === id)) {
    bookmarks = bookmarks.filter((b) => b.id !== id);
  } else {
    bookmarks = [{ id, savedAt: new Date().toISOString() }, ...bookmarks.filter((b) => b.id !== id)];
    if (bookmarks.length > MAX_BOOKMARKS) {
      bookmarks = [...bookmarks].sort((a, b) => a.savedAt.localeCompare(b.savedAt)).slice(-MAX_BOOKMARKS);
      notify("保存は200件までです。古いものから削除しました。");
    }
  }
  write("bookmarks", bookmarks);
  paintSave();
}

function commitResume() {
  if (atEnd || !document.querySelector("[data-resume]")) return;
  const id = articleId();
  if (!id) return;
  const point = measure();
  if (!point) return;
  resume = capResume({ ...resume, [id]: point });
  if (!resumeBlocked && !write("resume", resume)) resumeBlocked = true;
}

function noteEnd() {
  if (!endVisible()) {
    atEnd = false;
    return;
  }
  atEnd = true;
  window.clearTimeout(saveTimer);
  const id = articleId();
  if (!id || !resume[id]) return;
  const next = { ...resume };
  delete next[id];
  resume = next;
  if (!resumeBlocked && !write("resume", resume)) resumeBlocked = true;
  paintResume();
}

function onScroll() {
  noteEnd();
  if (atEnd) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(commitResume, 1000);
}

function bindResume() {
  const io = new IntersectionObserver(() => {
    noteEnd();
  });
  for (const h of headings()) io.observe(h);
  const end = endMark();
  if (end) io.observe(end);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("pagehide", () => {
    window.clearTimeout(saveTimer);
    noteEnd();
    commitResume();
  });
  noteEnd();
}

function start() {
  refresh();
  if (bound) return;
  bound = true;
  document.querySelector("[data-save]")?.addEventListener("click", toggleSave);
  if (document.querySelector("[data-resume]")) bindResume();
  onExternalChange("bookmarks", refreshBookmarks);
  onExternalChange("resume", refreshResume);
  addEventListener("pageshow", refresh);
}

start();

export {};
