import type { SetManifest } from "../contract";

export const board = {
  id: "board",
  label: "Board — 固定盤と差し替えパネル",
  contractVersion: 3,
  primitive: "swap-panel",
  signature: {
    s1: "board-and-panels",
    s2: "number-plate",
    s3: "line-band",
    s4: {
      guide: "panel-2x1",
      tutorial: "panel-2x1-steps",
      comparison: "panel-2x2-table",
      news: "panel-1x1-date",
      opinion: "panel-1x2",
      interview: "panel-1x2",
    },
    s5: "control-console",
    s6: "meter-panel",
    s7: "double-outline-panel",
    s8: "pressed-switch",
    s9: "terminal-panel",
  },
  reservedShapes: {
    "offset-outline": ["face", "article"],
    "concentric-outline": [
      "brief",
      "conditions",
      "evidence",
      "toc",
      "selected",
      "reading",
      "series",
      "recent",
    ],
  },
  geometry: { line: "2px", protrude: "0.375rem", radius: "0.5rem" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
