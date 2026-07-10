import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare · NAADI",
  description: "Two MSME files, one radar — side-by-side underwriting with dimension deltas.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
