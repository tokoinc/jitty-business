import type { FaceData } from "@/design-sets/contract";
import type { Article, SiteData } from "./content";
import { formatDate } from "./dates";
import { FORMAT_LABELS, INTENT_LABELS } from "./labels";
import { articleHref } from "./url";

export function toFace(
  a: Article,
  d: SiteData,
  extra: { purpose?: keyof typeof INTENT_LABELS; reason?: string } = {},
): FaceData {
  const c = d.categories.find((x) => x.id === a.data.category.id)!;
  const date = a.data.format === "news" && a.data.eventAt ? a.data.eventAt : a.data.publishedAt;
  return {
    id: a.id,
    href: articleHref(a.id),
    title: a.data.title,
    description: a.data.description,
    format: a.data.format,
    formatLabel: FORMAT_LABELS[a.data.format],
    shelf: {
      id: c.id,
      label: c.data.label,
      slot: c.data.tabSlot ?? 1,
      number: String(c.data.order).padStart(2, "0"),
    },
    date: date.toISOString(),
    dateLabel: formatDate(date),
    steps: a.data.steps,
    compare: a.data.compare,
    cover: a.data.cover,
    speaker: a.data.speaker,
    purposeLabel: extra.purpose ? `${INTENT_LABELS[extra.purpose].short}ために` : undefined,
    reason: extra.reason,
    sample: a.data.sample,
  };
}
