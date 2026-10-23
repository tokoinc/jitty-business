import { describe, expect, it } from "vitest";
import { pageHref, pageSlice } from "../../src/utils/paginate";

describe("pageSlice", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("指定したページの範囲を返す", () => {
    expect(pageSlice(items, 1, 2)).toEqual({ items: ["a", "b"], page: 1, total: 3 });
    expect(pageSlice(items, 2, 2)).toEqual({ items: ["c", "d"], page: 2, total: 3 });
    expect(pageSlice(items, 3, 2)).toEqual({ items: ["e"], page: 3, total: 3 });
  });

  it("0件でも1ページとして扱う", () => {
    expect(pageSlice([], 1, 12)).toEqual({ items: [], page: 1, total: 1 });
  });
});

describe("pageHref", () => {
  it("1ページ目は base、2ページ目以降は page の下", () => {
    expect(pageHref("articles/", 1)).toBe("articles/");
    expect(pageHref("articles/", 2)).toBe("articles/page/2/");
    expect(pageHref("category/finance/", 3)).toBe("category/finance/page/3/");
  });
});
