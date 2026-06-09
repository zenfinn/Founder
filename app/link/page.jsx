import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const linkButtons = [
  { href: "/register", label: "Kostenlos beitreten", arrow: true },
  { href: "/community", label: "Community Wins ansehen", arrow: true },
  { href: "/leaderboard", label: "Leaderboard", arrow: true },
];

export const metadata = {
  title: "Founder – Link in Bio",
  description: "Die verifizierte Community für Gründer und Unternehmer in Deutschland.",
  robots: { index: true, follow: true },
};

export default function LinkInBioPage() {
  return (
    <main className="flex min-h-screen flex-col bg-founder-600 px-5 py-12 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div className="[&_p]:text-white">
          <BrandMark />
        </div>

        <p className="mt-8 max-w-xs text-lg font-semibold leading-8 text-founder-50">
          Die verifizierte Community für echte Unternehmer in Deutschland 🇩🇪
        </p>

        <nav className="mt-10 flex w-full flex-col gap-4">
          {linkButtons.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-white bg-white px-5 py-4 text-base font-bold text-founder-700 transition hover:bg-founder-50"
            >
              <span>{label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
