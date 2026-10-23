import type { APIRoute } from "astro";
import { getSiteData } from "@/utils/content";
import { articleHref } from "@/utils/url";

const tokyoDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 保存一覧とホームの読みかけが題を引く、公開記事だけの索引。本文は入れない。 */
export const GET: APIRoute = async () => {
  const d = await getSiteData();
  const items = d.articles.map((a) => {
    const c = d.categories.find((x) => x.id === a.data.category.id);
    if (!c) throw new Error(`articles/${a.id}: 棚 ${a.data.category.id} がない`);
    const date = a.data.format === "news" && a.data.eventAt ? a.data.eventAt : a.data.publishedAt;
    return {
      id: a.id,
      title: a.data.title,
      href: articleHref(a.id),
      shelf: { label: c.data.label, slot: c.data.tabSlot ?? 1 },
      format: a.data.format,
      date: tokyoDay.format(date),
    };
  });
  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
