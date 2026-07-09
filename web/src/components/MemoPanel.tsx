import type { ReactNode } from "react";

/** Minimal renderer for Munshi's markdown memo (headings, bullets, inline
 *  bold/italic/code). No external markdown dependency. */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index! + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function render(md: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      nodes.push(<ul key={key}>{bullets}</ul>);
      bullets = [];
    }
  };
  md.split("\n").forEach((line, i) => {
    const key = `l${i}`;
    if (line.startsWith("## ")) {
      flush(`f${i}`);
      nodes.push(<h2 key={key}>{inline(line.slice(3), key)}</h2>);
    } else if (line.startsWith("### ")) {
      flush(`f${i}`);
      nodes.push(<h3 key={key}>{inline(line.slice(4), key)}</h3>);
    } else if (line.startsWith("- ")) {
      bullets.push(<li key={key}>{inline(line.slice(2), key)}</li>);
    } else if (line.trim() === "") {
      flush(`f${i}`);
    } else {
      flush(`f${i}`);
      nodes.push(<p key={key}>{inline(line, key)}</p>);
    }
  });
  flush("fend");
  return nodes;
}

export default function MemoPanel({ memo }: { memo: string }) {
  return (
    <div className="card relative overflow-hidden p-6">
      {/* munshi seal */}
      <div
        className="absolute -right-7 -top-7 size-28 rounded-full border border-marigold-500/30 flex items-center justify-center rotate-12"
        aria-hidden
      >
        <span className="label-caps !text-marigold-400/70 mt-10 mr-8">munshi</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="label-caps">Underwriting memo — drafted by Munshi</h3>
        <span className="chip !text-pulse-300 !border-pulse-500/30">
          LLM writes prose · engine writes numbers
        </span>
      </div>
      <div className="memo">{render(memo)}</div>
    </div>
  );
}
