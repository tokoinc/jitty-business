import { afterEach, describe, expect, it, vi } from "vitest";
import { parseBookmarks, parseResume, read } from "../../src/scripts/store";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubStorage(raw: string | null) {
  vi.stubGlobal("document", {
    documentElement: { dataset: { storageNs: "tenshoku-dokuritsu:v1" } },
  });
  vi.stubGlobal("localStorage", {
    getItem: () => raw,
    setItem: () => {},
  });
}

describe("parseBookmarks", () => {
  it("配列でない値は null", () => {
    expect(parseBookmarks(null)).toBeNull();
    expect(parseBookmarks({ version: 9 })).toBeNull();
    expect(parseBookmarks("nope")).toBeNull();
  });

  it("ID の形が違う項目を外し、201件は先頭200件にする", () => {
    const items = [
      { id: "bad id", savedAt: "2026-01-01T00:00:00.000Z" },
      { id: "ok", savedAt: 1 },
      ...Array.from({ length: 201 }, (_, i) => ({
        id: `item-${i}`,
        savedAt: `2026-01-01T00:00:${String(i).padStart(2, "0")}.000Z`,
      })),
    ];
    const parsed = parseBookmarks(items);
    expect(parsed).toHaveLength(200);
    expect(parsed?.[0]?.id).toBe("item-0");
    expect(parsed?.[199]?.id).toBe("item-199");
    expect(parsed?.some((item) => item.id === "item-200")).toBe(false);
  });
});

describe("parseResume", () => {
  it("オブジェクトでない値は null、版だけ違うオブジェクトは空", () => {
    expect(parseResume(null)).toBeNull();
    expect(parseResume("nope")).toBeNull();
    expect(parseResume({ version: 9 })).toEqual({});
  });

  it("180日より古い位置と、見出しの無い位置を捨てる", () => {
    const fresh = new Date(Date.now() - 86_400_000).toISOString();
    const old = new Date(Date.now() - 181 * 86_400_000).toISOString();
    expect(
      parseResume({
        "old-article": { headingId: "intro", ratio: 0.2, at: old },
        "new-article": { headingId: "intro", ratio: 0.4, at: fresh },
        "bad id": { headingId: "intro", ratio: 0.1, at: fresh },
        "no-heading": { ratio: 1, at: fresh },
      }),
    ).toEqual({
      "new-article": { headingId: "intro", ratio: 0.4, at: fresh },
    });
  });
});

describe("read", () => {
  it("壊れたJSONは null", () => {
    stubStorage("{");
    expect(read("bookmarks", parseBookmarks)).toBeNull();
    expect(read("resume", parseResume)).toBeNull();
  });

  it("version が違うオブジェクトはブックマークでは null", () => {
    stubStorage(JSON.stringify({ version: 9 }));
    expect(read("bookmarks", parseBookmarks)).toBeNull();
    expect(read("resume", parseResume)).toEqual({});
  });
});

describe("保存値の詰め直し", () => {
  const fresh = new Date(Date.now() - 86_400_000).toISOString();

  it("ブックマークは id と savedAt だけを返す", () => {
    expect(parseBookmarks([{ id: "ok", savedAt: fresh, extra: "<img src=x>" }])).toEqual([
      { id: "ok", savedAt: fresh },
    ]);
  });

  it("続きの位置は項目を詰め直し、ratio を 0〜1 に収める", () => {
    expect(
      parseResume({
        high: { headingId: "intro", ratio: 9, at: fresh, extra: 1 },
        low: { headingId: "intro", ratio: -1, at: fresh },
      }),
    ).toEqual({
      high: { headingId: "intro", ratio: 1, at: fresh },
      low: { headingId: "intro", ratio: 0, at: fresh },
    });
  });

  it("有限でない ratio、長すぎる見出し id、__proto__ のキーを捨てる", () => {
    const parsed = parseResume(
      JSON.parse(
        JSON.stringify({
          inf: { headingId: "intro", ratio: 0.5, at: fresh },
          long: { headingId: "h".repeat(201), ratio: 0.5, at: fresh },
        })
          .replace('"ratio":0.5', '"ratio":1e999')
          .replace(/^\{/, `{"__proto__":{"headingId":"intro","ratio":0.5,"at":"${fresh}"},`),
      ),
    );
    expect(parsed).toEqual({});
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });
});
