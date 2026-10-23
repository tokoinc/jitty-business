export type Theme = "light" | "dark" | "system";
export type FontScale = "sm" | "md" | "lg";
export interface Preferences {
  version: 1;
  theme: Theme;
  fontScale: FontScale;
}

const memory = new Map<string, string>();
const ns = () => document.documentElement.dataset.storageNs || "tenshoku-dokuritsu:v1";

export function read<T>(name: string, parse: (v: unknown) => T | null): T | null {
  const key = `${ns()}:${name}`;
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = memory.get(key) ?? null;
  }
  if (raw == null) return null;
  try {
    return parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function write(name: string, value: unknown): boolean {
  const key = `${ns()}:${name}`;
  const raw = JSON.stringify(value);
  try {
    localStorage.setItem(key, raw);
    return true;
  } catch {
    memory.set(key, raw);
    notify("この端末に保存できませんでした。ページを閉じると元に戻ります。");
    return false;
  }
}

export function notify(message: string) {
  const el = document.getElementById("dd-notice");
  if (!el) return;
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = message;
  });
  window.setTimeout(() => {
    if (el.textContent === message) el.textContent = "";
  }, 6000);
}

export function onExternalChange(name: string, cb: () => void) {
  addEventListener("storage", (e) => {
    if (e.key === `${ns()}:${name}`) cb();
  });
}

export function parsePreferences(v: unknown): Preferences | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.version !== 1) return null;
  const theme = ["light", "dark", "system"].includes(o.theme as string) ? (o.theme as Theme) : "system";
  const fontScale = ["sm", "md", "lg"].includes(o.fontScale as string) ? (o.fontScale as FontScale) : "md";
  return { version: 1, theme, fontScale };
}

export interface Bookmark {
  id: string;
  savedAt: string;
}
export interface ResumePoint {
  headingId: string;
  ratio: number;
  at: string;
}

const ID = /^[a-z0-9-]+$/;
/** 見出しの id。本文の h2 の id より長いものは無い */
const MAX_HEADING_ID = 200;

/** 保存値は別のタブや拡張機能も書ける。知っている項目だけを詰め直して返す */
export const parseBookmarks = (v: unknown): Bookmark[] | null =>
  Array.isArray(v)
    ? v
        .filter((x) => x && typeof x.id === "string" && ID.test(x.id) && typeof x.savedAt === "string")
        .slice(0, 200)
        .map((x) => ({ id: x.id, savedAt: x.savedAt }))
    : null;

/** 180日より古い位置は捨てる。件数の上限は保存する側で掛ける。 */
export const parseResume = (v: unknown): Record<string, ResumePoint> | null => {
  if (!v || typeof v !== "object") return null;
  const out: Record<string, ResumePoint> = {};
  const limit = Date.now() - 180 * 86400000;
  for (const [id, p] of Object.entries(v as Record<string, ResumePoint>)) {
    if (
      ID.test(id) &&
      p &&
      typeof p.headingId === "string" &&
      p.headingId.length <= MAX_HEADING_ID &&
      typeof p.ratio === "number" &&
      Number.isFinite(p.ratio) &&
      Date.parse(p.at) > limit
    ) {
      out[id] = { headingId: p.headingId, ratio: Math.min(1, Math.max(0, p.ratio)), at: p.at };
    }
  }
  return out;
};
