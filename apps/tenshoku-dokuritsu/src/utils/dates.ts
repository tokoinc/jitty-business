/** build の基準時刻。一つの build の中で固定する */
export const BUILD_TIME = new Date(process.env.DD_BUILD_TIME ?? Date.now());

const parts = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(`${d}T12:00:00+09:00`) : d;
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}.${p.month}.${p.day}`;
}

const dateTimeParts = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 発生日時・確認時点・履歴。JST の「2026.10.03 15:00」 */
export function formatDateTime(d: Date): string {
  const p = Object.fromEntries(dateTimeParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/** `<time datetime>`。日付だけはそのまま、日時は ISO */
export function dateTimeAttr(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}
/** "YYYY-MM-DD" を JST のその日の終わりとして扱う */
export const endOfDay = (day: string) => new Date(`${day}T23:59:59+09:00`);
export const isOverdue = (due?: string) => !!due && endOfDay(due) < BUILD_TIME;
export const daysSince = (day: string) =>
  Math.floor((BUILD_TIME.getTime() - endOfDay(day).getTime()) / 86400000);

export type CheckedBucket = "30日以内" | "90日以内" | "それ以前";

/** 最終確認日を検索の確認日で排他に分ける。日付が無い記事には付けない */
export function checkedBucket(day?: string): CheckedBucket | undefined {
  if (!day) return undefined;
  const n = daysSince(day);
  if (n <= 30) return "30日以内";
  if (n <= 90) return "90日以内";
  return "それ以前";
}
