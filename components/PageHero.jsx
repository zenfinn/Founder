import Image from "next/image";

export function PageHero({ eyebrow, title, description, imageUrl, children }) {
  return (
    <section className="relative overflow-hidden px-4 py-20 text-white">
      <Image src={imageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-founder-100">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">{description}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
