import { site } from "@/site.config";
import type { Article, SiteData } from "./content";
import { isPublished, profileOf } from "./content";
import { BUILD_TIME, endOfDay, isOverdue } from "./dates";

/** requiresSpecialist だが、確認担当が specialist を持たない */
export function lacksSpecialist(a: Article, authors: SiteData["authors"]): boolean {
  if (!a.data.requiresSpecialist) return false;
  const reviewer = authors.find((author) => author.id === a.data.review?.by.id);
  return !reviewer?.data.specialist;
}

const future = (day: string) => endOfDay(day) > new Date(BUILD_TIME.getTime() + 86400000);

export function validateAll(d: SiteData) {
  const errors: string[] = [];
  const warns: string[] = [];
  const held: string[] = [];
  const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

  const shelves = d.categories.filter((c) => c.data.shelf);
  if (shelves.length < 2 || shelves.length > 5)
    err("categories.yaml", `棚は2〜5個（現在 ${shelves.length}）`);
  const slots = shelves.map((s) => s.data.tabSlot);
  if (slots.some((s) => s === undefined)) err("categories.yaml", "棚には tabSlot が必要");
  if (new Set(slots).size !== slots.length) err("categories.yaml", "tabSlot が重複している");
  const orders = shelves.map((s) => s.data.order);
  if (new Set(orders).size !== orders.length) err("categories.yaml", "order が重複している");

  const seriesOrders = new Map<string, string>();
  for (const a of d.all) {
    const series = a.data.series;
    if (!series) continue;
    const key = `${series.id.id}:${series.order}`;
    const prev = seriesOrders.get(key);
    if (prev)
      err(`articles/${a.id}`, `連載 ${series.id.id} の order ${series.order} が ${prev} と重複している`);
    else seriesOrders.set(key, `articles/${a.id}`);
  }

  for (const a of d.articles) {
    const w = `articles/${a.id}`;
    const x = a.data;
    if (x.updatedAt && x.updatedAt < x.publishedAt) err(w, "updatedAt が publishedAt より前");
    if (x.lastVerifiedAt && future(x.lastVerifiedAt)) err(w, "lastVerifiedAt が未来");
    if (x.review && future(x.review.checkedAt)) err(w, "review.checkedAt が未来");
    if (x.lastVerifiedAt && x.reviewDueAt && x.reviewDueAt < x.lastVerifiedAt) {
      err(w, "reviewDueAt が lastVerifiedAt より前");
    }
    const category = d.categories.find((c) => c.id === x.category.id);
    if (category?.data.reviewProfile === "sensitive" && x.reviewProfile === "standard") {
      err(w, "棚の sensitive を記事の reviewProfile: standard では下げられない");
    }
    if (profileOf(a, d.categories) === "sensitive") {
      if (!x.brief?.audience || !x.brief?.scope)
        err(w, "sensitive の記事は brief.audience と brief.scope が必要");
      if (x.sources.length === 0) err(w, "sensitive の記事は sources が1件以上必要");
      if (!x.lastVerifiedAt || !x.review || !x.reviewDueAt) {
        err(w, "sensitive の記事は lastVerifiedAt・review・reviewDueAt が必要");
      }
    }
    const primaries = x.nextSteps.filter((n) => n.role === "primary").length;
    const detours = x.nextSteps.filter((n) => n.role === "detour").length;
    if (primaries > 1 || detours > 2) err(w, "nextSteps は primary 1件・detour 2件まで");
    const stepIds = x.nextSteps.map((n) => n.article.id);
    if (new Set(stepIds).size !== stepIds.length) err(w, "nextSteps が重複している");
    for (const n of x.nextSteps) {
      if (n.article.id === a.id) err(w, "nextSteps が自分自身を指している");
      else if (!d.byId.has(n.article.id)) err(w, `nextSteps の ${n.article.id} が非公開または存在しない`);
    }
    for (const productRef of x.products) {
      const product = d.products.find((p) => p.id === productRef.id);
      if (!product) continue;
      const relations = new Set(product.data.links.map((link) => link.relation));
      if (relations.has("affiliate") && !x.commercial.affiliate) {
        err(w, `商品 ${product.id} に affiliate のリンクがあるが commercial.affiliate が true でない`);
      }
      if (relations.has("sponsored") && !x.commercial.sponsored) {
        err(w, `商品 ${product.id} に sponsored のリンクがあるが commercial.sponsored が true でない`);
      }
    }
    if (isOverdue(x.reviewDueAt)) warns.push(`${w}: 確認期限 ${x.reviewDueAt} を過ぎている`);
  }

  for (const a of d.all) {
    if (!isPublished(a) || !lacksSpecialist(a, d.authors)) continue;
    const msg = "requiresSpecialist だが review.by の著者が specialist を持たない";
    if (site.mode === "production") err(`articles/${a.id}`, msg);
    else held.push(`articles/${a.id}: ${msg}（公開記事から外した）`);
  }

  for (const p of d.products) {
    for (const rate of p.data.rates) {
      if (rate.max !== undefined && rate.max < rate.min) {
        err(`products/${p.id}`, `rates「${rate.label}」の max が min より小さい`);
      }
    }
    if (isOverdue(p.data.reviewDueAt))
      warns.push(`products/${p.id}: 確認期限 ${p.data.reviewDueAt} を過ぎている`);
  }

  if (site.mode === "production") {
    const samples = [...d.all, ...d.glossary, ...d.authors, ...d.sources, ...d.products].filter(
      (e) => (e.data as { sample?: boolean }).sample,
    );
    for (const s of samples) err(`${s.collection}/${s.id}`, "production に sample: true が残っている");
  }
  if (warns.length) console.warn(`[decision-desk] 期限切れ ${warns.length} 件\n- ${warns.join("\n- ")}`);
  if (held.length) console.warn(`[decision-desk] 専門家の確認待ち ${held.length} 件\n- ${held.join("\n- ")}`);
  if (errors.length) {
    throw new Error(
      `[decision-desk] コンテンツの検査に失敗（${errors.length} 件）\n- ${errors.join("\n- ")}`,
    );
  }
}
