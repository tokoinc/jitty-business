export interface ArticleIndexItem {
  id: string;
  title: string;
  href: string;
  shelf: { label: string; slot: number };
  format: string;
  date: string;
}

function isItem(v: unknown): v is ArticleIndexItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!o.shelf || typeof o.shelf !== "object") return false;
  const shelf = o.shelf as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.href === "string" &&
    o.href.startsWith("/") &&
    typeof o.format === "string" &&
    typeof o.date === "string" &&
    typeof shelf.label === "string" &&
    typeof shelf.slot === "number"
  );
}

export function parseArticleIndex(v: unknown): ArticleIndexItem[] {
  return Array.isArray(v) ? v.filter(isItem) : [];
}

export async function loadArticleIndex(base: string): Promise<Map<string, ArticleIndexItem>> {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const res = await fetch(new URL(`${prefix}articles-index.json`, location.origin));
  if (!res.ok) throw new Error(String(res.status));
  return new Map(parseArticleIndex(await res.json()).map((item) => [item.id, item]));
}
