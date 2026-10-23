import { describe, expect, it } from "vitest";
import { compareReading, decodeAttr, kanaRow } from "../../src/utils/text.ts";

describe("kanaRow", () => {
  it("先頭の文字から五十音の行を返す", () => {
    expect(kanaRow("あそび")).toBe("あ");
    expect(kanaRow("かいぎょう")).toBe("か");
    expect(kanaRow("やゆよ")).toBe("や");
    expect(kanaRow("を")).toBe("わ");
  });

  it("濁音・半濁音・小書きは清音の行にする", () => {
    expect(kanaRow("ぎょうむいたく")).toBe("か");
    expect(kanaRow("じどう")).toBe("さ");
    expect(kanaRow("だんかい")).toBe("た");
    expect(kanaRow("ぱそこん")).toBe("は");
    expect(kanaRow("ゃくわり")).toBe("や");
    expect(kanaRow("ってん")).toBe("た");
  });
});

describe("compareReading", () => {
  it("清音のあとに濁音が来る五十音順", () => {
    const readings = ["ぜい", "せいきゅうしょ", "しゃかいほけん", "かかく"];
    expect([...readings].sort(compareReading)).toEqual(["かかく", "しゃかいほけん", "せいきゅうしょ", "ぜい"]);
  });
});

describe("decodeAttr", () => {
  it("Astro が属性値に付けたエスケープを戻す", () => {
    expect(decodeAttr("A&amp;B")).toBe("A&B");
    expect(decodeAttr("&lt;b&gt;")).toBe("<b>");
    expect(decodeAttr("&quot;x&#39;&#x27;")).toBe(`"x''`);
  });

  it("1回だけ戻す。知らない実体参照は残す", () => {
    expect(decodeAttr("&amp;lt;")).toBe("&lt;");
    expect(decodeAttr("a&nbsp;b")).toBe("a&nbsp;b");
  });
});
