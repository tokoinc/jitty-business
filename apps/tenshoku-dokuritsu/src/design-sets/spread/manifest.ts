import type { SetManifest } from "../contract";

export const spread = {
  id: "spread",
  label: "Spread — 曲面と見開き",
  contractVersion: 3,
  primitive: "arc-spread",
  signature: {
    s1: "arc-and-spine",
    s2: "round-stamp",
    s3: "chapter-number-spine",
    s4: {
      guide: "text-spread",
      tutorial: "text-spread-steps",
      comparison: "arc-door-table",
      news: "big-date-row",
      opinion: "lens-and-projecting-title",
      interview: "lens-and-projecting-title",
    },
    s5: "question-circles-arc",
    s6: "margin-spine-note",
    s7: "arc-corner-bubble",
    s8: "bold-spine-label",
    s9: "closing-arc",
  },
  reservedShapes: {
    "spine-label": ["toc", "conditions", "evidence", "selected", "reading", "series"],
  },
  geometry: { line: "1px", arcX: "360px", arcY: "300px", spine: "4.75rem" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
