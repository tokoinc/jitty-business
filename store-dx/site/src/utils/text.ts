/** 五十音の行。濁音・半濁音・小書きは清音の行にまとめる */
const ROW_OF: Record<string, string> = {};
for (const [row, chars] of [
  ["あ", "ぁあぃいぅうぇえぉお"],
  ["か", "かがきぎくぐけげこご"],
  ["さ", "さざしじすずせぜそぞ"],
  ["た", "ただちぢっつづてでとど"],
  ["な", "なにぬねの"],
  ["は", "はばぱひびぴふぶぷへべぺほぼぽ"],
  ["ま", "まみむめも"],
  ["や", "ゃやゅゆょよ"],
  ["ら", "らりるれろ"],
  ["わ", "ゎわゐゑをん"],
] as const) {
  for (const ch of chars) ROW_OF[ch] = row;
}

const SKIP = new Set([" ", "　", "・", "ー"]);

/** よみの先頭の文字から、五十音の行（あ・か・さ・た・な・は・ま・や・ら・わ）を返す */
export function kanaRow(reading: string): string {
  for (const ch of reading.trim()) {
    if (SKIP.has(ch)) continue;
    return ROW_OF[ch] ?? "";
  }
  return "";
}

/** 平仮名の符号順。Unicode の平仮名は、清音の直後に濁音・半濁音が来る五十音順 */
export function compareReading(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

const ENTITY: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" };

/** 描画済み HTML の属性値から拾った文字を戻す。Astro がエスケープした値を、もう一度エスケープしないため */
export function decodeAttr(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, name: string) => ENTITY[name] ?? "");
}
