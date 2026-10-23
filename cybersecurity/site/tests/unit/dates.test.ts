import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(buildTime: string) {
  vi.stubEnv("DD_BUILD_TIME", buildTime);
  vi.resetModules();
  return import("../../src/utils/dates.ts");
}

describe("checkedBucket", () => {
  it("最終確認日を 30日・90日・それ以前に排他で分ける", async () => {
    // 2026-10-08 12:00 JST。daysSince は確認日の終わりから数える
    const { checkedBucket, daysSince } = await load("2026-10-08T03:00:00.000Z");
    expect(checkedBucket()).toBeUndefined();
    expect(checkedBucket("")).toBeUndefined();
    expect(daysSince("2026-10-08")).toBeLessThanOrEqual(30);
    expect(checkedBucket("2026-10-08")).toBe("30日以内");
    expect(daysSince("2026-09-07")).toBe(30);
    expect(checkedBucket("2026-09-07")).toBe("30日以内");
    expect(daysSince("2026-09-06")).toBe(31);
    expect(checkedBucket("2026-09-06")).toBe("90日以内");
    expect(daysSince("2026-07-09")).toBe(90);
    expect(checkedBucket("2026-07-09")).toBe("90日以内");
    expect(daysSince("2026-07-08")).toBe(91);
    expect(checkedBucket("2026-07-08")).toBe("それ以前");
  });
});
