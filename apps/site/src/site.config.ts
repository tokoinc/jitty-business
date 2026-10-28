import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Finish, SetId } from "./design-sets/contract";

const env = process.env;
const mode = (env.DD_MODE ?? "demo") as "demo" | "production";

/**
 * サイトごとの名前・記事・data は、リポジトリ直下の sites/<DD_SITE>/ に置く（ルートの README.md）。
 * build の途中ではページがまとめ直されて import.meta.url がずれるので、cwd（このアプリのフォルダ）から引く。
 */
export const siteSlug = env.DD_SITE ?? "advisors";
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(siteSlug)) throw new Error(`DD_SITE は英小文字・数字・ハイフンだけで書く: ${siteSlug}`);
/** content.config.ts の loader 用。アプリのフォルダからの相対パス */
export const siteRoot = `../../sites/${siteSlug}`;
export const siteDir = resolve(process.cwd(), siteRoot);
const profile = readProfile();

/** sites/<slug>/site.json。base を "/" にしたサイトは business.jitty.jp の直下に置く */
interface Profile {
  name: string;
  tagline: string;
  description: string;
  base?: string;
  design?: { designSet?: string; finish?: string };
}

function readProfile(): Profile {
  const file = resolve(siteDir, "site.json");
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (cause) {
    throw new Error(`DD_SITE=${siteSlug} の設定を読めない: ${file}`, { cause });
  }
}

const base = env.DD_BASE ?? profile.base ?? `/${siteSlug}/`;

export const site = {
  name: profile.name,
  tagline: profile.tagline,
  description: profile.description,
  mode, // production ではサンプル・仮URL・識別検査モードを拒否する
  url: env.DD_SITE_URL ?? `https://business.jitty.jp${base.replace(/\/$/, "")}`,
  base,
  outDir: env.DD_OUT_DIR ?? "./dist",
  lang: "ja",
  locale: "ja_JP",
  timezone: "Asia/Tokyo",
  // サイトごとの選択は site.json の design。DD_DESIGN_SET・DD_FINISH があればそちらを使う（比較デモ・検査用）
  design: {
    designSet: (env.DD_DESIGN_SET ?? profile.design?.designSet ?? "tally") as SetId, // SET_IDS のどれか
    finish: (env.DD_FINISH ?? profile.design?.finish ?? "flat") as Finish, // flat | real
  },
  inspect: env.DD_INSPECT === "1", // 開発・デモのbuildだけ。production では validateSite が拒否する
  storage: { namespace: `${siteSlug}:v1` },
  editorial: { sensitiveCategories: ["finance"], staleNumbers: "hide" as "hide" | "warn" },
  features: { bookmarks: true, resumeReading: true, glossaryPopovers: true },
  analytics: { enabled: false, ga4Id: "", sendSearchQuery: false },
  organization: { name: `${profile.name}編集部`, logo: "/favicon.svg" },
  disclosure: {
    affiliate: "この記事には、アフィリエイト広告が含まれる場合があります。掲載順は報酬額では決めていません。",
    sponsored: "この記事は、広告主の依頼で作成した記事広告です。",
    provided: "この記事で扱うサービスは、提供者から無償で提供を受けて確認しました。",
  },
  contact: { email: "", formUrl: "https://business.jitty.jp/contact" },
  articlesPerPage: 12,
} as const;

const isUrl = (value: string, protocols: string[]) =>
  URL.canParse(value) && protocols.includes(new URL(value).protocol);

/** validateSite が見る項目。site は as const なので、文字列の項目は string に広げて受ける */
export interface SiteCheck {
  mode: string;
  url: string;
  base: string;
  inspect: boolean;
  contact: { email: string; formUrl: string };
  analytics: { enabled: boolean; ga4Id: string };
}

export function validateSite(s: SiteCheck) {
  const e: string[] = [];
  if (!s.base.startsWith("/") || !s.base.endsWith("/")) e.push("base は / で始まり / で終わる");
  if (!isUrl(s.url, ["http:", "https:"])) e.push("site.url は http(s) の URL");
  // mailto: に入る。? や & で件名・宛先を足させない
  if (s.contact.email && !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(s.contact.email)) {
    e.push("contact.email はメールアドレスだけを書く");
  }
  if (s.contact.formUrl && !isUrl(s.contact.formUrl, ["https:"])) e.push("contact.formUrl は https の URL");
  if (s.mode === "production") {
    if (/example\.(com|org|net)/.test(s.url)) e.push("production では site.url に実際のURLを設定する");
    if (s.inspect) e.push("production では識別検査モードを使えない");
    if (!s.contact.email && !s.contact.formUrl) e.push("production では contact.email または contact.formUrl が必要");
    if (s.analytics.enabled && !s.analytics.ga4Id) e.push("解析を有効にする場合は ga4Id が必要");
  }
  if (e.length) throw new Error(`site.config.ts の検査に失敗:\n- ${e.join("\n- ")}`);
}
