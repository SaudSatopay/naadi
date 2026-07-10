"use client";

/** The wow moment: replay Munshi's agentic run — consent, rails, features,
 *  score, policy, memo — step by step with real pipeline timings. */

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Msme } from "@/lib/types";
import PulseLine from "./PulseLine";

const SPEED = 0.45; // replay faster than real time

export default function TraceReplay({ m }: { m: Msme }) {
  const [open, setOpen] = useState(false);
  const [reached, setReached] = useState(0);

  const cum = useMemo(() => {
    const out: number[] = [];
    for (const [i, s] of m.trace.entries()) {
      out.push((i > 0 ? out[i - 1] : 0) + s.ms * SPEED);
    }
    return out;
  }, [m.trace]);

  useEffect(() => {
    if (!open) return;
    const handles = m.trace.map((_, i) =>
      setTimeout(() => setReached(i + 1), cum[i])
    );
    return () => handles.forEach(clearTimeout);
  }, [open, cum, m.trace]);

  const done = reached >= m.trace.length;

  return (
    <>
      <button
        onClick={() => {
          setReached(0);
          setOpen(true);
        }}
        className="group inline-flex items-center gap-2 rounded-full border border-pulse-500/40 bg-pulse-500/10 px-4 py-2 text-sm font-medium text-pulse-300 hover:bg-pulse-500/20 transition-colors"
      >
        <span className="size-2 rounded-full bg-pulse-400 blip" />
        Replay Munshi’s run
        <span className="num text-[0.65rem] text-sage group-hover:text-pulse-300 transition-colors">
          {(m.trace.reduce((a, s) => a + s.ms, 0) / 1000).toFixed(1)}s live
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/85 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="card w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="label-caps">Munshi · agentic underwriting run</div>
                  <div
                    className="text-lg font-medium"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {m.name}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="chip hover:text-bone transition-colors"
                >
                  esc
                </button>
              </div>

              <PulseLine className="h-6 w-full my-4 opacity-70" />

              <ol className="grid gap-1.5 max-h-[46vh] overflow-y-auto pr-1">
                {m.trace.map((s, i) => {
                  const hit = i < reached;
                  const active = i === reached;
                  return (
                    <li
                      key={s.step}
                      className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg px-3 py-2 transition-colors"
                      style={{
                        background: hit ? "rgba(59,227,154,0.05)" : "transparent",
                        opacity: hit || active ? 1 : 0.32,
                      }}
                    >
                      <span
                        className={`mt-1 size-2 rounded-full ${active ? "blip" : ""}`}
                        style={{
                          background: hit
                            ? "var(--color-pulse-400)"
                            : active
                              ? "var(--color-marigold-400)"
                              : "var(--color-ink-600)",
                        }}
                      />
                      <div>
                        <div className="text-[0.8rem] font-medium text-bone/90">{s.label}</div>
                        <div className="text-[0.7rem] text-sage leading-snug">{s.detail}</div>
                      </div>
                      <span className="num text-[0.62rem] text-sage-dim mt-1">{s.ms} ms</span>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-4 hairline-t pt-3 flex items-center justify-between">
                <span className="text-[0.72rem] text-sage">
                  {done
                    ? "Run complete — memo ready for officer review."
                    : "Running consented rails…"}
                </span>
                {done && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="num text-xl font-semibold text-pulse-300"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {m.scoring.score} · {m.scoring.grade}
                  </motion.span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
