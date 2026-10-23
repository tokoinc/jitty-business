const BASE = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
/** base を付け、末尾スラッシュをそろえる。ファイル（.xml 等）・クエリ・ハッシュ付きはそのまま */
export function href(path = ""): string {
  const url = `${BASE}${path.replace(/^\//, "")}`;
  if (/[?#]/.test(url) || /\.[a-z0-9]+$/i.test(url) || url.endsWith("/")) return url;
  return `${url}/`;
}
export const articleHref = (id: string) => href(`articles/${id}/`);
export const categoryHref = (id: string) => href(`category/${id}/`);
export const purposeHref = (intent: string) => href(`purpose/${intent}/`);
export const tagHref = (id: string) => href(`tags/${id}/`);
export const seriesHref = (id: string) => href(`series/${id}/`);
export const glossaryHref = (id: string) => href(`glossary/${id}/`);
export const authorHref = (id: string) => href(`authors/${id}/`);
export const absolute = (path: string) => new URL(href(path), import.meta.env.SITE).toString();
