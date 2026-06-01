import Link from "next/link";

const mainLinks = [
  { href: "/raenge", label: "Ränge" },
  { href: "/community", label: "Community" },
  { href: "/showcases", label: "Showcases" },
  { href: "/events", label: "Events" },
  { href: "/mentoren", label: "Mentoren" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/register", label: "Kostenlos starten" },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutzerklärung" },
  { href: "/agb", label: "AGB" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Footer() {
  return (
    <footer className="bg-founder-600 px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white font-serif text-2xl font-bold text-founder-600">
              F
            </div>
            <div>
              <p className="font-serif text-xl font-bold leading-none">Founder</p>
              <p className="mt-1 text-sm font-medium text-founder-100">Gründer Community Deutschland</p>
            </div>
          </Link>

          <nav aria-label="Hauptnavigation" className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-200">Plattform</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-founder-50">
                {mainLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-200">Rechtliches</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-founder-50">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <p className="border-t border-founder-500/40 pt-6 text-sm font-medium text-founder-100">
          © {new Date().getFullYear()} Founder. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}
