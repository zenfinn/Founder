import Link from "next/link";

const footerLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutzerklärung" },
  { href: "/agb", label: "AGB" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Footer() {
  return (
    <footer className="bg-founder-600 px-4 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white font-serif text-2xl font-bold text-founder-600">
            F
          </div>
          <div>
            <p className="font-serif text-xl font-bold leading-none">Founder</p>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-founder-50">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm font-medium text-founder-100">© 2026 Founder. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}
