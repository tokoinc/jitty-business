const yen = new Intl.NumberFormat("ja-JP");
const PERIOD = { once: "", month: "／月", year: "／年", transaction: "／件" } as const;
const TAX = { included: "（税込）", excluded: "（税別）", "not-applicable": "" } as const;
export function formatPrice(p: {
  amount: number | null;
  period: keyof typeof PERIOD;
  tax: keyof typeof TAX;
}) {
  if (p.amount === null) return "未確認";
  return `${yen.format(p.amount)}円${PERIOD[p.period]}${TAX[p.tax]}`;
}
export function formatRate(r: { min: number; max?: number; unit: "annual-percent" | "percent" }) {
  const u = r.unit === "annual-percent" ? "%（年率）" : "%";
  return r.max !== undefined && r.max !== r.min ? `${r.min}〜${r.max}${u}` : `${r.min}${u}`;
}
