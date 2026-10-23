/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    dd?: {
      article: import("./utils/content").Article;
      data: import("./utils/content").SiteData;
      h2: { id: string; text: string }[];
    };
  }
}
