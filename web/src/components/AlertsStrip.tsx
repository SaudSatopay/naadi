import Link from "next/link";
import { demo } from "@/lib/data";

const SEV: Record<string, { color: string; label: string }> = {
  red: { color: "var(--color-verm-400)", label: "act" },
  amber: { color: "var(--color-marigold-400)", label: "watch" },
  watch: { color: "var(--color-sage)", label: "note" },
};

/** The portfolio radar feed — what should the RM look at this morning? */
export default function AlertsStrip() {
  const alerts = demo.portfolio.alerts ?? [];
  if (!alerts.length) return null;
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">On the radar this morning</h3>
        <span className="text-[0.62rem] num text-sage-dim">{alerts.length} signals · rule-based EWS</span>
      </div>
      <div className="mt-2.5 grid gap-1">
        {alerts.map((a, i) => {
          const s = SEV[a.severity];
          return (
            <Link
              key={`${a.id}-${i}`}
              href={`/m/${a.id}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-ink-800/60 transition-colors"
            >
              <span className={`size-2 rounded-full ${a.severity === "red" ? "blip" : ""}`} style={{ background: s.color }} />
              <span className="text-[0.78rem] leading-snug min-w-0">
                <b className="text-bone/90 group-hover:text-pulse-300 transition-colors">{a.name}</b>
                <span className="text-sage"> — {a.text}</span>
              </span>
              <span className="chip !px-2 !py-0" style={{ color: s.color, borderColor: `color-mix(in oklab, ${s.color} 40%, transparent)` }}>
                {s.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
