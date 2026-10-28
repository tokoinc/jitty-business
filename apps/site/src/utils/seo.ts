import type { Format, PageKind, SetId } from "@/design-sets/contract";
import { dateTimeAttr } from "./dates";

/** 画面の最上部の色。theme-color は選んでいるセットとそろえる（多くは --c-bg、上に濃い帯を置く Tally は --c-band） */
const themeColorBySet = {
  binder: { light: "#ECE9E2", dark: "#121418" },
  board: { light: "#E6E9EE", dark: "#0E131B" },
  spread: { light: "#F4EEE4", dark: "#19150F" },
  tally: { light: "#0C2B22", dark: "#06110D" },
  answer: { light: "#FFFFFF", dark: "#0F1115" },
  figure: { light: "#FFFFFF", dark: "#0D0D0F" },
  inline: { light: "#FFFFFF", dark: "#11151B" },
} as const satisfies Record<SetId, { light: string; dark: string }>;

export function themeColor(set: SetId) {
  return themeColorBySet[set];
}

export interface IndexInput {
  mode: "demo" | "production";
  kind: PageKind;
  noindex?: boolean;
  sample?: boolean;
}

/** 検索エンジンの index 対象か。Head の robots と sitemap がこれを共有する */
export function isIndexable(input: IndexInput): boolean {
  if (input.mode !== "production") return false;
  if (input.noindex || input.sample) return false;
  if (input.kind === "search") return false;
  return true;
}

/** ホームはサイト名。ほかは「題｜サイト名」 */
export function documentTitle(kind: PageKind, title: string, siteName: string): string {
  return kind === "home" ? siteName : `${title}｜${siteName}`;
}

export interface SitemapArticle {
  id: string;
  noindex?: boolean;
  sample?: boolean;
  publishedAt: Date;
  updatedAt?: Date;
  categoryId: string;
  tagIds: string[];
  seriesId?: string;
  intent: string;
}

export interface SitemapSource {
  mode: "demo" | "production";
  origin: string;
  base: string;
  articlesPerPage: number;
  articles: SitemapArticle[];
  shelves: { id: string }[];
  tags: { id: string }[];
  series: { id: string }[];
  glossary: { id: string; sample?: boolean }[];
  authors: { id: string; sample?: boolean }[];
  intents: string[];
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

const tokyoDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** sitemap の lastmod。日本時間の YYYY-MM-DD */
export function tokyoDate(d: Date): string {
  return tokyoDateFormat.format(d);
}

/** origin と base から絶対URLを作る。ページは末尾スラッシュ、.xml 等はそのまま */
export function absoluteUrl(origin: string, base: string, path = ""): string {
  const root = base.startsWith("/") ? base : `/${base}`;
  const prefix = root.endsWith("/") ? root : `${root}/`;
  const joined = `${prefix}${path.replace(/^\//, "")}`;
  const loc = /\.[a-z0-9]+$/i.test(joined) || joined.endsWith("/") ? joined : `${joined}/`;
  return new URL(loc, origin).href;
}

function articleStamp(article: SitemapArticle): Date {
  return article.updatedAt ?? article.publishedAt;
}

function latestLastmod(articles: SitemapArticle[]): string | undefined {
  if (articles.length === 0) return undefined;
  const latest = articles.reduce((best, article) =>
    articleStamp(article) > articleStamp(best) ? article : best,
  );
  return tokyoDate(articleStamp(latest));
}

function byNewest(a: SitemapArticle, b: SitemapArticle): number {
  return b.publishedAt.getTime() - a.publishedAt.getTime() || a.id.localeCompare(b.id);
}

function add(
  out: SitemapEntry[],
  source: SitemapSource,
  kind: PageKind,
  path: string,
  articles: SitemapArticle[] = [],
  flags?: { noindex?: boolean; sample?: boolean },
) {
  if (!isIndexable({ mode: source.mode, kind, noindex: flags?.noindex, sample: flags?.sample })) return;
  const lastmod = latestLastmod(articles);
  out.push({ loc: absoluteUrl(source.origin, source.base, path), ...(lastmod ? { lastmod } : {}) });
}

function addPaged(out: SitemapEntry[], source: SitemapSource, path: string, articles: SitemapArticle[]) {
  const sorted = [...articles].sort(byNewest);
  const total = Math.max(1, Math.ceil(sorted.length / source.articlesPerPage));
  for (let page = 1; page <= total; page++) {
    const slice = sorted.slice((page - 1) * source.articlesPerPage, page * source.articlesPerPage);
    const pagePath = page === 1 ? path : `${path}page/${page}/`;
    add(out, source, "list", pagePath, slice);
  }
}

/**
 * index 対象の URL だけ。sample は公開記事の一覧に出ないものとして数えない。
 * noindex の記事 URL は除くが、一覧に載るので棚・タグ・ページ送りの件数には含める。
 * demo は isIndexable が常に false なので空になる。
 */
export function sitemapEntries(source: SitemapSource): SitemapEntry[] {
  const listed = source.articles.filter((article) => !article.sample).sort(byNewest);
  const out: SitemapEntry[] = [];
  add(out, source, "home", "", listed);
  addPaged(out, source, "articles/", listed);
  for (const article of source.articles) {
    add(out, source, "article", `articles/${article.id}/`, [article], {
      noindex: article.noindex,
      sample: article.sample,
    });
  }
  add(out, source, "list", "category/", listed);
  for (const shelf of source.shelves) {
    const articles = listed.filter((article) => article.categoryId === shelf.id);
    if (articles.length === 0) continue;
    addPaged(out, source, `category/${shelf.id}/`, articles);
  }
  add(out, source, "list", "purpose/", listed);
  for (const intent of source.intents) {
    add(
      out,
      source,
      "list",
      `purpose/${intent}/`,
      listed.filter((article) => article.intent === intent),
    );
  }
  add(out, source, "list", "tags/", listed);
  for (const tag of source.tags) {
    const articles = listed.filter((article) => article.tagIds.includes(tag.id));
    if (articles.length === 0) continue;
    add(out, source, "list", `tags/${tag.id}/`, articles);
  }
  for (const series of source.series) {
    add(
      out,
      source,
      "list",
      `series/${series.id}/`,
      listed.filter((article) => article.seriesId === series.id),
    );
  }
  add(out, source, "page", "glossary/");
  for (const term of source.glossary) {
    add(out, source, "page", `glossary/${term.id}/`, [], { sample: term.sample });
  }
  for (const author of source.authors) {
    add(out, source, "list", `authors/${author.id}/`, [], { sample: author.sample });
  }
  for (const path of ["about/", "disclosure/", "privacy/", "contact/"]) {
    add(out, source, "page", path);
  }
  return out;
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : "";
      return `<url><loc>${xmlEscape(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

/** noindex のページは Disallow しない。noindex を読ませるため */
export function robotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;
}

export function homeJsonLd(input: {
  name: string;
  description: string;
  url: string;
  organizationName: string;
  logoUrl: string;
}): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: input.name,
      url: input.url,
      description: input.description,
      inLanguage: "ja",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: input.organizationName,
      url: input.url,
      logo: input.logoUrl,
    },
  ];
}

export function articleJsonLd(input: {
  format: Format;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  author: { name: string; kind: "person" | "organization"; url: string };
  pageUrl: string;
  imageUrl: string;
  publisherName: string;
  publisherLogo: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": input.format === "news" ? "NewsArticle" : "Article",
    headline: input.title,
    description: input.description,
    datePublished: dateTimeAttr(input.publishedAt),
    dateModified: dateTimeAttr(input.updatedAt ?? input.publishedAt),
    author: {
      "@type": input.author.kind === "person" ? "Person" : "Organization",
      name: input.author.name,
      url: input.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: input.publisherName,
      logo: input.publisherLogo,
    },
    mainEntityOfPage: input.pageUrl,
    image: input.imageUrl,
  };
}

/** パンくずの最後は href が無いので、今のページの canonical を item にする */
export function breadcrumbJsonLd(
  items: { label: string; href?: string }[],
  currentUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? new URL(item.href, currentUrl).href : currentUrl,
    })),
  };
}
