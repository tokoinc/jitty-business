import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => ({ getCollection: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const BUILD = "2026-10-06T09:00:00+09:00";

async function loadIsPublished(mode: "demo" | "production") {
  vi.stubEnv("DD_MODE", mode);
  vi.stubEnv("DD_BUILD_TIME", BUILD);
  vi.resetModules();
  const { isPublished } = await import("../../src/utils/content.ts");
  return isPublished;
}

function entry(data: { draft?: boolean; publishedAt: string; sample?: boolean }) {
  return {
    id: "sample",
    data: {
      draft: data.draft ?? false,
      publishedAt: new Date(data.publishedAt),
      sample: data.sample ?? false,
    },
  } as never;
}

describe("isPublished", () => {
  it("draft は公開しない", async () => {
    const isPublished = await loadIsPublished("demo");
    expect(isPublished(entry({ draft: true, publishedAt: "2026-09-01T09:00:00+09:00" }))).toBe(false);
  });

  it("基準時刻より未来の記事は公開しない", async () => {
    const isPublished = await loadIsPublished("demo");
    expect(isPublished(entry({ publishedAt: "2026-10-07T09:00:00+09:00" }))).toBe(false);
  });

  it("基準時刻以前の記事は公開する", async () => {
    const isPublished = await loadIsPublished("demo");
    expect(isPublished(entry({ publishedAt: "2026-10-04T09:00:00+09:00" }))).toBe(true);
  });

  it("demo では sample を公開する", async () => {
    const isPublished = await loadIsPublished("demo");
    expect(isPublished(entry({ publishedAt: "2026-09-01T09:00:00+09:00", sample: true }))).toBe(true);
  });

  it("production では sample を公開しない", async () => {
    const isPublished = await loadIsPublished("production");
    expect(isPublished(entry({ publishedAt: "2026-09-01T09:00:00+09:00", sample: true }))).toBe(false);
  });

  it("production でも sample でない記事は公開する", async () => {
    const isPublished = await loadIsPublished("production");
    expect(isPublished(entry({ publishedAt: "2026-09-01T09:00:00+09:00", sample: false }))).toBe(true);
  });
});
