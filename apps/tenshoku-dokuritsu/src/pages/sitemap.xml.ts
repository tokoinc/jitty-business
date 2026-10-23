import type { APIRoute } from "astro";
import { site } from "@/site.config";
import { getSiteData } from "@/utils/content";
import { ALL_INTENTS } from "@/utils/labels";
import { sitemapEntries, sitemapXml } from "@/utils/seo";
import { protectGuideOpen, storiesOpen, toThemeArticles } from "@/utils/themes";

export const GET: APIRoute = async () => {
  const data = await getSiteData();
  const theme = toThemeArticles(data.articles);
  const xml = sitemapXml(
    sitemapEntries({
      mode: site.mode,
      origin: site.url,
      base: site.base,
      articlesPerPage: site.articlesPerPage,
      articles: data.articles.map((article) => ({
        id: article.id,
        noindex: article.data.noindex,
        sample: article.data.sample,
        publishedAt: article.data.publishedAt,
        updatedAt: article.data.updatedAt,
        categoryId: article.data.category.id,
        tagIds: article.data.tags.map((tag) => tag.id),
        seriesId: article.data.series?.id.id,
        intent: article.data.intent,
      })),
      shelves: data.shelves.map((shelf) => ({ id: shelf.id })),
      tags: data.tags.map((tag) => ({ id: tag.id })),
      series: data.series.map((item) => ({ id: item.id })),
      glossary: data.glossary.map((entry) => ({ id: entry.id, sample: entry.data.sample })),
      authors: data.authors.map((author) => ({ id: author.id, sample: author.data.sample })),
      intents: [...ALL_INTENTS],
      stories: storiesOpen(theme),
      protectGuide: protectGuideOpen(theme),
    }),
  );
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
