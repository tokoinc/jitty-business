import type { CollectionEntry } from "astro:content";
import type { ShelfMark } from "@/design-sets/contract";
import { site } from "@/site.config";
import { toFace } from "./cards";
import type { Article, SiteData } from "./content";
import { pageSlice } from "./paginate";
import { compareReading, kanaRow } from "./text";
import { authorHref, categoryHref, glossaryHref, href } from "./url";

export function shelfMark(category: SiteData["categories"][number]): ShelfMark {
  return {
    id: category.id,
    label: category.data.label,
    slot: category.data.tabSlot ?? 1,
    number: String(category.data.order).padStart(2, "0"),
  };
}

export function articlesOnShelf(d: SiteData, id: string): Article[] {
  return d.articles.filter((article) => article.data.category.id === id);
}

/** ID の並びを保つ。byId に無いもの（未公開・ファイル無し）は飛ばす */
export function publishedIn(
  byId: SiteData["byId"],
  ids: readonly string[],
  max = Number.POSITIVE_INFINITY,
): Article[] {
  const out: Article[] = [];
  for (const id of ids) {
    const article = byId.get(id);
    if (!article) continue;
    out.push(article);
    if (out.length >= max) break;
  }
  return out;
}

/** 公開記事がある棚だけ。3.4 は空の棚URLを作らない */
export function shelvesWithArticles(d: SiteData) {
  return d.shelves.filter((shelf) => articlesOnShelf(d, shelf.id).length > 0);
}

/** 公開記事がある棚を order 順に見たときの前後。空の棚は間に挟まない */
export function neighborShelves(d: SiteData, id: string) {
  const shelves = shelvesWithArticles(d);
  const index = shelves.findIndex((shelf) => shelf.id === id);
  if (index < 0) return [];
  return [shelves[index - 1], shelves[index + 1]].filter((shelf) => shelf !== undefined);
}

/** グループ順は保つ。公開記事が無いグループは落とす */
export function readingGroups(
  groups: readonly { label: string; articles: readonly string[] }[],
  byId: SiteData["byId"],
) {
  return groups
    .map((group) => ({ label: group.label, articles: publishedIn(byId, group.articles) }))
    .filter((group) => group.articles.length > 0);
}

export function articlesForIntent(d: SiteData, intent: Article["data"]["intent"]): Article[] {
  return d.articles.filter((article) => article.data.intent === intent);
}

/** sample を除いた公開記事。タグの件数・一覧・詳細はこれを数える */
export function articlesForTag(d: SiteData, id: string): Article[] {
  return d.articles.filter(
    (article) => !article.data.sample && article.data.tags.some((tag) => tag.id === id),
  );
}

/** 公開中の回だけ。欠番の「準備中」は出さない */
export function episodesOf(d: SiteData, seriesId: string): Article[] {
  return d.articles
    .filter((article) => article.data.series?.id.id === seriesId)
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0) || a.id.localeCompare(b.id));
}

export function faceItems(articles: Article[], d: SiteData, start = 1) {
  return articles.map((article, i) => ({ face: toFace(article, d), index: start + i }));
}

export function pagedFaces(articles: Article[], d: SiteData, page: number, per = site.articlesPerPage) {
  const slice = pageSlice(articles, page, per);
  return { ...slice, faces: faceItems(slice.items, d, (page - 1) * per + 1) };
}

export function assertListPage(page: number, total: number, where: string) {
  if (!Number.isInteger(page) || page < 1 || page > total) throw new Error(`${where}のページがない: ${page}`);
}

export function listCrumbs(tail: { label: string; href?: string }[]) {
  return [{ label: "TOP", href: href("") }, ...tail];
}

/** 記事が参照している用語。shelfIds を渡すと、その棚に属する用語も含める */
export function relatedTermLinks(d: SiteData, articles: Article[], shelfIds: string[] = []) {
  const cited = new Set(articles.flatMap((article) => article.data.terms.map((term) => term.id)));
  const shelves = new Set(shelfIds);
  return d.glossary
    .filter(
      (entry) => cited.has(entry.id) || (entry.data.category ? shelves.has(entry.data.category.id) : false),
    )
    .sort((a, b) => compareReading(a.data.reading, b.data.reading) || a.id.localeCompare(b.id))
    .map((entry) => ({ label: entry.data.term, href: glossaryHref(entry.id) }));
}

export function emptyTargets(d: SiteData, exceptShelfId?: string) {
  return {
    shelves: shelvesWithArticles(d)
      .filter((shelf) => shelf.id !== exceptShelfId)
      .map((shelf) => ({
        label: shelf.data.label,
        href: categoryHref(shelf.id),
        count: articlesOnShelf(d, shelf.id).length,
      })),
    searchHref: href("search/"),
  };
}

export function shelfCheck(d: SiteData, shelf: SiteData["shelves"][number]) {
  const ownerId = shelf.data.owner?.id;
  const owner = ownerId ? d.authors.find((author) => author.id === ownerId) : undefined;
  return {
    description: shelf.data.description,
    ownerName: owner?.data.name,
    ownerHref: owner ? authorHref(owner.id) : undefined,
    updatePolicy: shelf.data.updatePolicy,
  };
}

export const KANA_ROWS = ["あ", "か", "さ", "た", "な", "は", "ま", "や", "ら", "わ"] as const;

export function tagsInReadingOrder(tags: CollectionEntry<"tags">[]) {
  return [...tags].sort((a, b) => compareReading(a.data.reading, b.data.reading) || a.id.localeCompare(b.id));
}

/** 公開記事が1件以上あるタグだけ。空の行は出さない */
export function tagRows(tags: CollectionEntry<"tags">[], articles: Article[]) {
  const visible = tags.filter((tag) =>
    articles.some((article) => !article.data.sample && article.data.tags.some((item) => item.id === tag.id)),
  );
  const sorted = tagsInReadingOrder(visible);
  const known = new Set<string>(KANA_ROWS);
  const rows: { row: string; tags: typeof sorted }[] = KANA_ROWS.map((row) => ({
    row,
    tags: sorted.filter((tag) => kanaRow(tag.data.reading) === row),
  })).filter((group) => group.tags.length > 0);
  const rest = sorted.filter((tag) => !known.has(kanaRow(tag.data.reading)));
  if (rest.length > 0) rows.push({ row: "他", tags: rest });
  return rows;
}

export function glossaryInReadingOrder(entries: SiteData["glossary"]) {
  return [...entries].sort(
    (a, b) => compareReading(a.data.reading, b.data.reading) || a.id.localeCompare(b.id),
  );
}

/** 五十音の行。空の行は出さない */
export function glossaryRows(entries: SiteData["glossary"]) {
  const sorted = glossaryInReadingOrder(entries);
  const known = new Set<string>(KANA_ROWS);
  const rows: { row: string; entries: typeof sorted }[] = KANA_ROWS.map((row) => ({
    row,
    entries: sorted.filter((entry) => kanaRow(entry.data.reading) === row),
  })).filter((group) => group.entries.length > 0);
  const rest = sorted.filter((entry) => !known.has(kanaRow(entry.data.reading)));
  if (rest.length > 0) rows.push({ row: "他", entries: rest });
  return rows;
}

/** 記事の terms と、用語側の article。公開中の記事だけ */
export function articlesUsingTerm(d: SiteData, id: string): Article[] {
  const linked = d.glossary.find((entry) => entry.id === id)?.data.article?.id;
  return d.articles.filter(
    (article) => article.data.terms.some((term) => term.id === id) || article.id === linked,
  );
}

export function articlesByAuthor(d: SiteData, id: string): Article[] {
  return d.articles.filter((article) => article.data.author.id === id);
}
