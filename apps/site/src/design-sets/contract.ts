import type { ImageMetadata } from "astro";

export type Format = "guide" | "tutorial" | "comparison" | "news" | "opinion" | "interview";
export type PageKind = "home" | "list" | "search" | "article" | "page";

export interface ShelfMark {
  id: string;
  label: string;
  slot: number;
  number: string;
} // number は "01" 形式
export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
  count?: number;
}
export interface ShelfLink extends ShelfMark, NavLink {}

export interface FrameProps {
  page: PageKind;
  siteName: string;
  tagline: string;
  homeHref: string;
  homeCurrent: boolean;
  shelves: ShelfLink[];
  purposes: NavLink[];
  utility: NavLink[]; // 用語集・保存した記事（表示設定は Frame が固定で出すボタン）
  footer: NavLink[]; // このサイトについて・広告と編集方針・プライバシー・お問い合わせ・RSS
  searchHref: string;
  searchCurrent?: boolean;
  query?: string;
  questions?: { label: string; href: string }[]; // 編集された問い（ホームの問いの欄など）
}
// Frame のスロット：default＝読む、check＝確かめる、after＝読む領域の続き（次に確かめる等）

export interface CategoryMarkProps {
  shelf: ShelfMark;
  format?: { id: Format; label: string };
  context: "sheet" | "card";
}
export interface SectionHeadingProps {
  id: string;
  index: number;
  context: "article" | "section";
  label?: string;
  /** 記事の h2 の総数（「03 / 06」のような進み具合を出すセット用）。区画見出しでは渡さない */
  total?: number;
} // スロット＝見出し文

export interface FaceData {
  id: string;
  href: string;
  title: string;
  description: string;
  format: Format;
  formatLabel: string;
  shelf: ShelfMark;
  date: string; // ISO
  dateLabel: string; // 表示用（例：2026.10.04）
  steps?: number;
  compare?: { items: number; axes: number };
  cover?: { src: ImageMetadata; alt: string };
  speaker?: string;
  purposeLabel?: string; // 次に確かめる：目的
  reason?: string; // 次に確かめる：理由
  sample?: boolean;
}
export interface ArticleFaceProps {
  face: FaceData;
  emphasis: "lead" | "primary" | "default" | "compact";
  headingLevel?: 2 | 3;
  index?: number;
}
export interface FaceGridProps {
  layout: "latest" | "list" | "results" | "next";
}

export interface FilterOption {
  value: string;
  label: string;
  selected: boolean;
}
export interface FilterGroup {
  id: "shelf" | "format" | "checked";
  label: string;
  options: FilterOption[];
}
export interface SearchSurfaceProps {
  part: "main" | "aside";
  action: string; // /search/ のURL
  query: string;
  purposes: (NavLink & { value: string })[];
  groups: FilterGroup[];
  questions: { label: string; href: string }[];
}

export interface CheckSlipProps {
  kind: "brief" | "conditions" | "evidence";
  title: string;
  id: string;
}
export interface CheckPanelProps {
  kind: "toc" | "conditions" | "evidence" | "reading" | "series" | "recent" | "selected" | "shelf" | "terms";
  title: string;
  href?: string;
  count?: number;
  items?: { label: string; href: string; current?: boolean; index?: number }[];
  /** true のとき hidden。ホームの読みかけは、工程12が中身を入れるまで出さない */
  hidden?: boolean;
}
export interface CheckRowProps {
  items: { label: string; href: string; count?: number }[];
}
export interface PopoverProps {
  id: string;
  heading: string;
}
export interface EndMarkProps {
  label?: string;
}

export const SET_COMPONENTS = [
  "Frame",
  "CategoryMark",
  "SectionHeading",
  "ArticleFace",
  "FaceGrid",
  "SearchSurface",
  "CheckSlip",
  "CheckPanel",
  "CheckRow",
  "Popover",
  "EndMark",
] as const;

export type SetId = "tally" | "answer" | "figure" | "inline";
export type Finish = "flat" | "real";
export const SET_IDS = ["tally", "answer", "figure", "inline"] as const;
export const FINISHES = ["flat", "real"] as const;
export const CONTRACT_VERSION = 3;

export interface SetManifest {
  id: SetId;
  label: string;
  contractVersion: typeof CONTRACT_VERSION;
  primitive: "tally-cells" | "answer-plate" | "big-figure" | "inline-gauge";
  signature: {
    s1: string;
    s2: string;
    s3: string;
    s4: Record<Format, string>;
    s5: string;
    s6: string;
    s7: string;
    s8: string;
    s9: string;
  };
  /** 形の予約：形の名前 → その形を使ってよい部品の種類 */
  reservedShapes: Record<string, string[]>;
  /** 幾何トークン（tokens.css の --g-* と一致させる） */
  geometry: Record<string, string | number>;
  /** 質感ごとの追加CSS。flat は tokens.css + parts.css だけ */
  finishes: { real: "finish-real.css" };
  narrowMax: 839;
  middleMax: 1199;
}

export function validateManifest(m: SetManifest): string[] {
  const errors: string[] = [];
  if (!SET_IDS.includes(m.id)) errors.push(`不明なセットID: ${m.id}`);
  if (m.contractVersion !== CONTRACT_VERSION) errors.push(`${m.id}: contractVersion は ${CONTRACT_VERSION}`);
  for (const k of ["s1", "s2", "s3", "s5", "s6", "s7", "s8", "s9"] as const) {
    if (!m.signature[k]) errors.push(`${m.id}: シグネチャ枠 ${k} が未宣言`);
  }
  for (const f of ["guide", "tutorial", "comparison", "news", "opinion", "interview"] as const) {
    if (!m.signature.s4[f]) errors.push(`${m.id}: 記事面 s4.${f} が未宣言`);
  }
  return errors;
}
