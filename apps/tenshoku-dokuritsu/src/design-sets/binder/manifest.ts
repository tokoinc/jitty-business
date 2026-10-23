import type { SetManifest } from "../contract";

export const binder = {
  id: "binder",
  label: "Binder — タブと台紙（標準）",
  contractVersion: 3,
  primitive: "tabbed-sheet",
  signature: {
    s1: "bridged-claw",
    s2: "slot-tab",
    s3: "stepped-divider",
    s4: {
      guide: "sheet",
      tutorial: "sheet-steps",
      comparison: "sheet-columns",
      news: "date-claw-row",
      opinion: "overlap-slip",
      interview: "overlap-slip",
    },
    s5: "drawer-stack",
    s6: "side-tab-slip",
    s7: "top-tab-sheet",
    s8: "open-claw",
    s9: "binding-line",
  },
  reservedShapes: { "side-tab": ["check-panel", "conditions", "evidence"] }, // 確かめる領域の部品と、本文の条件欄・根拠欄だけ
  geometry: { line: "1.5px", protrude: "0.75rem", tabH: "1.75rem", tabShoulder: "0.625rem", radius: "0", step: 5 },
  finishes: { real: "finish-real.css" },
  narrowMax: 839,
  middleMax: 1199,
} satisfies SetManifest;
