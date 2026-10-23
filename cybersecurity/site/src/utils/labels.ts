export const FORMAT_LABELS = {
  guide: "解説",
  tutorial: "実務",
  comparison: "比較",
  news: "ニュース",
  opinion: "論考",
  interview: "人物",
} as const;
export const ALL_INTENTS = ["learn", "compare", "choose", "do", "solve"] as const;
type IntentId = (typeof ALL_INTENTS)[number];
export const INTENT_LABELS = {
  learn: { short: "知る", nav: "知りたい", lead: "仕組みや条件を、出典を添えて読む記事です。" },
  compare: { short: "比べる", nav: "比べたい", lead: "複数の選択肢を、同じ項目で並べて比べる記事です。" },
  choose: { short: "選ぶ", nav: "選びたい", lead: "選ぶときに外してはいけない条件を整理した記事です。" },
  do: { short: "実行する", nav: "手順を調べたい", lead: "手続きや作業を、順番に進めるための記事です。" },
  solve: {
    short: "解く",
    nav: "困りごとを解きたい",
    lead: "困りごとの切り分けと、次に確かめる先を示す記事です。",
  },
} as const satisfies Record<IntentId, { short: string; nav: string; lead: string }>;
export const NAV_INTENTS = ["learn", "compare", "do"] as const satisfies readonly IntentId[]; // 索引に出す目的

export const AUTHOR_KIND_LABELS = {
  person: "個人",
  organization: "組織",
} as const;

export function isIntent(value: string): value is IntentId {
  return (ALL_INTENTS as readonly string[]).includes(value);
}
