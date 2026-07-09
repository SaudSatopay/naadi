/** Indian-system money formatting: lakh / crore. */
export function inr(v: number): string {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(v >= 1e8 ? 0 : 1)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(v >= 1e6 ? 0 : 1)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function inrFull(v: number): string {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

export function pct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export const GRADE_COLOR: Record<string, string> = {
  "A+": "var(--color-pulse-400)",
  A: "var(--color-pulse-300)",
  B: "#b7e36b",
  C: "var(--color-marigold-400)",
  D: "#e98a3c",
  E: "var(--color-verm-400)",
};

export const DECISION_STYLE: Record<string, { label: string; color: string }> = {
  APPROVE: { label: "Approve", color: "var(--color-pulse-400)" },
  REFER: { label: "Refer", color: "var(--color-marigold-400)" },
  SMALL_TICKET: { label: "Starter product", color: "#e98a3c" },
  DECLINE: { label: "Decline", color: "var(--color-verm-400)" },
};
