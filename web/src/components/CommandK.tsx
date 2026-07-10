"use client";

/** ⌘K command palette — jump to any file in the book. */

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { allMsmes } from "@/lib/data";
import { GRADE_COLOR } from "@/lib/format";

export default function CommandK() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const msmes = allMsmes();
    if (!q.trim()) return msmes;
    const t = q.toLowerCase();
    return msmes.filter((m) =>
      [m.name, m.id, m.city, m.sector, m.scoring.grade, m.proprietor]
        .join(" ")
        .toLowerCase()
        .includes(t)
    );
  }, [q]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setSel(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        close();
        return;
      }
      // global hotkeys when the palette is closed and no field is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (open || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key.toLowerCase() === "c") {
        router.push("/compare");
      } else if (/^[1-8]$/.test(e.key)) {
        const m = allMsmes()[Number(e.key) - 1];
        if (m) router.push(`/m/${m.id}`);
      }
    };
    const onTrigger = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-commandk]")) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onTrigger);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onTrigger);
    };
  }, [close, open, router]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const go = useCallback(
    (id: string) => {
      close();
      router.push(`/m/${id}`);
    },
    [router, close]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-ink-950/80 backdrop-blur-sm flex items-start justify-center pt-[16vh] px-4"
          onClick={close}
        >
          <motion.div
            initial={{ y: -12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="card w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 hairline-b">
              <span className="text-pulse-400 blip">●</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(s + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter" && results[sel]) {
                    go(results[sel].id);
                  }
                }}
                placeholder="Search the book — name, city, sector, grade…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-sage-dim"
              />
              <kbd className="chip !px-1.5 !py-0">esc</kbd>
            </div>
            <ul className="max-h-[46vh] overflow-y-auto py-1.5">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-[0.78rem] text-sage-dim">
                  Nothing on the wire for “{q}”.
                </li>
              )}
              {results.map((m, i) => (
                <li key={m.id}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(m.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: i === sel ? "rgba(59,227,154,0.07)" : "transparent" }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[0.85rem]" style={{ fontFamily: "var(--font-display)" }}>
                        {m.name}
                      </div>
                      <div className="text-[0.66rem] text-sage-dim num">
                        {m.id} · {m.sector} · {m.city}
                      </div>
                    </div>
                    <span
                      className="num text-sm font-semibold shrink-0"
                      style={{ color: GRADE_COLOR[m.scoring.grade] }}
                    >
                      {m.scoring.score} {m.scoring.grade}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hairline-t px-4 py-2 flex gap-3 text-[0.62rem] text-sage-dim num">
              <span>↑↓ move</span>
              <span>↵ open</span>
              <span>⌘K toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
