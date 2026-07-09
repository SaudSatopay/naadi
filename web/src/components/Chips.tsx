import { DECISION_STYLE, GRADE_COLOR } from "@/lib/format";

export function GradeChip({ grade, size = "md" }: { grade: string; size?: "md" | "lg" }) {
  const c = GRADE_COLOR[grade] ?? "var(--color-sage)";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg num font-semibold ${
        size === "lg" ? "text-xl px-3 py-1" : "text-sm px-2 py-0.5"
      }`}
      style={{
        color: c,
        background: `color-mix(in oklab, ${c} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${c} 45%, transparent)`,
      }}
    >
      {grade}
    </span>
  );
}

export function DecisionChip({ decision }: { decision: string }) {
  const d = DECISION_STYLE[decision] ?? { label: decision, color: "var(--color-sage)" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wider num"
      style={{
        color: d.color,
        background: `color-mix(in oklab, ${d.color} 10%, transparent)`,
        border: `1px solid color-mix(in oklab, ${d.color} 40%, transparent)`,
      }}
    >
      <span
        className="size-1.5 rounded-full blip"
        style={{ background: d.color }}
      />
      {d.label}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const rails: Record<string, string> = {
    T3: "GST · UPI · AA · EPFO",
    T2: "GST + partial rails",
    T1: "UPI-first thin file",
  };
  return (
    <span className="chip" title={rails[tier]}>
      <span className="text-pulse-300">{tier}</span> {rails[tier]}
    </span>
  );
}
