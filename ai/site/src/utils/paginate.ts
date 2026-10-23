export function pageSlice<T>(items: T[], page: number, per: number) {
  const total = Math.max(1, Math.ceil(items.length / per));
  return { items: items.slice((page - 1) * per, page * per), page, total };
}
/** 1ページ目は base、2ページ目以降は base + "page/{n}/" */
export const pageHref = (base: string, n: number) => (n === 1 ? base : `${base}page/${n}/`);
