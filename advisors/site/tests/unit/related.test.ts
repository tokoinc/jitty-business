import { describe, expect, it, vi } from "vitest";
import type { Article, SiteData } from "../../src/utils/content";

vi.mock("astro:content", () => ({ getCollection: vi.fn() }));

const { nextSteps } = await import("../../src/utils/related.ts");

type Intent = Article["data"]["intent"];
type Format = Article["data"]["format"];

function article(opts: {
  id: string;
  category?: string;
  tags?: string[];
  format?: Format;
  intent?: Intent;
  publishedAt?: string;
  series?: { id: string; order: number };
  nextSteps?: { id: string; role: "primary" | "detour"; purpose: Intent; reason: string }[];
}): Article {
  return {
    id: opts.id,
    data: {
      category: { id: opts.category ?? "work" },
      tags: (opts.tags ?? []).map((id) => ({ id })),
      format: opts.format ?? "guide",
      intent: opts.intent ?? "learn",
      publishedAt: new Date(opts.publishedAt ?? "2026-09-01T09:00:00+09:00"),
      series: opts.series ? { id: { id: opts.series.id }, order: opts.series.order } : undefined,
      nextSteps: (opts.nextSteps ?? []).map((step) => ({
        article: { id: step.id },
        role: step.role,
        purpose: step.purpose,
        reason: step.reason,
      })),
    },
  } as Article;
}

function site(articles: Article[], all: Article[] = articles): SiteData {
  return {
    all,
    articles,
    byId: new Map(articles.map((item) => [item.id, item])),
    categories: [
      { id: "work", data: { label: "仕事" } },
      { id: "business", data: { label: "ビジネス" } },
      { id: "finance", data: { label: "お金" } },
    ],
    tags: [
      { id: "invoice", data: { label: "請求書" } },
      { id: "pricing", data: { label: "価格" } },
      { id: "contract", data: { label: "契約" } },
    ],
    shelves: [],
    series: [],
    authors: [],
    glossary: [],
    sources: [],
    products: [],
  } as unknown as SiteData;
}

describe("nextSteps", () => {
  it("手動の配列順を役割ごとに保つ", () => {
    const primary = article({ id: "primary" });
    const first = article({ id: "first" });
    const second = article({ id: "second" });
    const extra = article({ id: "extra", publishedAt: "2026-10-01T09:00:00+09:00" });
    const current = article({
      id: "current",
      nextSteps: [
        { id: "first", role: "detour", purpose: "learn", reason: "先の補助" },
        { id: "primary", role: "primary", purpose: "do", reason: "手動の主" },
        { id: "second", role: "detour", purpose: "compare", reason: "後の補助" },
      ],
    });
    const picks = nextSteps(current, site([current, primary, first, second, extra]));
    expect(picks.map((pick) => pick.article.id)).toEqual(["primary", "first", "second"]);
    expect(picks.map((pick) => pick.role)).toEqual(["primary", "detour", "detour"]);
    expect(picks.map((pick) => pick.reason)).toEqual(["手動の主", "先の補助", "後の補助"]);
  });

  it("自分自身と非公開を出さない", () => {
    const hidden = article({
      id: "hidden",
      tags: ["contract"],
      publishedAt: "2026-10-02T09:00:00+09:00",
    });
    const other = article({ id: "other", publishedAt: "2026-09-15T09:00:00+09:00" });
    const current = article({
      id: "current",
      tags: ["contract"],
      nextSteps: [
        { id: "current", role: "primary", purpose: "learn", reason: "自分自身" },
        { id: "hidden", role: "detour", purpose: "learn", reason: "非公開" },
      ],
    });
    const picks = nextSteps(current, site([current, other], [current, other, hidden]));
    expect(picks.map((pick) => [pick.role, pick.article.id])).toEqual([["primary", "other"]]);
  });

  it("候補が無ければ空", () => {
    const current = article({ id: "current", category: "work" });
    const far = article({ id: "far", category: "business" });
    expect(nextSteps(current, site([current, far]))).toEqual([]);
  });

  it("連載の次の回を主候補にする", () => {
    const current = article({
      id: "ep1",
      category: "business",
      series: { id: "serial", order: 1 },
      publishedAt: "2026-09-01T09:00:00+09:00",
    });
    const next = article({
      id: "ep2",
      category: "finance",
      intent: "solve",
      series: { id: "serial", order: 2 },
      publishedAt: "2026-08-01T09:00:00+09:00",
    });
    const later = article({
      id: "ep4",
      category: "finance",
      series: { id: "serial", order: 4 },
      publishedAt: "2026-10-01T09:00:00+09:00",
    });
    const picks = nextSteps(current, site([current, later, next]));
    expect(picks[0]?.article.id).toBe("ep2");
    expect(picks[0]).toMatchObject({ role: "primary", purpose: "solve", reason: "連載の次の回" });
    expect(picks.find((pick) => pick.article.id === "ep4")).toMatchObject({
      role: "detour",
      reason: "同じ連載の別の回",
    });
  });

  it("同点は新しい順", () => {
    const current = article({ id: "current", publishedAt: "2026-07-01T09:00:00+09:00" });
    const older = article({
      id: "older",
      format: "tutorial",
      intent: "do",
      publishedAt: "2026-09-01T09:00:00+09:00",
    });
    const newer = article({
      id: "newer",
      format: "guide",
      intent: "learn",
      publishedAt: "2026-10-01T09:00:00+09:00",
    });
    const picks = nextSteps(current, site([current, older, newer]));
    expect(picks.map((pick) => pick.article.id)).toEqual(["newer", "older"]);
    expect(picks[0]?.role).toBe("primary");
    expect(picks.map((pick) => pick.reason)).toEqual([
      "同じ棚「仕事」の解説記事",
      "同じ棚「仕事」の実務記事",
    ]);
  });
});
