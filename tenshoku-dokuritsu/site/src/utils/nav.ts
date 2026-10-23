import type { FrameProps, PageKind, ShelfLink } from "@/design-sets/contract";
import { QUESTIONS } from "@/data/questions";
import { site } from "@/site.config";
import { getSiteData } from "./content";
import { INTENT_LABELS, NAV_INTENTS } from "./labels";
import { STORIES_PATH, storiesOpen, toThemeArticles } from "./themes";
import { categoryHref, href, purposeHref } from "./url";

export async function frameProps(
  page: PageKind,
  o: { shelf?: string; home?: boolean; search?: boolean; query?: string; current?: string } = {},
): Promise<FrameProps> {
  const d = await getSiteData();
  const shelves: ShelfLink[] = d.shelves.map((c) => {
    const count = d.articles.filter((a) => a.data.category.id === c.id).length;
    return {
      id: c.id,
      label: c.data.navLabel ?? c.data.label,
      slot: c.data.tabSlot!,
      number: String(c.data.order).padStart(2, "0"),
      // 記事が0件の詳細URLは作らない。名前は残し、一覧へ戻す。
      href: count > 0 ? categoryHref(c.id) : href("category/"),
      current: o.shelf === c.id,
      count,
    };
  });
  const q = (s: string) => `${href("search/")}?q=${encodeURIComponent(s)}`;
  const stories = storiesOpen(toThemeArticles(d.articles));
  return {
    page,
    siteName: site.name,
    tagline: site.tagline,
    homeHref: href(""),
    homeCurrent: !!o.home,
    shelves,
    purposes: NAV_INTENTS.map((i) => ({
      label: INTENT_LABELS[i].nav,
      href: purposeHref(i),
      current: o.current === `purpose-${i}`,
    })),
    utility: [
      {
        label: "移行カレンダー",
        href: href("tools/transition-calendar/"),
        current: o.current === "calendar",
      },
      { label: "用語集", href: href("glossary/"), current: o.current === "glossary" },
      { label: "保存した記事", href: href("bookmarks/"), current: o.current === "bookmarks" },
    ],
    footer: [
      { label: "全記事", href: href("articles/") },
      { label: "移行カレンダー", href: href("tools/transition-calendar/") },
      ...(stories ? [{ label: "体験談", href: href(STORIES_PATH) }] : []),
      { label: "このサイトについて", href: href("about/") },
      { label: "編集方針", href: href("editorial-policy/") },
      { label: "免責", href: href("disclaimer/") },
      { label: "広告と編集方針", href: href("disclosure/") },
      { label: "プライバシー", href: href("privacy/") },
      { label: "お問い合わせ", href: href("contact/") },
      { label: "RSS", href: href("rss.xml") },
    ],
    searchHref: href("search/"),
    searchCurrent: !!o.search,
    query: o.query,
    questions:
      page === "home" || page === "search"
        ? QUESTIONS.map((x) => ({ label: x.label, href: q(x.query) }))
        : undefined,
  };
}
