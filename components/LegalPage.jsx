import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function LegalPage({ eyebrow, title, children }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/">
            <BrandMark />
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Zur Startseite
          </Link>
        </div>
      </header>
      <section className="px-4 py-10">
        <article className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <div className="prose prose-slate mt-8 max-w-none prose-headings:font-serif prose-headings:text-slate-950 prose-p:leading-7">
            {children}
          </div>
        </article>
      </section>
    </main>
  );
}
