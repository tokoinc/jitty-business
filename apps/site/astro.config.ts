import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import designSet from "./integrations/design-set";
import { site, siteDir, siteSlug, validateSite } from "./src/site.config";

validateSite(site);

export default defineConfig({
  site: site.url,
  base: site.base,
  outDir: site.outDir,
  // content の data store はここに入る。DD_SITE を切り替えたとき、前のサイトの記事を使わせない
  cacheDir: `./node_modules/.astro/${siteSlug}`,
  trailingSlash: "always",
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  // ハッシュは build がページごとに meta へ入れる。frame-ancestors は public/_headers（ADR-0013）
  security: {
    csp: {
      directives: ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "img-src 'self' data:"],
      scriptDirective: {
        resources: ["'self'", "'wasm-unsafe-eval'"],
      },
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  integrations: [designSet({ set: site.design.designSet, finish: site.design.finish, inspect: site.inspect }), mdx()],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { "@site": siteDir } },
    build: {
      // 4KB 未満のスクリプトを HTML に埋め込まない。識別検査のスクリプトが2つ目の inline になる（ADR-0012・0013）
      assetsInlineLimit(filePath) {
        if (filePath.endsWith(".js")) return false;
      },
    },
  },
});
