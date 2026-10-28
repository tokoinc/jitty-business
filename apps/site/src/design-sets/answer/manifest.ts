import type { SetManifest } from "../contract";

export const answer = {
  id: "answer",
  label: "Answer — 問いと答えの札",
  contractVersion: 3,
  primitive: "answer-plate",
  signature: {
    s1: "pill-bar-and-answer-cards",
    s2: "q-ring",
    s3: "q-plate-heading",
    s4: {
      guide: "question-card",
      tutorial: "step-pill-card",
      comparison: "verdict-row-card",
      news: "date-pill-row",
      opinion: "rounded-photo-card",
      interview: "rounded-photo-card",
    },
    s5: "question-bar-and-type-keys",
    s6: "answer-panel",
    s7: "tailed-bubble",
    s8: "ink-pill",
    s9: "closing-answer-pill",
  },
  // 判定の札（◯・△・✕・＝・？）は条件と答えの要約だけ。広告・人気の訴求には使わない
  reservedShapes: {
    "verdict-plate": ["brief", "conditions", "evidence", "check-panel", "proscons", "callout"],
    "dashed-plate": ["undecided"],
  },
  geometry: { line: "1.5px", radius: "16px", radiusSmall: "10px", pill: "999px", plate: "2.5rem" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
