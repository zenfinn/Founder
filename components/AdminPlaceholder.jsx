import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function AdminPlaceholder({ title, eyebrow, description, actions = [] }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin">
            <BrandMark />
          </Link>
          <Link href="/admin" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
            Admin
          </Link>
        </div>
      </header>
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {actions.map((action) => (
              <article key={action.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <h2 className="font-serif text-2xl font-bold text-slate-950">{action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
