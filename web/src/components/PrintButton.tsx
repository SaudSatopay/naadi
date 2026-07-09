"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="chip hover:text-bone hover:border-sage transition-colors print:hidden"
      title="Print / save the sanction memo as PDF"
    >
      ⎙ print memo
    </button>
  );
}
