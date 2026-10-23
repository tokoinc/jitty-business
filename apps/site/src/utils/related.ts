import type { Article, SiteData } from "./content";
import { byNewest } from "./content";
import { FORMAT_LABELS } from "./labels";

type Intent = Article["data"]["intent"];
export interface Pick {
  article: Article;
  role: "primary" | "detour";
  purpose: Intent;
  reason: string;
}

export function nextSteps(a: Article, d: SiteData): Pick[] {
  const used = new Set([a.id]);
  const picks: Pick[] = [];
  for (const n of a.data.nextSteps) {
    const t = d.byId.get(n.article.id);
    if (t && !used.has(t.id)) {
      picks.push({ article: t, role: n.role, purpose: n.purpose, reason: n.reason });
      used.add(t.id);
    }
  }
  let needPrimary = picks.some((p) => p.role === "primary") ? 0 : 1;
  let needDetour = 2 - picks.filter((p) => p.role === "detour").length;
  for (const c of candidates(a, d)) {
    if (needPrimary + needDetour === 0) break;
    if (used.has(c.article.id)) continue;
    const role = needPrimary > 0 ? "primary" : "detour";
    if (role === "primary") needPrimary--;
    else needDetour--;
    picks.push({ ...c, role });
    used.add(c.article.id);
  }
  return [...picks.filter((p) => p.role === "primary"), ...picks.filter((p) => p.role === "detour")];
}

function candidates(a: Article, d: SiteData) {
  const cat = d.categories.find((c) => c.id === a.data.category.id);
  const tags = new Set(a.data.tags.map((t) => t.id));
  const out: { article: Article; purpose: Intent; reason: string; score: number }[] = [];
  for (const b of d.articles) {
    if (b.id === a.id) continue;
    const shared = b.data.tags
      .filter((t) => tags.has(t.id))
      .map((t) => d.tags.find((x) => x.id === t.id)?.data.label ?? t.id);
    let score = 0;
    let reason = "";
    if (a.data.series && b.data.series?.id.id === a.data.series.id.id) {
      const next = b.data.series.order === a.data.series.order + 1;
      score = next ? 100 : 60;
      reason = next ? "連載の次の回" : "同じ連載の別の回";
    } else if (b.data.category.id === a.data.category.id && shared.length) {
      score = 40 + 10 * shared.length;
      reason = `同じ棚「${cat?.data.label}」で、タグ「${shared[0]}」が共通`;
    } else if (b.data.category.id === a.data.category.id) {
      score = 20;
      reason = `同じ棚「${cat?.data.label}」の${FORMAT_LABELS[b.data.format]}記事`;
    } else if (shared.length) {
      score = 15;
      reason = `タグ「${shared[0]}」が共通`;
    }
    if (score > 0) out.push({ article: b, purpose: b.data.intent, reason, score });
  }
  return out.sort((x, y) => y.score - x.score || byNewest(x.article, y.article));
}
