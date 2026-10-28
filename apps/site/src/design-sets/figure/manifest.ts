import type { SetManifest } from "../contract";

export const figure = {
  id: "figure",
  label: "Figure — 大きな数字と太い罫",
  contractVersion: 3,
  primitive: "big-figure",
  signature: {
    s1: "heavy-rule-columns",
    s2: "big-number-label",
    s3: "ruled-numeral",
    s4: {
      guide: "numeral-column",
      tutorial: "step-count-column",
      comparison: "count-ledger",
      news: "big-date-line",
      opinion: "ruled-photo-column",
      interview: "ruled-photo-column",
    },
    s5: "headline-field-and-numbered-rows",
    s6: "rule-capped-box",
    s7: "rule-capped-note",
    s8: "inverted-row",
    s9: "double-rule",
  },
  // 朱の数字は「その記事の数」と現在地だけ。広告・装飾の数字には使わない
  reservedShapes: {
    "vermilion-numeral": ["count", "current", "deadline"],
    "inverted-row": ["current", "selected"],
  },
  geometry: { line: "1px", rule: "4px", heavy: "8px", double: "9px", numeral: "4.5rem", radius: "0" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
