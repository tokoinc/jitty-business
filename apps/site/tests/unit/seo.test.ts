import { describe, expect, it } from "vitest";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  documentTitle,
  isIndexable,
  robotsTxt,
  sitemapEntries,
  sitemapXml,
  type SitemapSource,
} from "../../src/utils/seo";

const at = (value: string) => new Date(value);

function source(mode: "demo" | "production", base = "/"): SitemapSource {
  return {
    mode,
    origin: "https://example.com",
    base,
    articlesPerPage: 2,
    articles: [
      {
        id: "guide",
        publishedAt: at("2026-09-01T09:00:00+09:00"),
        updatedAt: at("2026-10-01T23:30:00Z"),
        categoryId: "work",
        tagIds: ["invoice"],
        seriesId: "basics",
        intent: "learn",
      },
      {
        id: "news",
        publishedAt: at("2026-08-01T09:00:00+09:00"),
        categoryId: "work",
        tagIds: ["invoice"],
        intent: "compare",
      },
      {
        id: "hidden",
        noindex: true,
        publishedAt: at("2026-07-01T09:00:00+09:00"),
        categoryId: "work",
        tagIds: ["tax"],
        intent: "do",
      },
      {
        id: "fake",
        sample: true,
        publishedAt: at("2026-11-01T09:00:00+09:00"),
        updatedAt: at("2026-12-01T09:00:00+09:00"),
        categoryId: "ghost",
        tagIds: ["ghost"],
        intent: "solve",
      },
    ],
    shelves: [{ id: "work" }, { id: "money" }, { id: "ghost" }, { id: "empty" }],
    tags: [{ id: "invoice" }, { id: "tax" }, { id: "ghost" }, { id: "unused" }],
    series: [{ id: "basics" }, { id: "other" }],
    glossary: [
      { id: "term-real", sample: false },
      { id: "term-sample", sample: true },
    ],
    authors: [
      { id: "person", sample: false },
      { id: "org", sample: true },
    ],
    intents: ["learn", "compare", "choose", "do", "solve"],
  };
}

describe("isIndexable", () => {
  it("demo ではどのページも index しない", () => {
    expect(isIndexable({ mode: "demo", kind: "home" })).toBe(false);
    expect(isIndexable({ mode: "demo", kind: "article" })).toBe(false);
  });

  it("production では通常のページを index し、search・noindex・sample を外す", () => {
    expect(isIndexable({ mode: "production", kind: "home" })).toBe(true);
    expect(isIndexable({ mode: "production", kind: "article" })).toBe(true);
    expect(isIndexable({ mode: "production", kind: "search" })).toBe(false);
    expect(isIndexable({ mode: "production", kind: "article", noindex: true })).toBe(false);
    expect(isIndexable({ mode: "production", kind: "article", sample: true })).toBe(false);
    expect(isIndexable({ mode: "production", kind: "page", noindex: true })).toBe(false);
  });
});

describe("documentTitle", () => {
  it("ホームはサイト名、ほかは題とサイト名", () => {
    expect(documentTitle("home", "ホーム", "Decision Desk Media")).toBe("Decision Desk Media");
    expect(documentTitle("article", "社会保険", "Decision Desk Media")).toBe("社会保険｜Decision Desk Media");
  });
});

describe("sitemapEntries", () => {
  it("demo では空", () => {
    expect(sitemapEntries(source("demo"))).toEqual([]);
  });

  it("production では index 対象だけを出し、sample・noindex・空のタグを除く", () => {
    const locs = sitemapEntries(source("production")).map((entry) => entry.loc);
    const expectPath = (path: string) => `https://example.com${path}`;
    expect(locs).toEqual([
      expectPath("/"),
      expectPath("/articles/"),
      expectPath("/articles/page/2/"),
      expectPath("/articles/guide/"),
      expectPath("/articles/news/"),
      expectPath("/category/"),
      expectPath("/category/work/"),
      expectPath("/category/work/page/2/"),
      expectPath("/purpose/"),
      expectPath("/purpose/learn/"),
      expectPath("/purpose/compare/"),
      expectPath("/purpose/choose/"),
      expectPath("/purpose/do/"),
      expectPath("/purpose/solve/"),
      expectPath("/tags/"),
      expectPath("/tags/invoice/"),
      expectPath("/tags/tax/"),
      expectPath("/series/basics/"),
      expectPath("/series/other/"),
      expectPath("/glossary/"),
      expectPath("/glossary/term-real/"),
      expectPath("/authors/person/"),
      expectPath("/about/"),
      expectPath("/disclosure/"),
      expectPath("/privacy/"),
      expectPath("/contact/"),
    ]);
    expect(locs.join("\n")).not.toMatch(
      /hidden|fake|ghost|unused|term-sample|\/authors\/org|search|bookmarks|styleguide/,
    );
  });

  it("lastmod は更新日を優先し、無ければ公開日を日本時間にする", () => {
    const entries = sitemapEntries(source("production"));
    const guide = entries.find((entry) => entry.loc.endsWith("/articles/guide/"));
    const news = entries.find((entry) => entry.loc.endsWith("/articles/news/"));
    const choose = entries.find((entry) => entry.loc.endsWith("/purpose/choose/"));
    expect(guide?.lastmod).toBe("2026-10-02");
    expect(news?.lastmod).toBe("2026-08-01");
    expect(choose?.lastmod).toBeUndefined();
  });

  it("base が /sub/ のとき loc に付く", () => {
    const locs = sitemapEntries(source("production", "/sub/")).map((entry) => entry.loc);
    expect(locs[0]).toBe("https://example.com/sub/");
    expect(locs).toContain("https://example.com/sub/articles/guide/");
  });
});

describe("sitemapXml と robotsTxt", () => {
  it("loc をエスケープし、lastmod が無い URL は lastmod を出さない", () => {
    const xml = sitemapXml([
      { loc: "https://example.com/a&b/", lastmod: "2026-10-02" },
      { loc: "https://example.com/c/" },
    ]);
    expect(xml).toContain("<loc>https://example.com/a&amp;b/</loc><lastmod>2026-10-02</lastmod>");
    expect(xml).toContain("<loc>https://example.com/c/</loc></url>");
    expect(xml).not.toContain("https://example.com/c/</loc><lastmod>");
  });

  it("robots は Allow と Sitemap だけで、Disallow しない", () => {
    const text = robotsTxt("https://example.com/sitemap.xml");
    expect(text).toBe("User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");
    expect(text).not.toContain("Disallow");
  });
});

describe("JSON-LD", () => {
  it("ニュースは NewsArticle、更新が無ければ dateModified は公開日", () => {
    const published = at("2026-08-01T09:00:00+09:00");
    const news = articleJsonLd({
      format: "news",
      title: "案内",
      description: "架空の案内です。実際の制度ではありません。",
      publishedAt: published,
      author: { name: "編集部", kind: "organization", url: "https://example.com/authors/org/" },
      pageUrl: "https://example.com/articles/news/",
      imageUrl: "https://example.com/og-default.png",
      publisherName: "Decision Desk Media 編集部",
      publisherLogo: "https://example.com/favicon.svg",
    });
    expect(news["@type"]).toBe("NewsArticle");
    expect(news.headline).toBe("案内");
    expect(news.datePublished).toBe(published.toISOString());
    expect(news.dateModified).toBe(published.toISOString());
    expect(news.author).toMatchObject({ "@type": "Organization", name: "編集部" });
  });

  it("パンくずの最後は今のページの URL になる", () => {
    const ld = breadcrumbJsonLd(
      [{ label: "ホーム", href: "/sub/" }, { label: "記事" }],
      "https://example.com/sub/articles/guide/",
    );
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://example.com/sub/" },
      { "@type": "ListItem", position: 2, name: "記事", item: "https://example.com/sub/articles/guide/" },
    ]);
  });
});
