import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 flex-1 flex flex-col items-center justify-center text-center py-24">
        {/* a flatline — the one place the pulse goes quiet */}
        <svg viewBox="0 0 600 40" className="w-full max-w-md h-8 opacity-70" aria-hidden>
          <path
            d="M0,20 L240,20 L252,6 L264,34 L276,20 L600,20"
            stroke="var(--color-verm-400)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <h1
          className="mt-6 text-5xl font-medium"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Flatline.
        </h1>
        <p className="mt-3 text-sm text-sage max-w-sm leading-relaxed">
          Nothing on this wire — the file you&rsquo;re looking for isn&rsquo;t in the book.
        </p>
        <Link
          href="/"
          className="chip mt-6 hover:text-bone hover:border-pulse-500/50 transition-colors"
        >
          ← back to the book
        </Link>
      </main>
    </>
  );
}
