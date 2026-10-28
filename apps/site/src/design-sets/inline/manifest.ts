import type { SetManifest } from "../contract";

export const inline = {
  id: "inline",
  label: "Inline — 文中の小さな図",
  contractVersion: 3,
  primitive: "inline-gauge",
  signature: {
    s1: "hairline-and-soft-panels",
    s2: "position-bars",
    s3: "progress-hairline",
    s4: {
      guide: "gauge-card",
      tutorial: "step-bar-card",
      comparison: "column-bar-card",
      news: "tick-date-row",
      opinion: "soft-photo-card",
      interview: "soft-photo-card",
    },
    s5: "soft-field-and-chips",
    s6: "gauge-panel",
    s7: "top-bar-card",
    s8: "underline-bar",
    s9: "full-gauge",
  },
  // 小さな図（棒・目盛り）は数と進み具合だけ。れんが色は「今日」と注意だけ
  reservedShapes: {
    "micro-bar": ["count", "progress", "range"],
    "brick-mark": ["today", "warning"],
  },
  geometry: { line: "1px", bar: "5px", hair: "2px", radius: "14px", radiusSmall: "8px" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
