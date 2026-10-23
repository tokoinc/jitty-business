import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { site } from "@/site.config";
import { getSiteData } from "@/utils/content";
import { absoluteUrl } from "@/utils/seo";

/** 公開記事の新しい順に20件。pubDate は公開日（並びと同じ意味） */
export const GET: APIRoute = async () => {
  const data = await getSiteData();
  return rss({
    title: site.name,
    description: site.description,
    site: absoluteUrl(site.url, site.base),
    customData: `<language>${site.lang}</language>`,
    items: data.articles.slice(0, 20).map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      link: absoluteUrl(site.url, site.base, `articles/${article.id}/`),
    })),
  });
};
