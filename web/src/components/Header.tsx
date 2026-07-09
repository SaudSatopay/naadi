import Link from "next/link";
import PulseLine from "./PulseLine";

export default function Header() {
  return (
    <header className="hairline-b sticky top-0 z-50 backdrop-blur-md bg-[rgba(7,15,12,0.82)] print:hidden">
      <div className="mx-auto max-w-6xl px-5 py-3 flex items-center gap-5">
        <Link href="/" className="flex items-baseline gap-2 shrink-0 group">
          <span
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NAADI
          </span>
          <span className="text-sm text-sage group-hover:text-pulse-300 transition-colors">
            नाड़ी
          </span>
        </Link>
        <PulseLine className="h-7 flex-1 min-w-0 opacity-80" />
        <div className="hidden md:flex items-center gap-2">
          <button data-commandk className="chip hover:text-bone hover:border-sage transition-colors cursor-pointer">
            search <kbd className="text-pulse-300">⌘K</kbd>
          </button>
          <span className="chip">IDBI Innovate ’26 · Track 03</span>
          <span className="chip" style={{ color: "var(--color-marigold-400)", borderColor: "rgba(233,180,76,.35)" }}>
            Synthetic demo data
          </span>
        </div>
      </div>
    </header>
  );
}
