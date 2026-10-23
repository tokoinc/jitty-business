import { describe, expect, it } from "vitest";
import { formatPrice, formatRate } from "../../src/utils/numbers.ts";

describe("formatPrice", () => {
  it("0円と未確認を区別する", () => {
    expect(formatPrice({ amount: 0, period: "once", tax: "not-applicable" })).toBe("0円");
    expect(formatPrice({ amount: null, period: "month", tax: "included" })).toBe("未確認");
  });

  it("税込・税別と期間を付ける", () => {
    expect(formatPrice({ amount: 1078, period: "month", tax: "included" })).toBe("1,078円／月（税込）");
    expect(formatPrice({ amount: 11880, period: "year", tax: "excluded" })).toBe("11,880円／年（税別）");
    expect(formatPrice({ amount: 100, period: "transaction", tax: "excluded" })).toBe("100円／件（税別）");
  });
});

describe("formatRate", () => {
  it("範囲と年率を表す", () => {
    expect(formatRate({ min: 3.25, max: 3.6, unit: "percent" })).toBe("3.25〜3.6%");
    expect(formatRate({ min: 1.5, unit: "annual-percent" })).toBe("1.5%（年率）");
    expect(formatRate({ min: 2, max: 2, unit: "percent" })).toBe("2%");
  });
});
