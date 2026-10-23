import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadHref(base: string) {
  vi.stubEnv("BASE_URL", base);
  vi.resetModules();
  const { href } = await import("../../src/utils/url.ts");
  return href;
}

describe("href", () => {
  it("末尾スラッシュを付け、ファイル・クエリ・ハッシュはそのまま", async () => {
    const href = await loadHref("/");
    expect(href("articles/sample")).toBe("/articles/sample/");
    expect(href("/articles/sample/")).toBe("/articles/sample/");
    expect(href("rss.xml")).toBe("/rss.xml");
    expect(href("search?q=保険料")).toBe("/search?q=保険料");
    expect(href("page#section")).toBe("/page#section");
  });

  it("base を前置する", async () => {
    const href = await loadHref("/sub/");
    expect(href("articles/sample")).toBe("/sub/articles/sample/");
    expect(href("rss.xml")).toBe("/sub/rss.xml");
    expect(href("search?q=1")).toBe("/sub/search?q=1");
  });

  it("末尾スラッシュの無い base もそろえる", async () => {
    const href = await loadHref("/sub");
    expect(href("articles/sample")).toBe("/sub/articles/sample/");
  });
});
