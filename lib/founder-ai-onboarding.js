import { communityChannels } from "@/lib/founder-data";
import { normalizeProfileInterests } from "@/lib/profile-interests";

export const FOUNDER_ONBOARDING_STORAGE_KEY = "founder-ai-onboarding-v1";

export const FOUNDER_GREETING =
  "Hallo, ich bin Founder — und ich möchte dir helfen, deine Träume zu verwirklichen.";

export const FOUNDER_QUESTIONS = [
  {
    id: "who",
    label: "Wer bist du?",
    hint: "Name, Alter, Hintergrund — stell dich kurz vor.",
    voiceHint: "Sag mir, wer du bist.",
  },
  {
    id: "what",
    label: "Was machst du gerade?",
    hint: "Business, Job, Projekt oder Idee — was beschäftigt dich?",
    voiceHint: "Erzähl, was du gerade machst.",
  },
  {
    id: "goals",
    label: "Was sind deine Ziele?",
    hint: "Umsatz, Freiheit, Skill — was willst du in 6–12 Monaten erreichen?",
    voiceHint: "Welche Ziele verfolgst du?",
  },
  {
    id: "context",
    label: "Interessen & Stand",
    hint: "Wo stehst du heute, welche Interessen hast du, was weißt du schon?",
    voiceHint: "Interessen, aktueller Stand und dein Wissen.",
  },
];

const COMMUNITY_KEYWORDS = {
  reselling: ["resell", "sneaker", "streetwear", "flip", "ebay", "vinted", "stockx", "margen"],
  dropshipping: ["dropship", "shopify", "lieferant", "creative", "produkt test", "aliexpress"],
  "e-commerce": ["e-commerce", "ecommerce", "dtc", "shop", "online handel", "conversion", "marke"],
  "real-estate": ["immobil", "real estate", "miete", "flip", "vermietung", "investment"],
  "tiktok-creator": ["tiktok", "creator", "content", "viral", "hook", "reel", "short"],
  "tiktok-shop": ["tiktok shop", "live shopping", "affiliate", "gmv"],
  "ki-creator": ["ki ", "ai ", "automation", "chatgpt", "midjourney", "workflow"],
  trading: ["trading", "aktien", "forex", "chart", "daytrade", "prop firm"],
  "memecoin-trading": ["memecoin", "crypto", "solana", "onchain", "degen"],
  "youtube-automation": ["youtube", "faceless", "automation channel", "thumbnail"],
  "traditional-services": [
    "handwerk",
    "detailing",
    "car detail",
    "autopflege",
    "agentur lokal",
    "dienstleist",
    "gmbh service",
  ],
  "web-design": ["web design", "website", "landing page", "figma", "ux", "design kunden"],
};

export const COMMUNITY_COACH_TIPS = {
  reselling:
    "Schreib deine erste Nachricht in die Reselling-Gruppe. Eine Gmail reicht fürs Starten — stell dich kurz vor und sag, womit du anfangen willst.",
  dropshipping:
    "Poste in Dropshipping dein Ziel-Setup (Shop, Nische, Budget). Frag nach Creatives oder Lieferanten — die Community teilt echte Learnings.",
  "e-commerce":
    "Stell in E-Commerce deine Marke oder deinen Shop vor. Frag konkret nach Conversion oder Logistik — je spezifischer, desto besser die Antworten.",
  "real-estate":
    "Stell dich in Real Estate vor: Deal-Typ, Region, Kapital. Frag nach erstem Deal oder Netzwerk — Elite-Gründer teilen dort Strategien.",
  "tiktok-creator":
    "Teile in TikTok Creator deine Nische und poste dein erstes Video-Idee. Frag nach Hooks — das beschleunigt dein Wachstum.",
  "tiktok-shop":
    "In TikTok Shop: Nenne Produkt und GMV-Ziel. Frag nach Creator-Affiliates oder Shop-Setup.",
  "ki-creator":
    "In KI Creator: Beschreib deinen Workflow. Frag nach Tools oder Automation — viele teilen fertige Stacks.",
  trading:
    "In Trading: Sei ehrlich zu Setup und Risiko. Keine All-in-Fragen — frag nach Journal oder Strategie.",
  "memecoin-trading":
    "Memecoin Trading ist High-Risk. Stell deine Research-Methode vor und lies zuerst die Regeln im Chat.",
  "youtube-automation":
    "In YouTube Automation: Nenne Nische und Upload-Rhythmus. Frag nach Skript- oder Thumbnail-Prozess.",
  "traditional-services":
    "Für Car Detailing & lokale Services: Nutze eine professionelle E-Mail mit Firmenname im Betreff. Schreib in Traditional Services dein Angebot und deine Stadt.",
  "web-design":
    "In Web Design: Zeig ein Portfolio-Link oder dein erstes Projekt. Frag nach Pricing oder Outreach-Vorlagen.",
};

const INTEREST_BY_SLUG = {
  reselling: "Reselling",
  dropshipping: "Dropshipping",
  "e-commerce": "E-Commerce",
  "real-estate": "Real Estate",
  "tiktok-creator": "TikTok Creator",
  "tiktok-shop": "TikTok Shop",
  "ki-creator": "KI Creator",
  trading: "Trading",
  "memecoin-trading": "Memecoin Trading",
  "youtube-automation": "YouTube Automation",
  "traditional-services": "Traditional Services",
  "web-design": "Web Design",
};

const CATEGORY_BY_SLUG = Object.fromEntries(communityChannels.map((c) => [c.slug, c.category]));

function normalizeText(value = "") {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function scoreCommunityMatch(slug, combinedText) {
  const keywords = COMMUNITY_KEYWORDS[slug] ?? [];
  let score = 0;

  for (const keyword of keywords) {
    if (combinedText.includes(normalizeText(keyword))) score += 2;
  }

  const category = CATEGORY_BY_SLUG[slug];
  if (category && combinedText.includes(normalizeText(category))) score += 3;
  if (combinedText.includes(normalizeText(slug.replace(/-/g, " ")))) score += 2;

  return score;
}

export function rankCommunitiesFromAnswers(answers, groups = []) {
  const combined = normalizeText(
    [answers.who, answers.what, answers.goals, answers.context].filter(Boolean).join(" ")
  );

  const scored = groups
    .map((group) => {
      const slug = group.slug ?? "";
      const score = scoreCommunityMatch(slug, combined);
      return {
        ...group,
        matchScore: score,
        coachTip: COMMUNITY_COACH_TIPS[slug] ?? "Tritt der Gruppe bei und stell dich mit deinem Ziel vor.",
        interestLabel: INTEREST_BY_SLUG[slug] ?? group.category,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || (b.member_count ?? 0) - (a.member_count ?? 0));

  const withFallback = scored.length > 0 ? scored : communityChannels.map((c) => ({ ...c, matchScore: 0 }));

  const top = [];
  const seen = new Set();
  for (const row of withFallback) {
    const key = row.slug ?? row.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    top.push(row);
    if (top.length >= 3) break;
  }

  return top;
}

export function buildProfilePatchFromAnswers(answers, rankedGroups = []) {
  const bio = truncate(
    [answers.who, answers.what, answers.goals].filter(Boolean).join(" · "),
    200
  );

  const interests = normalizeProfileInterests(
    rankedGroups.slice(0, 3).map((g) => g.interestLabel).filter(Boolean)
  );

  const industry = rankedGroups[0]?.category ?? rankedGroups[0]?.interestLabel ?? "";

  return { bio, interests, industry: industry || undefined };
}

function truncate(value, max) {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function answerCoachQuestion(question, { rankedGroups = [], joinedSlug = "" } = {}) {
  const q = normalizeText(question);

  if (!q.trim()) {
    return "Stell mir eine konkrete Frage — z. B. „Was muss ich in Reselling zuerst machen?“";
  }

  if (q.includes("gmail") || q.includes("mail") || q.includes("e-mail")) {
    if (q.includes("resell")) {
      return COMMUNITY_COACH_TIPS.reselling;
    }
    if (q.includes("detail") || q.includes("car")) {
      return COMMUNITY_COACH_TIPS["traditional-services"];
    }
    return "Für den Start reicht oft eine normale Gmail. Bei B2B-Services wie Car Detailing wirkt eine professionelle Domain mit Firmeninfo im Betreff seriöser.";
  }

  if (q.includes("erste nachricht") || q.includes("was muss ich") || q.includes("wie start")) {
    const slug = joinedSlug || rankedGroups[0]?.slug;
    if (slug && COMMUNITY_COACH_TIPS[slug]) return COMMUNITY_COACH_TIPS[slug];
    return "Tritt deiner Top-Community bei und schreib: Wer du bist, was du machst, welches Ziel du hast. Kurz reicht.";
  }

  if (q.includes("detailing") || q.includes("autopflege")) {
    return COMMUNITY_COACH_TIPS["traditional-services"];
  }

  for (const group of rankedGroups) {
    const slug = group.slug ?? "";
    const name = normalizeText(group.name ?? "");
    if (slug && q.includes(normalizeText(slug))) {
      return COMMUNITY_COACH_TIPS[slug] ?? group.coachTip;
    }
    if (name && q.includes(name)) {
      return COMMUNITY_COACH_TIPS[slug] ?? group.coachTip;
    }
  }

  return "Wähl eine der drei Communities auf dem Podium, tritt bei und stell dich vor. Frag mich jederzeit „Was muss ich als Erstes in [Branche] machen?“";
}

export function getOnboardingStorageKey(userId) {
  return `${FOUNDER_ONBOARDING_STORAGE_KEY}-${userId}`;
}

export function readOnboardingComplete(userId) {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return window.localStorage.getItem(getOnboardingStorageKey(userId)) === "done";
  } catch {
    return false;
  }
}

export function writeOnboardingComplete(userId) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(getOnboardingStorageKey(userId), "done");
}
