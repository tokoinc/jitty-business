/** 移行カレンダーの日付計算。画面の読み書きは src/scripts/calendar.ts。 */

export type Work = "independence" | "career-change" | "undecided";
export type Insurance = "voluntary" | "national" | "dependent" | "employer" | "undecided";
export type Benefit = "consider" | "decline" | "undecided";
export type Tri = "yes" | "no" | "unknown";

export interface CalendarInput {
  retirementDate: string | null;
  work: Work;
  openingDate: string | null;
  joiningDate: string | null;
  insurance: Insurance;
  benefit: Benefit;
  dc: Tri;
  lossDateKnown: boolean;
  spouse: Tri;
}

export interface CalendarArticle {
  slug: string;
  title: string;
  href?: string | null;
}

interface Gate<T extends string> {
  show: T[];
  required: T[];
}

export interface CalendarRule {
  id: string;
  order: number;
  title: string;
  applies?: {
    work?: Gate<Work>;
    insurance?: Gate<Insurance>;
    benefit?: Gate<Benefit>;
    dc?: Gate<Tri>;
    spouse?: Gate<Tri>;
  };
  anchor: "retirement" | "opening" | "joining" | "loss" | "none";
  rule: "unverified" | "next-year-march-15" | "same-year-march-15" | "within-two-months";
  openingWindow?: "jan-1-to-15" | "on-or-after-jan-16";
  holiday: "confirm-at-counter" | "none";
  sources?: string[];
  checkedAt?: string;
  reviewDueAt?: string;
  articles?: CalendarArticle[];
  status: "verified" | "unverified";
  kind: "statutory" | "recommended" | "confirm";
  office: string;
  audience: string;
  spouseAudience?: { yes: string; unknown: string };
  lossUnknown?: { office: string; audience: string };
}

export interface CalendarResult {
  id: string;
  title: string;
  audience: string;
  timing: string;
  date: string | null;
  office: string;
  articles: { slug: string; title: string; href: string | null }[];
  required: boolean;
  ics: string | null;
  googleUrl: string | null;
}

const KIND_LABEL = {
  statutory: "法令等の期限",
  recommended: "推奨時期",
  confirm: "窓口への確認が必要",
} as const;

const HOLIDAY_NOTE = "窓口で休日の扱いを確認する";

export function evaluate(rules: CalendarRule[], input: CalendarInput): CalendarResult[] {
  return [...rules]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .flatMap((rule) => {
      const row = rowFor(rule, input);
      return row ? [row] : [];
    });
}

function rowFor(rule: CalendarRule, input: CalendarInput): CalendarResult | null {
  const visibility = visible(rule, input);
  if (!visibility.show) return null;
  if (rule.openingWindow && input.openingDate && isIso(input.openingDate)) {
    if (!inWindow(input.openingDate, rule.openingWindow)) return null;
  }
  const date = dueDate(rule, input);
  const audience = audienceFor(rule, input, visibility.required);
  const office = officeFor(rule, input);
  return {
    id: rule.id,
    title: rule.title,
    audience,
    timing: timingFor(rule, date),
    date,
    office,
    articles: (rule.articles ?? []).map((article) => ({
      slug: article.slug,
      title: article.title,
      href: article.href ?? null,
    })),
    required: visibility.required,
    ics: date ? icsEvent(rule.title, date) : null,
    googleUrl: date ? googleTemplateUrl(rule.title, date) : null,
  };
}

function visible(rule: CalendarRule, input: CalendarInput): { show: boolean; required: boolean } {
  const checks = [
    matches(rule.applies?.work, input.work),
    matches(rule.applies?.insurance, input.insurance),
    matches(rule.applies?.benefit, input.benefit),
    matches(rule.applies?.dc, input.dc),
    matches(rule.applies?.spouse, input.spouse),
  ];
  return {
    show: checks.every((check) => check.show),
    required: checks.every((check) => check.required),
  };
}

function matches<T extends string>(
  gate: Gate<T> | undefined,
  value: T,
): { show: boolean; required: boolean } {
  if (!gate) return { show: true, required: true };
  return { show: gate.show.includes(value), required: gate.required.includes(value) };
}

function audienceFor(rule: CalendarRule, input: CalendarInput, required: boolean): string {
  let text = rule.audience;
  if (rule.spouseAudience && input.spouse === "yes") text = rule.spouseAudience.yes;
  if (rule.spouseAudience && input.spouse === "unknown") text = rule.spouseAudience.unknown;
  if (rule.anchor === "loss" && !input.lossDateKnown && rule.lossUnknown) text = rule.lossUnknown.audience;
  return required ? text : `候補。必須ではない。${text}`;
}

function officeFor(rule: CalendarRule, input: CalendarInput): string {
  if (rule.anchor === "loss" && !input.lossDateKnown && rule.lossUnknown) return rule.lossUnknown.office;
  return rule.office;
}

/** 未確認ルールは日付を出さない。確認済みでも、ページに祝日の一覧が無いので日付はずらさない。 */
function dueDate(rule: CalendarRule, input: CalendarInput): string | null {
  if (rule.status !== "verified" || rule.rule === "unverified") return null;
  if (rule.anchor !== "opening" || !input.openingDate || !isIso(input.openingDate)) return null;
  const { y } = parseIso(input.openingDate);
  if (rule.rule === "next-year-march-15") return formatIso(y + 1, 3, 15);
  if (rule.rule === "same-year-march-15") return formatIso(y, 3, 15);
  if (rule.rule === "within-two-months") return dayBeforeCorrespondingMonth(input.openingDate, 2);
  return null;
}

function timingFor(rule: CalendarRule, date: string | null): string {
  if (!date) {
    if (rule.kind === "recommended") return `${KIND_LABEL.recommended}。退職前に確認する。法的期限とは別。`;
    return `${KIND_LABEL.confirm}。日付は出していない。`;
  }
  const [year, month, day] = date.split("-");
  const label = `${KIND_LABEL.statutory}。${year}年${Number(month)}月${Number(day)}日。`;
  return rule.holiday === "confirm-at-counter" ? `${label}${HOLIDAY_NOTE}。` : label;
}

function inWindow(iso: string, window: NonNullable<CalendarRule["openingWindow"]>): boolean {
  const { m, d } = parseIso(iso);
  const early = m === 1 && d <= 15;
  return window === "jan-1-to-15" ? early : !early;
}

/** 開業日から N か月後の応当日の前日。応当日が無い月は、その月の末日の前日。 */
export function dayBeforeCorrespondingMonth(iso: string, months: number): string {
  const { y, m, d } = parseIso(iso);
  const index = m - 1 + months;
  const year = y + Math.floor(index / 12);
  const month = (index % 12) + 1;
  const last = daysInMonth(year, month);
  return d <= last ? addDays(year, month, d, -1) : addDays(year, month, last, -1);
}

export function googleTemplateUrl(title: string, date: string): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("dates", `${compact(date)}/${compact(nextIso(date))}`);
  return url.toString();
}

export function icsEvent(title: string, date: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tenshoku-dokuritsu//transition-calendar//JA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${compact(date)}`,
    `DTEND;VALUE=DATE:${compact(nextIso(date))}`,
    `SUMMARY:${escapeIcs(title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldIcs).join("\r\n")}\r\n`;
}

export function unfoldIcs(ics: string): string {
  return ics.replaceAll("\r\n ", "");
}

function compact(iso: string): string {
  return iso.replaceAll("-", "");
}

function nextIso(iso: string): string {
  const { y, m, d } = parseIso(iso);
  return addDays(y, m, d, 1);
}

function escapeIcs(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function foldIcs(line: string): string {
  const encoder = new TextEncoder();
  let out = "";
  let current = "";
  let bytes = 0;
  const limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const room = out.length === 0 ? limit : limit - 1;
    if (bytes + size > room && current.length > 0) {
      out += `${out.length === 0 ? "" : "\r\n "}${current}`;
      current = char;
      bytes = size;
    } else {
      current += char;
      bytes += size;
    }
  }
  return out.length === 0 ? current : `${out}\r\n ${current}`;
}

function isIso(value: string): boolean {
  return /^(\d{4})-(\d{2})-(\d{2})$/.test(value) && readable(value);
}

function readable(iso: string): boolean {
  try {
    parseIso(iso);
    return true;
  } catch {
    return false;
  }
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`日付ではない: ${iso}`);
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) throw new Error(`日付ではない: ${iso}`);
  return { y, m, d };
}

function formatIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addDays(y: number, m: number, d: number, delta: number): string {
  const utc = new Date(Date.UTC(y, m - 1, d + delta));
  return formatIso(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}
