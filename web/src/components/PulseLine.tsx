/** The NAADI signature: a running ECG trace. Pure CSS animation, no JS. */
export default function PulseLine({ className = "" }: { className?: string }) {
  // one heartbeat complex repeated across the width
  const beat =
    "M0,20 L28,20 L34,20 L38,12 L42,26 L46,20 L58,20 L63,4 L68,34 L73,20 L92,20 L98,16 L104,20";
  const beats = [0, 104, 208, 312, 416, 520].map(
    (dx) => `translate(${dx},0)`
  );
  return (
    <svg
      viewBox="0 0 624 40"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pl-fade" x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-pulse-400)" stopOpacity="0" />
          <stop offset="0.15" stopColor="var(--color-pulse-400)" stopOpacity="0.9" />
          <stop offset="0.85" stopColor="var(--color-pulse-400)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-pulse-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#pl-fade)"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1000}
        className="ecg-path"
        style={{ filter: "drop-shadow(0 0 6px rgba(59,227,154,.45))" }}
      >
        {beats.map((t, i) => (
          <path key={i} d={beat} transform={t} />
        ))}
      </g>
    </svg>
  );
}
