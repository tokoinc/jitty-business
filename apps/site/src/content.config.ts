import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";
import { siteDir, siteRoot } from "./site.config";

/** タイムゾーン付きISO日時。YAMLでは必ず引用符で囲む（囲まないとDateに変換され、検査できない） */
const zoned = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/,
    'タイムゾーン付きのISO日時を引用符で囲んで書く（例："2026-10-03T09:00:00+09:00"）',
  )
  .transform((s) => new Date(s));

/** 日付だけ。確認日・期限・基準日に使う */
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付は"YYYY-MM-DD"を引用符で囲んで書く');

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "英小文字・数字・ハイフンだけで書く");

/** 外部へのリンク。http(s) とドメイン名だけ（javascript: や data: を href に入れない） */
const webUrl = z.httpUrl("http(s) の URL を書く（javascript: や data: は使えない）");

export const FORMATS = ["guide", "tutorial", "comparison", "news", "opinion", "interview"] as const;
export const INTENTS = ["learn", "compare", "choose", "do", "solve"] as const;

/**
 * Astro 7.3.5 は、存在しない reference をログに出すだけでコマンドを終了させない
 * （Zod 4 への移行で、参照の検査が例外からログへ移った）。
 * ファイル上の ID を読んで、無い参照はスキーマエラーにして sync を止める。
 */
const idReaders = {
  categories: () => yamlIds("./data/categories.yaml"),
  tags: () => yamlIds("./data/tags.yaml"),
  series: () => yamlIds("./data/series.yaml"),
  sources: () => yamlIds("./data/sources.yaml"),
  products: () => yamlIds("./data/products.yaml"),
  authors: () => mdIds("./content/authors"),
  glossary: () => mdIds("./content/glossary"),
  articles: () =>
    new Set(
      readdirSync(resolve(siteDir, "content/articles"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    ),
};

function yamlIds(rel: string) {
  const text = readFileSync(resolve(siteDir, rel), "utf8");
  return new Set([...text.matchAll(/^- id: ([a-z0-9-]+)\s*$/gm)].map((match) => match[1]));
}

function mdIds(rel: string) {
  return new Set(
    readdirSync(resolve(siteDir, rel))
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.slice(0, -".md".length)),
  );
}

function ref(collection: keyof typeof idReaders) {
  return reference(collection).superRefine((value, ctx) => {
    if (value == null || typeof value !== "object" || !("id" in value)) return;
    const id = String(value.id);
    if (!idReaders[collection]().has(id)) {
      ctx.addIssue(`${collection} に「${id}」がない`);
    }
  });
}

const categories = defineCollection({
  loader: file(`${siteRoot}/data/categories.yaml`),
  schema: z.object({
    id: slug,
    label: z.string().min(1),
    description: z.string().min(1),
    shelf: z.boolean().default(false),
    tabSlot: z.number().int().min(1).max(5).optional(),
    order: z.number().int().min(1),
    reviewProfile: z.enum(["standard", "sensitive"]).default("standard"),
    owner: ref("authors").optional(),
    updatePolicy: z.string().optional(),
  }),
});

const tags = defineCollection({
  loader: file(`${siteRoot}/data/tags.yaml`),
  schema: z.object({ id: slug, label: z.string(), reading: z.string() }),
});

const series = defineCollection({
  loader: file(`${siteRoot}/data/series.yaml`),
  schema: z.object({
    id: slug,
    title: z.string(),
    description: z.string(),
    total: z.number().int().positive().optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "*.md", base: `${siteRoot}/content/authors` }),
  schema: z.object({
    name: z.string(),
    kind: z.enum(["person", "organization"]),
    role: z.string(), // 実際の役割。例：編集部、確認担当
    specialist: z
      .object({ field: z.string(), credential: z.string(), verifiedAt: day })
      .optional(), // 実在の専門家で、資格を確認した場合だけ
    links: z.array(z.object({ label: z.string(), url: webUrl })).default([]),
    sample: z.boolean().default(false),
  }),
});

const sources = defineCollection({
  loader: file(`${siteRoot}/data/sources.yaml`),
  schema: z.object({
    id: slug,
    title: z.string(),
    url: webUrl,
    publisher: z.string(),
    checkedAt: day,
    publishedAt: day.optional(),
    section: z.string().optional(),
    note: z.string().optional(),
    sample: z.boolean().default(false),
  }),
});

const price = z.object({
  label: z.string(), // 例：月額（スタンダード）
  amount: z.number().int().nonnegative().nullable(), // 円。null＝未確認（0円と区別する）
  currency: z.literal("JPY").default("JPY"),
  tax: z.enum(["included", "excluded", "not-applicable"]),
  period: z.enum(["once", "month", "year", "transaction"]),
  note: z.string().optional(),
  asOf: day,
  source: ref("sources"),
});

const rate = z.object({
  label: z.string(),
  min: z.number(),
  max: z.number().optional(),
  unit: z.enum(["annual-percent", "percent"]),
  type: z.enum(["fixed", "variable"]).optional(),
  condition: z.string().optional(),
  asOf: day,
  source: ref("sources"),
});

const condition = z.object({
  label: z.string(),
  value: z.string(),
  audience: z.string().optional(),
  period: z.string().optional(),
  excludes: z.string().optional(),
  source: ref("sources"),
});

const products = defineCollection({
  loader: file(`${siteRoot}/data/products.yaml`),
  schema: z.object({
    id: slug,
    kind: z.enum(["product", "service", "financial-service"]),
    name: z.string(),
    provider: z.string(),
    description: z.string(),
    links: z
      .array(
        z.object({
          url: webUrl,
          use: z.enum(["official", "editorial"]),
          relation: z.enum(["none", "affiliate", "sponsored"]),
        }),
      )
      .min(1),
    prices: z.array(price).default([]),
    rates: z.array(rate).default([]),
    conditions: z.array(condition).default([]),
    lastVerifiedAt: day,
    reviewDueAt: day,
    reviewer: ref("authors"),
    sample: z.boolean().default(false),
  }),
});

const glossary = defineCollection({
  loader: glob({ pattern: "*.md", base: `${siteRoot}/content/glossary` }),
  schema: z.object({
    term: z.string(),
    reading: z.string().regex(/^[ぁ-ゖー・\s]+$/, "よみは平仮名で書く"),
    short: z.string().min(10).max(120), // 補足に出す短い定義
    category: ref("categories").optional(),
    related: z.array(ref("glossary")).default([]),
    article: ref("articles").optional(),
    sources: z.array(ref("sources")).default([]),
    sample: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  loader: glob({
    pattern: "*/index.mdx",
    base: `${siteRoot}/content/articles`,
    generateId: ({ entry }) => entry.replace(/\/index\.mdx$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(80),
      description: z.string().min(20).max(160),
      publishedAt: zoned,
      updatedAt: zoned.optional(),
      category: ref("categories"),
      tags: z.array(ref("tags")).default([]),
      series: z.object({ id: ref("series"), order: z.number().int().positive() }).optional(),
      author: ref("authors"),
      format: z.enum(FORMATS),
      intent: z.enum(INTENTS),
      cover: z.object({ src: image(), alt: z.string().min(1) }).optional(),
      speaker: z.string().optional(), // 論考・人物：話者・筆者の表示名
      steps: z.number().int().positive().optional(), // 実務：手順の数（記事面の目盛り）
      compare: z
        .object({ items: z.number().int().positive(), axes: z.number().int().positive() })
        .optional(),
      summary: z.string().max(120).optional(),
      brief: z
        .object({
          points: z.array(z.string()).min(1).max(5),
          audience: z.string().optional(),
          scope: z.string().optional(),
        })
        .optional(),
      limitations: z.array(z.string()).default([]),
      sources: z.array(ref("sources")).default([]),
      lastVerifiedAt: day.optional(),
      reviewProfile: z.enum(["standard", "sensitive"]).optional(), // 省略時は棚の既定
      review: z
        .object({
          by: ref("authors"),
          checkedAt: day,
          scope: z.string(),
          method: z.string().optional(),
        })
        .optional(),
      reviewDueAt: day.optional(),
      requiresSpecialist: z.boolean().default(false),
      eventAt: zoned.optional(), // ニュース：発生日時
      asOf: zoned.optional(), // ニュース：確認時点
      history: z
        .array(
          z.object({
            at: zoned,
            type: z.enum(["update", "correction", "follow-up"]),
            note: z.string(),
          }),
        )
        .default([]),
      products: z.array(ref("products")).default([]),
      terms: z.array(ref("glossary")).default([]),
      nextSteps: z
        .array(
          z.object({
            article: ref("articles"),
            role: z.enum(["primary", "detour"]),
            purpose: z.enum(INTENTS),
            reason: z.string().min(5).max(80),
          }),
        )
        .max(3)
        .default([]),
      draft: z.boolean().default(false),
      noindex: z.boolean().default(false),
      featured: z.boolean().default(false),
      sample: z.boolean().default(false),
      commercial: z
        .object({
          affiliate: z.boolean().default(false),
          sponsored: z.boolean().default(false),
          provided: z.boolean().default(false),
          note: z.string().optional(),
        })
        .default({ affiliate: false, sponsored: false, provided: false }),
    }),
});

export const collections = {
  categories,
  tags,
  series,
  authors,
  sources,
  products,
  glossary,
  articles,
};
