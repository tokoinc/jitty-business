import { describe, expect, it } from "vitest";
import {
  PROTECT_ARTICLE_ID,
  SURVEY_ARTICLE_ID,
  protectGuideOpen,
  protectReading,
  storiesOpen,
  storyGroups,
  type ThemeArticle,
} from "../../src/utils/themes";

function article(id: string, format = "guide", categoryId = "compare"): ThemeArticle {
  return { id, format, categoryId };
}

describe("storiesOpen", () => {
  it("公開記事が空なら false", () => {
    expect(storiesOpen([])).toBe(false);
  });

  it("アンケート、または interview があるとき true", () => {
    expect(storiesOpen([article(SURVEY_ARTICLE_ID, "guide", "compare")])).toBe(true);
    expect(storiesOpen([article("a-voice", "interview", "independence")])).toBe(true);
  });

  it("関係のない公開記事だけでは false", () => {
    expect(storiesOpen([article("before-leaving-checklist", "guide", "before-leaving")])).toBe(false);
  });
});

describe("protectGuideOpen", () => {
  it("公開記事が空なら false", () => {
    expect(protectGuideOpen([])).toBe(false);
  });

  it("TD-19 があるとき true", () => {
    expect(protectGuideOpen([article(PROTECT_ARTICLE_ID)])).toBe(true);
  });

  it("関連記事だけでは false", () => {
    expect(protectGuideOpen([article("living-costs-and-retirement-money", "guide", "before-leaving")])).toBe(false);
    expect(protectGuideOpen([article("franchise-contract-checklist", "guide", "independence")])).toBe(false);
  });
});

describe("storyGroups", () => {
  it("アンケートは一度だけ出し、取材は独立と転職に分ける", () => {
    const groups = storyGroups([
      article(SURVEY_ARTICLE_ID, "guide", "compare"),
      article("ind-voice", "interview", "independence"),
      article("career-voice", "interview", "career-change"),
      article("other-voice", "interview", "before-leaving"),
      article("not-a-story", "guide", "independence"),
    ]);
    expect(groups.survey?.id).toBe(SURVEY_ARTICLE_ID);
    expect(groups.independence.map((item) => item.id)).toEqual(["ind-voice"]);
    expect(groups.career.map((item) => item.id)).toEqual(["career-voice"]);
    expect(groups.other.map((item) => item.id)).toEqual(["other-voice"]);
  });

  it("アンケートが取材形式でも独立の列には重ねない", () => {
    const groups = storyGroups([article(SURVEY_ARTICLE_ID, "interview", "independence")]);
    expect(groups.survey?.id).toBe(SURVEY_ARTICLE_ID);
    expect(groups.independence).toEqual([]);
  });
});

describe("protectReading", () => {
  it("TD-19 が無いときは空", () => {
    expect(protectReading([article("franchise-contract-checklist")])).toEqual([]);
  });

  it("TD-19 を先頭に、公開中の関連だけを TD-11、12、23、25 の順で返す", () => {
    expect(
      protectReading([
        article("living-costs-and-retirement-money"),
        article("unrelated"),
        article(PROTECT_ARTICLE_ID),
        article("housing-loan-after-early-retirement"),
        article("franchise-contract-checklist"),
      ]),
    ).toEqual([
      PROTECT_ARTICLE_ID,
      "franchise-contract-checklist",
      "housing-loan-after-early-retirement",
      "living-costs-and-retirement-money",
    ]);
  });
});
