import type { APIRoute } from "astro";
import { site } from "@/site.config";
import { absoluteUrl, robotsTxt } from "@/utils/seo";

export const GET: APIRoute = () =>
  new Response(robotsTxt(absoluteUrl(site.url, site.base, "sitemap.xml")), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
