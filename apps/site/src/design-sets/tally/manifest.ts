import type { SetManifest } from "../contract";

export const tally = {
  id: "tally",
  label: "Tally — マス目で数える",
  contractVersion: 3,
  primitive: "tally-cells",
  signature: {
    s1: "band-and-corner-cells",
    s2: "cell-count-mark",
    s3: "progress-cells",
    s4: {
      guide: "corner-cell-card",
      tutorial: "step-cells-card",
      comparison: "cell-matrix-card",
      news: "date-cell-row",
      opinion: "large-cell-photo",
      interview: "large-cell-photo",
    },
    s5: "cell-keypad",
    s6: "corner-cell-box",
    s7: "offset-cell-card",
    s8: "filled-cell",
    s9: "full-cell-row",
  },
  // 埋めたマスは「数えたもの」と現在地だけ。点線のマスは未確定（未発表・採択のあと）だけ
  reservedShapes: {
    "filled-cell": ["count", "current", "shelf-mark"],
    "dashed-cell": ["undecided"],
  },
  geometry: { line: "2px", lineThin: "1.5px", cell: "12px", cellGap: "3px", corner: "16px", radius: "0" },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
