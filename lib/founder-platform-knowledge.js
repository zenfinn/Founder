import { communityChannels, founderPro, ranks } from "@/lib/founder-data";

export function buildFounderPlatformKnowledge() {
  const communities = communityChannels
    .filter((channel) => channel.slug !== "founder-pro")
    .map((channel) => `• ${channel.name} (${channel.slug}): ${channel.description}`)
    .join("\n");

  const rankLines = ranks
    .map((rank) => `• ${rank.label} (${rank.id}): ${rank.description} Zugang: ${rank.access}`)
    .join("\n");

  return `FOUNDER PLATTFORM (joinfounder.forum) — deutsche Community für Gründer & Side-Hustler

HAUPTNAVIGATION:
• /dashboard — Start, Übersicht, Onboarding-Schritte
• /jarvis — Founder AI (du), Sprache & Text, Nischen-Matching
• /community — alle Nischen-Communities, Beitritt per Gruppe
• /inbox — Direktnachrichten & Chats
• /resources — Tools, Templates, Ressourcen
• /events — Meetups & Events
• /showcases — Projekt-Showcases der Community
• /mentoren — verifizierte Mentoren buchen (Scaler+)
• /leaderboard — Aktivitäts-Ranking
• /raenge — Rang-System & Verifizierung
• /profile — Profil, Avatar, Verifizierung hochladen
• /affiliate — Empfehlungsprogramm

RÄNGE:
${rankLines}

NISCHEN-COMMUNITIES (12):
${communities}

FOUNDER PRO: ${founderPro.price}/${founderPro.interval} — ${founderPro.benefits.join("; ")}

WICHTIG FÜR ANTWORTEN:
• Verweise auf konkrete Bereiche der App (z.B. „unter Community → Reselling“).
• Erkläre Schritte klar: registrieren → Jarvis/Onboarding → Community beitreten → Events/Mentoren nutzen.
• Bei Nischen-Fragen: Nutzer kann in Jarvis „Meine Top-Nischen“ nutzen oder direkt /community öffnen.`;
}
