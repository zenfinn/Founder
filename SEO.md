# SEO – Founder Community (joinfounder.forum)

Stand: Mai 2026. Zentrale Konfiguration in `lib/seo.js`.

## Architektur

| Datei | Zweck |
|---|---|
| `lib/seo.js` | Meta-Templates, Keywords, Schema.org Builder, Sitemap-Helfer |
| `components/SEO.jsx` | JSON-LD `<script>` auf Seiten |
| `components/Breadcrumbs.jsx` | Sichtbare Breadcrumbs + BreadcrumbList Schema |
| `components/Analytics.jsx` | GA4 Page Views + Custom Events |
| `app/api/og/route.jsx` | Dynamische OG-Bilder (1200×630, Royal Blue) |
| `app/sitemap.js` | Statische Routen + öffentliche Profile aus Supabase |
| `app/robots.js` | Crawler-Regeln |

## Seiten-Titles (absolute, ohne Template-Suffix)

- `/` – Founder – Die verifizierte Community für deutsche Unternehmer \| Kostenlos beitreten
- `/raenge` – Rang-System \| Aspiring bis Elite – Founder Community
- `/community` – Branchen-Communities für Gründer \| …
- `/events` – Events & Networking für Unternehmer \| …
- `/mentoren` – Mentoren finden \| …
- `/leaderboard` – Founder Leaderboard – …
- `/u/[username]` – `[Name] \| Verifizierter [Rang] bei Founder`

## Strukturierte Daten

- **Landing:** Organization, WebSite, LocalBusiness
- **Ränge:** FAQPage (5 Fragen)
- **Events:** Event (Preview-Events aus `sampleEvents`)
- **Profile:** Person
- **Unterseiten:** BreadcrumbList

## Robots / Noindex

Blockiert: `/admin`, `/dashboard`, `/profile/*`, `/inbox`, `/members/*`, `/api/*`, `/affiliate`, `/payment/*`

## Environment

```bash
NEXT_PUBLIC_APP_URL=https://www.joinfounder.forum
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # optional
```

## Analytics Events

- `pro_upgrade_click` – Founder Pro Checkout Button
- `page_view` – automatisch bei Route-Wechsel

Weitere Events vorbereitet: `community_join`, `mentor_booking`, `event_registration` (via `trackEvent()` aus `components/Analytics.jsx`).

## Prüfliste nach Deploy

1. `npm run build` erfolgreich
2. `https://www.joinfounder.forum/sitemap.xml`
3. `https://www.joinfounder.forum/robots.txt`
4. [Google Rich Results Test](https://search.google.com/test/rich-results) für `/` und `/raenge`
5. [OpenGraph.xyz](https://www.opengraph.xyz/) für OG-Tags
6. Search Console: Sitemap einreichen

## Hinweise

- `/community` erfordert Login – Meta-Tags sind trotzdem gesetzt für Shares; Inhalt ist für Crawler ohne Session nicht sichtbar.
- OG-Bilder: `/api/og?title=...&subtitle=...`
- Keywords in H1 auf Landing, Ränge, Community, Events, Mentoren, Leaderboard eingebaut.
