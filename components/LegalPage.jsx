import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

/** @deprecated Prefer self-contained legal pages under app/impressum, app/datenschutz, app/agb, app/kontakt */
export function LegalPage({ eyebrow, title, children }) {
  return (
    <div className="min-h-screen bg-[#001220] text-white font-sans leading-relaxed">
      <header className="border-b border-blue-900/40 px-8 py-4 md:px-16">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="[&_p]:text-white">
            <BrandMark />
          </Link>
          <Link href="/" className="text-sm font-bold text-blue-400 underline underline-offset-2 hover:text-blue-300">
            Zur Startseite
          </Link>
        </div>
      </header>
      <div className="p-8 md:p-16 max-w-4xl mx-auto">
        <span className="text-blue-500 font-bold uppercase tracking-wider text-sm">{eyebrow}</span>
        <h1 className="text-4xl font-bold mt-2 mb-8">{title}</h1>
        {children}
      </div>
    </div>
  );
}
