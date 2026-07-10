"use client";

/** Human-in-the-loop, demonstrated: the officer concurs with Munshi or
 *  overrides with a recorded reason. Demo-local audit trail (this browser). */

import { useEffect, useState } from "react";
import type { Msme } from "@/lib/types";

type Decision = { status: "concur" | "override"; note?: string; at: string };

export default function OfficerDecision({ m }: { m: Msme }) {
  const key = `naadi-audit-${m.id}`;
  const [decision, setDecision] = useState<Decision | null>(null);
  const [overriding, setOverriding] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    // hydrate once from storage post-mount — a state initializer would
    // desync server HTML from the client and trip hydration
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDecision(JSON.parse(raw));
    } catch {}
  }, [key]);

  const record = (d: Decision) => {
    setDecision(d);
    setOverriding(false);
    try {
      localStorage.setItem(key, JSON.stringify(d));
    } catch {}
  };

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="label-caps">Officer review — the human decides</h3>
        <span className="text-[0.62rem] num text-sage-dim">demo-local audit</span>
      </div>

      {!decision && !overriding && (
        <>
          <p className="mt-2 text-[0.76rem] text-sage leading-snug">
            Munshi recommends <b className="text-bone">{m.recommendation.decision_label}</b>. Every
            NAADI decision terminates at a human gate.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => record({ status: "concur", at: new Date().toISOString() })}
              className="flex-1 rounded-lg border border-pulse-500/40 bg-pulse-500/10 px-3 py-2 text-[0.8rem] font-medium text-pulse-300 hover:bg-pulse-500/20 transition-colors"
            >
              ✓ Concur with Munshi
            </button>
            <button
              onClick={() => setOverriding(true)}
              className="flex-1 rounded-lg border border-ink-600 px-3 py-2 text-[0.8rem] text-sage hover:border-marigold-500/50 hover:text-marigold-300 transition-colors"
            >
              ⚖ Override
            </button>
          </div>
        </>
      )}

      {overriding && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Override rationale — recorded to the audit trail…"
            rows={2}
            className="w-full rounded-lg border border-ink-600 bg-ink-900/70 px-3 py-2 text-[0.78rem] outline-none placeholder:text-sage-dim focus:border-marigold-500/50"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => note.trim() && record({ status: "override", note: note.trim(), at: new Date().toISOString() })}
              className="chip !text-marigold-300 !border-marigold-500/40 hover:!bg-marigold-500/10 transition-colors disabled:opacity-40"
              disabled={!note.trim()}
            >
              record override
            </button>
            <button onClick={() => setOverriding(false)} className="chip hover:text-bone transition-colors">
              cancel
            </button>
          </div>
        </div>
      )}

      {decision && (
        <div className="mt-3">
          <div
            className="rounded-lg border px-3 py-2.5"
            style={{
              borderColor: decision.status === "concur" ? "rgba(59,227,154,.4)" : "rgba(233,180,76,.4)",
              background: decision.status === "concur" ? "rgba(59,227,154,.06)" : "rgba(233,180,76,.06)",
            }}
          >
            <div className="num text-[0.72rem]" style={{ color: decision.status === "concur" ? "var(--color-pulse-300)" : "var(--color-marigold-300)" }}>
              {decision.status === "concur" ? "✓ OFFICER CONCURRED" : "⚖ OFFICER OVERRODE MUNSHI"}
            </div>
            {decision.note && <div className="mt-1 text-[0.76rem] text-bone/85 leading-snug">“{decision.note}”</div>}
            <div className="num mt-1 text-[0.62rem] text-sage-dim">{new Date(decision.at).toLocaleString()}</div>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(key);
              } catch {}
              setDecision(null);
              setNote("");
            }}
            className="chip mt-2 hover:text-bone transition-colors"
          >
            clear demo decision
          </button>
        </div>
      )}
    </div>
  );
}
