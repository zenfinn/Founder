import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function LegalPage({ eyebrow, title, children }) {
  return (
    <main className="min-h-screen bg-founder-900 text-white">
      <header className="border-b border-founder-700/50 bg-founder-950/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="[&_p]:text-white">
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-founder-600 px-4 py-2 text-sm font-bold text-founder-50 transition hover:border-founder-400 hover:text-white"
          >
            Zur Startseite
          </Link>
        </div>
      </header>
      <section className="px-4 py-10 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-300">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
          <div className="legal-content mt-10 space-y-6 text-base leading-8 text-founder-50">{children}</div>
        </article>
      </section>
    </main>
  );
}
