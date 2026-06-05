import { getRankLabel } from "@/lib/founder-data";

export const SITE_NAME = "Founder";
export const SITE_TAGLINE = "Die verifizierte Community für deutsche Unternehmer";
export const OG_IMAGE_URL = "https://joinfounder.forum/api/og";
export const DEFAULT_LOCALE = "de_DE";

export const SEO_KEYWORDS = [
  "Gründer Community Deutschland",
  "Unternehmer Netzwerk",
  "verifizierte Community",
  "Reselling Community",
  "E-Commerce Netzwerk Deutschland",
  "Mentor finden Unternehmer",
  "Networking Unternehmer Deutschland",
  "Founder Community",
  "Real Estate Community",
  "Web Design Community",
  "TikTok Creator Netzwerk",
];

export function getBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.joinfounder.forum";
  return url.replace(/\/$/, "");
}

export function buildOgImageUrl() {
  return OG_IMAGE_URL;
}

export function buildPageMetadata({
  path,
  title,
  description,
  keywords = SEO_KEYWORDS,
  ogType = "website",
  noIndex = false,
  ogImage,
  ogTitle,
}) {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const image = ogImage ?? OG_IMAGE_URL;

  return {
    title: { absolute: title },
    description,
    keywords: keywords.join(", "),
    alternates: {
      canonical: url,
      languages: { "de-DE": url },
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: ogTitle ?? title,
      description,
      url,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: ogType,
      images: [{ url: image, width: 1200, height: 630, alt: `${SITE_NAME} – ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description,
      images: [image],
    },
  };
}

/** @type {Record<string, { title: string, description: string, path: string, keywords?: string[] }>} */
export const PAGE_SEO = {
  home: {
    path: "/",
    title: "Founder – Die verifizierte Community für deutsche Unternehmer | Kostenlos beitreten",
    description:
      "Gründer Community Deutschland: Vernetze dich mit verifizierten Unternehmern in Branchen-Communities, buche Mentoren und entdecke Events. Kostenlos starten.",
    keywords: SEO_KEYWORDS,
  },
  raenge: {
    path: "/raenge",
    title: "Rang-System | Aspiring bis Elite – Founder Community",
    description:
      "Vom Aspiring bis Elite: Verifiziertes Rang-System für deutsche Unternehmer. Gewerbe, Umsatznachweis und BWA – transparent und fair.",
  },
  community: {
    path: "/community",
    title: "Branchen-Communities für Gründer | Reselling, E-Commerce, Trading & mehr",
    description:
      "Real Estate, E-Commerce, Web Design, Traditional Services und mehr – native Gruppen mit Chat, Ressourcen und Wins für verifizierte Gründer.",
  },
  events: {
    path: "/events",
    title: "Events & Networking für Unternehmer | Founder Community",
    description:
      "Networking Unternehmer Deutschland: Workshops, Founder Calls und Community-Events für verifizierte Gründer. Kalender und Einreichungen.",
  },
  mentoren: {
    path: "/mentoren",
    title: "Mentoren finden | Verifizierte Unternehmer als Coaches | Founder",
    description:
      "Mentor finden Unternehmer: Buche verifizierte Builder, Scaler und Elite als 1:1 Coaches. Transparente Monatspreise, Sessions pro Monat und Stripe-Buchung.",
  },
  leaderboard: {
    path: "/leaderboard",
    title: "Founder Leaderboard – Die aktivsten deutschen Unternehmer",
    description:
      "Top-Mitglieder der Founder Community nach wöchentlicher Aktivität. Das Unternehmer Netzwerk für echte Builder in Deutschland.",
  },
  showcases: {
    path: "/showcases",
    title: "Showcases | Projekte & Launches | Founder Community",
    description:
      "Entdecke Projekte, Shops und Launches von verifizierten Unternehmern. Teile dein Business in der Founder Community.",
  },
  impressum: {
    path: "/impressum",
    title: "Impressum | Founder Community",
    description: "Impressum und Anbieterkennzeichnung von Founder (Zndr Supply – Finn Zender), Deutschland.",
  },
  datenschutz: {
    path: "/datenschutz",
    title: "Datenschutz | Founder Community",
    description: "Datenschutzerklärung der Founder Community – Informationen zur Verarbeitung personenbezogener Daten.",
  },
  agb: {
    path: "/agb",
    title: "AGB | Founder Community",
    description: "Allgemeine Geschäftsbedingungen der Founder Community für Mitglieder und Dienstleistungen.",
  },
  kontakt: {
    path: "/kontakt",
    title: "Kontakt | Founder Community",
    description: "Kontakt zur Founder Community – Fragen zu Mitgliedschaft, Rängen, Mentoren und Events.",
  },
  login: {
    path: "/login",
    title: "Login | Founder Community",
    description: "Melde dich bei Founder an – deiner verifizierten Gründer Community in Deutschland.",
    noIndex: true,
  },
  register: {
    path: "/register",
    title: "Registrieren | Founder Community – Kostenlos beitreten",
    description: "Kostenlos bei Founder registrieren – verifizierte Unternehmer Community mit Branchen-Gruppen und Mentoren.",
  },
};

export function getPageMetadata(pageKey, overrides = {}) {
  const page = PAGE_SEO[pageKey];
  if (!page) return buildPageMetadata(overrides);
  return buildPageMetadata({
    path: page.path,
    title: page.title,
    description: page.description,
    keywords: page.keywords ?? SEO_KEYWORDS,
    noIndex: page.noIndex ?? false,
    ...overrides,
  });
}

export function buildProfileMetadata(profile, username) {
  const displayName = profile?.display_name?.trim() || username;
  const rankLabel = getRankLabel(profile?.current_rank ?? "aspiring");
  const title = `${displayName} | Verifizierter ${rankLabel} bei Founder`;
  const description = [
    `Verifizierter ${rankLabel} im Unternehmer Netzwerk Founder.`,
    profile?.company_name,
    profile?.bio?.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  return buildPageMetadata({
    path: `/u/${username}`,
    title,
    description,
    ogType: "profile",
    ogImage: profile?.avatar_url || OG_IMAGE_URL,
  });
}

export function buildOrganizationSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/founder-icon.svg`,
    description: SITE_TAGLINE,
    email: "joinfounder@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Im Mühlenfeld 15",
      addressLocality: "Wadern",
      postalCode: "66687",
      addressCountry: "DE",
    },
    sameAs: [baseUrl],
  };
}

export function buildLocalBusinessSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: baseUrl,
    description: SITE_TAGLINE,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Im Mühlenfeld 15",
      addressLocality: "Wadern",
      postalCode: "66687",
      addressCountry: "DE",
    },
    areaServed: { "@type": "Country", name: "Deutschland" },
  };
}

export function buildWebSiteSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    description: SITE_TAGLINE,
    inLanguage: "de-DE",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/community?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(items) {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };
}

export function buildPersonSchema(profile, username) {
  const baseUrl = getBaseUrl();
  const displayName = profile?.display_name?.trim() || username;
  const sameAs = [profile?.linkedin_url, profile?.instagram_url, profile?.website_url, profile?.twitter_url].filter(
    Boolean
  );

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `${baseUrl}/u/${username}`,
    image: profile?.avatar_url || `${baseUrl}/founder-icon.svg`,
    jobTitle: profile?.industry || "Unternehmer",
    worksFor: profile?.company_name
      ? { "@type": "Organization", name: profile.company_name }
      : { "@type": "Organization", name: SITE_NAME },
    description: profile?.bio?.trim() || `Verifizierter ${getRankLabel(profile?.current_rank ?? "aspiring")} bei Founder`,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildEventListSchema(events) {
  const baseUrl = getBaseUrl();
  return events.map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.starts_at,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.location_text || "Deutschland",
      address: { "@type": "PostalAddress", addressCountry: "DE" },
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: baseUrl },
    offers: {
      "@type": "Offer",
      price: (event.price_cents ?? 0) / 100,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/events`,
    },
  }));
}

export function buildFaqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export const RANK_FAQS = [
  {
    question: "Was ist der Unterschied zwischen Aspiring und Starter?",
    answer:
      "Aspiring reicht für die Registrierung mit E-Mail-Bestätigung. Starter erfordert eine Gewerbeanmeldung und schaltet Schreiben in Branchen-Channels sowie kostenlose Events frei.",
  },
  {
    question: "Welche Dokumente brauche ich für Builder, Scaler und Elite?",
    answer:
      "Builder: Kontoauszug oder Steuerbescheid (50k–250k EUR Umsatz). Scaler: BWA oder Steuerbescheid (250k–1M EUR). Elite: Jahresabschluss oder BWA (über 1M EUR Umsatz).",
  },
  {
    question: "Kostet Founder etwas?",
    answer:
      "Die Basis-Mitgliedschaft ist kostenlos. Founder Pro (14,99 EUR/Monat) ist optional für Premium-Ressourcen, unbegrenzte Community-Beitritte und die Pro Lounge.",
  },
  {
    question: "Wie funktioniert die Verifizierung?",
    answer:
      "Du lädst das passende Dokument für deinen Ziel-Rang hoch. Das Founder-Team prüft manuell und weist dir den Rang zu – transparent und DSGVO-konform.",
  },
  {
    question: "Kann ich als Mentor auftreten?",
    answer:
      "Ab Builder kannst du dich als Mentor bewerben. Monatspreise sind je nach Rang gedeckelt: Builder max. 50 EUR, Scaler max. 150 EUR, Elite max. 500 EUR. Du gibst an, wie viele Sessions du pro Monat anbietest.",
  },
];

export const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/profile",
  "/inbox",
  "/members",
  "/notifications",
  "/affiliate",
  "/payment",
  "/api",
];

export function isPrivatePath(path) {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
