/** 体験談と退職金案内を出すかどうか。公開中の記事の ID・形式・カテゴリだけを見る。 */

export const SURVEY_ARTICLE_ID = "survey-after-early-retirement";
export const PROTECT_ARTICLE_ID = "protect-retirement-money";

/** 設計書 §3。TD-19 のあと、TD-11、TD-12、TD-23、TD-25 の順 */
export const PROTECT_RELATED_IDS = [
  "franchise-contract-checklist",
  "small-business-acquisition",
  "housing-loan-after-early-retirement",
  "living-costs-and-retirement-money",
] as const;

/** A/B/C のハブ。体験談と退職金案内へのリンクを置くカテゴリ */
export const THEME_SHELF_IDS = ["compare", "independence", "career-change"] as const;

export const STORIES_PATH = "stories/";
export const PROTECT_GUIDE_PATH = "guides/protect-retirement-money/";

export interface ThemeArticle {
  id: string;
  format: string;
  categoryId: string;
}

export function toThemeArticles(
  articles: readonly { id: string; data: { format: string; category: { id: string } } }[],
): ThemeArticle[] {
  return articles.map((article) => ({
    id: article.id,
    format: article.data.format,
    categoryId: article.data.category.id,
  }));
}

export function storiesOpen(articles: readonly ThemeArticle[]): boolean {
  return articles.some((article) => article.id === SURVEY_ARTICLE_ID || article.format === "interview");
}

export function protectGuideOpen(articles: readonly { id: string }[]): boolean {
  return articles.some((article) => article.id === PROTECT_ARTICLE_ID);
}

export function themeShelf(id: string): boolean {
  return (THEME_SHELF_IDS as readonly string[]).includes(id);
}

export interface StoryGroups<T extends ThemeArticle = ThemeArticle> {
  survey?: T;
  independence: T[];
  career: T[];
  other: T[];
}

/** アンケートは一度だけ。取材は独立と転職に分け、どちらでもない取材は other */
export function storyGroups<T extends ThemeArticle>(articles: readonly T[]): StoryGroups<T> {
  const survey = articles.find((article) => article.id === SURVEY_ARTICLE_ID);
  const voices = articles.filter((article) => article.id !== SURVEY_ARTICLE_ID && article.format === "interview");
  return {
    survey,
    independence: voices.filter((article) => article.categoryId === "independence"),
    career: voices.filter((article) => article.categoryId === "career-change"),
    other: voices.filter((article) => article.categoryId !== "independence" && article.categoryId !== "career-change"),
  };
}

export function storyArticleIds(articles: readonly ThemeArticle[]): string[] {
  const groups = storyGroups(articles);
  return [
    ...(groups.survey ? [groups.survey.id] : []),
    ...groups.independence.map((article) => article.id),
    ...groups.career.map((article) => article.id),
    ...groups.other.map((article) => article.id),
  ];
}

/** TD-19 が無いときは空。あるときは TD-19 を先頭に、公開中の関連だけを読む順で返す */
export function protectReading(articles: readonly { id: string }[]): string[] {
  const ids = new Set(articles.map((article) => article.id));
  if (!ids.has(PROTECT_ARTICLE_ID)) return [];
  return [PROTECT_ARTICLE_ID, ...PROTECT_RELATED_IDS.filter((id) => ids.has(id))];
}
