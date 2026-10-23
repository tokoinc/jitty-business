import { getCollection, type CollectionEntry } from "astro:content";
import { site } from "@/site.config";
import { BUILD_TIME } from "./dates";
import { lacksSpecialist, validateAll } from "./validate";

export type Article = CollectionEntry<"articles">;
export type Category = CollectionEntry<"categories">;

export interface SiteData {
  all: Article[];
  articles: Article[]; // 公開記事（新しい順）
  byId: Map<string, Article>;
  categories: Category[];
  shelves: Category[]; // 棚（order 順）
  tags: CollectionEntry<"tags">[];
  series: CollectionEntry<"series">[];
  authors: CollectionEntry<"authors">[];
  glossary: CollectionEntry<"glossary">[];
  sources: CollectionEntry<"sources">[];
  products: CollectionEntry<"products">[];
}

export const byNewest = (a: Article, b: Article) =>
  b.data.publishedAt.getTime() - a.data.publishedAt.getTime() || a.id.localeCompare(b.id);

export function isPublished(a: Article): boolean {
  if (a.data.draft) return false;
  if (a.data.publishedAt > BUILD_TIME) return false;
  if (site.mode === "production" && a.data.sample) return false;
  return true;
}

export function profileOf(a: Article, categories: Category[]): "standard" | "sensitive" {
  const c = categories.find((x) => x.id === a.data.category.id);
  const base = c?.data.reviewProfile ?? "standard";
  return base === "sensitive" || a.data.reviewProfile === "sensitive" ? "sensitive" : "standard";
}

let cache: Promise<SiteData> | undefined;
export function getSiteData(): Promise<SiteData> {
  return (cache ??= (async () => {
    const [all, categories, tags, series, authors, glossary, sources, products] = await Promise.all([
      getCollection("articles"),
      getCollection("categories"),
      getCollection("tags"),
      getCollection("series"),
      getCollection("authors"),
      getCollection("glossary"),
      getCollection("sources"),
      getCollection("products"),
    ]);
    const published = all.filter(isPublished).sort(byNewest);
    // production は検査で止める。demo は公開記事（articles・byId）から外す
    const articles =
      site.mode === "production" ? published : published.filter((a) => !lacksSpecialist(a, authors));
    const data: SiteData = {
      all,
      articles,
      byId: new Map(articles.map((a) => [a.id, a])),
      categories,
      shelves: categories.filter((c) => c.data.shelf).sort((a, b) => a.data.order - b.data.order),
      tags,
      series,
      authors,
      glossary,
      sources,
      products,
    };
    validateAll(data);
    return data;
  })());
}
