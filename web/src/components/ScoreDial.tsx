"use client";

/** Sphygmo-style instrument gauge: 300-900 arc, fine ticks, sweeping needle,
 *  count-up numeral. The centrepiece of the Health Card. */

import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import { GRADE_COLOR } from "@/lib/format";
import { GradeChip } from "./Chips";

const CX = 150;
const CY = 150;
const R = 116;

const BANDS: [number, number, string][] = [
  [300, 500, GRADE_COLOR["E"]],
  [500, 580, GRADE_COLOR["D"]],
  [580, 660, GRADE_COLOR["C"]],
  [660, 740, GRADE_COLOR["B"]],
  [740, 800, GRADE_COLOR["A"]],
  [800, 900, GRADE_COLOR["A+"]],
];

const angleOf = (score: number) => 180 + (180 * (score - 300)) / 600; // degrees
const pt = (angleDeg: number, r: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const arcPath = (s0: number, s1: number, r: number) => {
  const [x0, y0] = pt(angleOf(s0), r);
  const [x1, y1] = pt(angleOf(s1), r);
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
};

export default function ScoreDial({
  score,
  band,
  grade,
  pd,
}: {
  score: number;
  band: number;
  grade: string;
  pd: number;
}) {
  const mv = useMotionValue(300);
  const [shown, setShown] = useState(300);
  useMotionValueEvent(mv, "change", (v) => setShown(Math.round(v)));
  useEffect(() => {
    const ctrl = animate(mv, score, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    return () => ctrl.stop();
  }, [score, mv]);

  const needleAngle = angleOf(shown);
  const gradeColor = GRADE_COLOR[grade] ?? "var(--color-pulse-400)";
  const ticks = [];
  for (let s = 300; s <= 900; s += 25) {
    const major = s % 100 === 0;
    const [x0, y0] = pt(angleOf(s), R + 6);
    const [x1, y1] = pt(angleOf(s), R + (major ? 18 : 12));
    ticks.push(
      <g key={s}>
        <line
          x1={x0} y1={y0} x2={x1} y2={y1}
          stroke={major ? "var(--color-sage)" : "var(--color-ink-600)"}
          strokeWidth={major ? 1.4 : 1}
        />
        {major && (
          <text
            x={pt(angleOf(s), R + 30)[0]}
            y={pt(angleOf(s), R + 30)[1] + 3}
            textAnchor="middle"
            className="num"
            fontSize="9"
            fill="var(--color-sage-dim)"
          >
            {s}
          </text>
        )}
      </g>
    );
  }

  const [nx, ny] = pt(needleAngle, R - 14);

  return (
    <div className="relative select-none">
      <svg viewBox="0 0 300 190" className="w-full max-w-[340px]">
        {/* grade bands */}
        {BANDS.map(([s0, s1, c]) => (
          <path
            key={s0}
            d={arcPath(s0 + 2, s1 - 2, R)}
            stroke={c}
            strokeOpacity={0.28}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {/* lit arc up to current score */}
        <motion.path
          d={arcPath(302, Math.max(305, shown), R)}
          stroke={gradeColor}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
          style={{ filter: `drop-shadow(0 0 8px color-mix(in oklab, ${gradeColor} 60%, transparent))` }}
        />
        {ticks}
        {/* needle */}
        <line
          x1={CX} y1={CY} x2={nx} y2={ny}
          stroke="var(--color-bone)"
          strokeWidth={1.6}
        />
        <circle cx={CX} cy={CY} r={5} fill="var(--color-ink-700)" stroke="var(--color-bone)" strokeWidth={1.2} />
      </svg>

      <div className="absolute inset-x-0 bottom-0 text-center pb-1">
        <div className="flex items-end justify-center gap-2">
          <span
            className="num text-6xl font-semibold leading-none"
            style={{ fontFamily: "var(--font-display)", color: gradeColor }}
          >
            {shown}
          </span>
          <span className="num text-sage text-sm mb-1">± {band}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <GradeChip grade={grade} />
          <span className="chip">PD 12m · {(pd * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
