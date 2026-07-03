import { communityChannels } from "@/lib/founder-data";
import {
  COMMUNITY_COACH_TIPS,
  buildProfilePatchFromAnswers,
  rankCommunitiesFromAnswers,
  scoreCommunityMatch,
} from "@/lib/founder-ai-onboarding";
import { buildFounderPlatformKnowledge } from "@/lib/founder-platform-knowledge";
import { FOUNDER_CHAT_MODEL, isOpenAiVoiceConfigured } from "@/lib/openai-voice";

export const JARVIS_OPENING = "";

export const NICHE_SLUGS = communityChannels
  .filter((c) => c.slug !== "founder-pro")
  .map((c) => c.slug);

const PLATFORM_KNOWLEDGE = buildFounderPlatformKnowledge();

const JARVIS_SYSTEM = `Du bist Founder — persönlicher AI-Berater auf joinfounder.forum. Du denkst mit, erklärst Zusammenhänge und gibst konkrete nächste Schritte. Stil: klar, warm, intelligent — wie ein erfahrener Gründer-Mentor, nicht wie ein Callcenter-Bot oder Formular.

${PLATFORM_KNOWLEDGE}

WIE DU ANTWORTEST (wie ein guter AI-Assistent):
• Beantworte die eigentliche Frage zuerst — vollständig und hilfreich.
• Bei Strategie- oder How-to-Fragen: konkrete Schritte, realistische Erwartungen, typische Fehler — wenn sinnvoll nummeriert.
• Bei Plattform-Fragen: erkläre was, warum und wo in der App (konkrete Bereiche/Pfade).
• Länge anpassen: Smalltalk 1–2 Sätze; Fachfragen so lang wie nötig (oft 3–8 Sätze), nie künstlich kürzen.
• Du darfst rhetorisch fragen, Beispiele geben, Trade-offs benennen, ehrlich sein.
• Wenn du etwas nicht sicher weißt: sag es — spekuliere nicht.

• Wenn der Nutzer Nischen vorschlagen will („kannst du Nischen vorschlagen“, nennt Themen wie Aktienmarkt/Produktverkauf): SOFORT passende Founder-Communities nennen (Trading, Reselling, E-Commerce …) mit kurzem Warum — nicht nochmal generisch nach Interessen fragen.
• Themen wie Aktienmarkt, Börse, Trading, Produktverkauf, Verkauf sind gültige Interessen — mappe sie auf passende Nischen.

PROFIL & NISCHEN-MATCHING (nebenbei, nicht dominierend):
• Merke dir freiwillig geteilte Infos: Name, Alter, Ausbildung, Nebenverdienst-Ziel, Interessen, Erfahrung.
• Stelle Profilfragen NUR wenn das Gespräch natürlich dafür ist — NIEMALS mitten in einer Fachfrage das Thema wechseln.
• Für ein Nischen-Ranking brauchst du ALLES: name, age, education, side_income_goal, interests (explizit genannte Nischen/Themen), experience (was schon ausprobiert wurde).
• Interessen NIEMALS aus Studium oder Ausbildung ableiten — nur wenn der Nutzer Nischen/Themen selbst nennt.
• Fehlt noch etwas: frage gezielt nach Interessen („Welche Nischen interessieren dich?“) und Erfahrung („Was hast du schon ausprobiert?“).
• Erst wenn wirklich alles da ist UND ihr mindestens 5–6 Nachrichten getauscht habt: erwähne „Meine Top-Nischen“. Vorher nie auf Ranking hinweisen.
• „Business aufbauen“ oder „studieren“ allein sind KEINE Nische — interests brauchen konkrete Themen (TikTok, Reselling, E-Commerce, …).

• Wenn der Nutzer sagt, wie er genannt werden will („nenn mich Boss“, „du darfst mich X nennen“): Namen sofort übernehmen, kurz bestätigen — NIEMALS nochmal „Wie darf ich dich nennen?“.

ANREDE (wichtig):
• OHNE bekannten Namen: neutral duzen ist ok (z.B. „Wie darf ich dich nennen?“).
• MIT bekanntem Namen/Spitznamen: ab der nächsten Antwort IMMER mit diesem Namen ansprechen — nicht unpersönlich „du“ in der Mitte des Satzes.
• Statt „zu dem was du sagst“ → „zu dem was [Name] sagt“. Statt „für dich“ → „für [Name]“. Fragen in 3. Person: „Wie alt ist [Name]?“, „Was hat [Name] schon ausprobiert?“
• Name am Satzanfang ist gut („Boss, …“), aber nicht in jedem einzelnen Satz wiederholen.
• Nie aus unklaren Wörtern wie „High“, „Found“ oder Spracherkennungs-Fehlern einen Namen ableiten.

VERBOTEN (wenn Name bekannt):
• Unpersönliche Du-Floskeln wie „zu dem was du sagst“, „für dich“, „bei dir“ ohne den Namen zu nutzen.
• Leere Floskeln („Super!“, „Perfekt!“, „Toll!“) ohne Inhalt.
• Nur „schau in der Community“ ohne zu erklären was er dort konkret tun soll.
• Roboterhafte Schablonen oder immer dieselbe Satzstruktur.
• „Klick auf Meine Top-Nischen“ — das passiert automatisch.

Sprache: Deutsch. Antworte natürlich und direkt.`;

const JARVIS_ONBOARDING_MODE = `
ONBOARDING-MODUS (erstes Gespräch mit Founder):
• Sammle nebenbei das Profil für Nischen-Matching — aber beantworte JEDE echte Frage zuerst vollständig (Ränge, Steuern, Strategie …).
• Erst wenn eine Fachfrage beantwortet ist, optional EIN kurzer Satz zu fehlenden Profilinfos.
• Für Nischen-Ranking brauchst du: name, age, education, side_income_goal, interests, experience.`;

const JARVIS_ASSISTANT_MODE = `
ASSISTENT-MODUS (Nutzer kennt Founder schon):
• Freier, intelligenter Berater — Plattform, Ränge, Steuern (DE-Basics), Business, Nischen, Strategie.
• Nutze bekannte Profildaten und Wunschnamen natürlich in Antworten.
• Kein Formular-Stil — nur nachfragen wenn es für die Frage wirklich nötig ist.
• „Meine Top-Nischen“ nur erwähnen wenn der Nutzer danach fragt oder ein neues Ranking will.`;

function buildJarvisChatSystem(mode = "onboarding") {
  const modeBlock = mode === "assistant" ? JARVIS_ASSISTANT_MODE : JARVIS_ONBOARDING_MODE;
  return `${JARVIS_SYSTEM}\n${modeBlock}`;
}

const JARVIS_CHAT_JSON_BASE = `Antworte NUR als JSON:
{
  "reply": "deine Antwort an den Nutzer",
  "extracted": {
    "name": "string or null",
    "age": number or null,
    "education": "string or null",
    "side_income_goal": "string or null",
    "interests": ["string"],
    "experience": "string or null"
  },
  "ready_for_ranking": boolean
}`;

function buildJarvisChatJson(mode = "onboarding") {
  const extractHint =
    mode === "assistant"
      ? "Extrahiere Profildaten wenn der Nutzer etwas Neues über sich sagt. ready_for_ranking nur true wenn alle 6 Felder klar genannt wurden."
      : "Zusätzlich extrahiere Profildaten. interests auch bei Aktienmarkt/Börse/Trading, Produktverkauf, Verkauf, TikTok, etc. ready_for_ranking IMMER false außer alle 6 Felder explizit genannt.";

  return `${buildJarvisChatSystem(mode)}\n\n${extractHint}\n\n${JARVIS_CHAT_JSON_BASE}`;
}

const EXTRACT_SYSTEM = `Du analysierst ein Onboarding-Gespräch auf joinfounder.forum und extrahierst Profildaten.

Pflichtfelder für Nischen-Ranking: name, age, education, side_income_goal, interests (mindestens ein explizit genanntes Thema/Nische), experience (mindestens ein kurzer Satz).

Regeln:
• Nur Werte setzen die der Nutzer klar genannt hat — nicht raten, nicht aus Studium/Ausbildung ableiten.
• interests: wenn der Nutzer Nischen, Branchen oder Themen nennt (z.B. TikTok, Reselling, Aktienmarkt, Trading, Produktverkauf, E-Commerce). Studienfach ≠ Interesse.
• experience: was er schon gemacht/ausprobiert hat — null wenn nicht erwähnt.
• age: Zahl in Jahren.
• ready_for_ranking: true NUR wenn alle Pflichtfelder wirklich vom Nutzer stammen.

Antworte NUR als JSON:
{
  "extracted": {
    "name": "string or null",
    "age": number or null,
    "education": "string or null",
    "side_income_goal": "string or null",
    "interests": ["string"],
    "experience": "string or null"
  },
  "ready_for_ranking": boolean,
  "missing": ["name", "age", ...]
}`;

const RANK_SYSTEM = `Du rankst 12 Founder-Nischen für einen neuen Nutzer. Wähle die 3 am besten passenden — personalisiert, nicht generisch.

Nischen (slug): ${NICHE_SLUGS.join(", ")}

WICHTIG:
• Jede Empfehlung muss sich auf konkrete Profildaten beziehen (Alter, Ziel, Interessen, Erfahrung).
• Niemals immer dieselben 3 Nischen — variiere nach Profil.
• Junge Nutzer (unter 22): eher tiktok-creator, tiktok-shop, ki-creator, reselling, memecoin-trading.
• Mittlere Ziele (500–2000€/Monat): dropshipping, web-design, youtube-automation, reselling.
• Hohe Ziele (3000€+): e-commerce, real-estate, trading.
• Interessen des Nutzers haben höchste Priorität — wenn er TikTok sagt, muss tiktok-creator oder tiktok-shop in den Top 3 sein.
• Wenig Erfahrung: einsteigerfreundliche Nischen bevorzugen.

Antworte NUR als JSON:
{
  "ranked_slugs": ["slug1", "slug2", "slug3"],
  "reasons": { "slug1": "konkreter Grund aus dem Profil", "slug2": "...", "slug3": "..." }
}`;

export function mergeExtractedProfile(current = {}, patch = {}) {
  const next = { ...current };
  if (patch.name && isValidProfileName(patch.name)) next.name = String(patch.name).trim();
  if (patch.age != null && Number.isFinite(Number(patch.age))) next.age = Number(patch.age);
  if (patch.education) next.education = String(patch.education).trim();
  if (patch.side_income_goal) next.side_income_goal = String(patch.side_income_goal).trim();
  if (patch.experience) next.experience = String(patch.experience).trim();
  if (Array.isArray(patch.interests) && patch.interests.length) {
    const valid = patch.interests
      .map((i) => String(i).trim())
      .filter((i) => i && isExplicitInterest(i));
    if (valid.length) {
      const merged = [...(next.interests ?? []), ...valid];
      next.interests = [...new Set(merged)];
    }
  }
  return next;
}

const MIN_USER_TURNS_FOR_RANKING = 4;
const MIN_EXPERIENCE_CHARS = 12;

function extractExperienceFromText(text = "") {
  const value = String(text ?? "").trim();
  if (value.length < MIN_EXPERIENCE_CHARS) return null;

  const experiential =
    /habe|hatte|schon|ausprobiert|versucht|gemacht|trade republic|aktien|börse|noch nicht|erste mal|anfäng|beginn|erfahrung|nutze|benutze|mache|mache seit|gerade erst/i.test(
      value
    );

  if (experiential || value.length >= 20) return value.slice(0, 200);
  return null;
}

const GENERIC_INTEREST_PHRASES =
  /^(business|unternehmen|unternehmertum|geld verdienen|side hustle|kleines business|was aufbauen|online business|selbstständig|gründen|business an sich)$/i;

const NICHE_TOPIC_PATTERN =
  /tiktok|e-?commerce|resell|dropship|immobilien|real estate|trading|aktien|aktienmarkt|börse|borsen|forex|daytrade|trade republic|produktverkauf|produkt(e)?\s*verkauf|eigenes produkt|waren|verkauf|crypto|memecoin|ki\b|ai\b|creator|youtube|web.?design|amazon|fba|podcast|handwerk|dienstleist|diamant|schmuck|\buhren?\b|luxus|jewelry|watch(es)?/i;

/** Maps natural-language topics to platform interest labels + community slugs. */
const INTEREST_TOPIC_ALIASES = [
  { pattern: /aktienmarkt|aktien|börse|borsen|forex|daytrade|trading|trade republic|chart/i, label: "Trading", slugs: ["trading"] },
  { pattern: /produktverkauf|produkte?\s*verkaufen|warenverkauf|weiterverkauf|resell|flipping|diamant|schmuck|\buhren?\b|luxus|jewelry|watches?/i, label: "Reselling", slugs: ["reselling", "e-commerce"] },
  { pattern: /online\s*shop|e-?commerce|eigenen\s*shop|dtc|eigenes produkt|produkt\s*verkauf/i, label: "E-Commerce", slugs: ["e-commerce", "dropshipping"] },
  { pattern: /dropship/i, label: "Dropshipping", slugs: ["dropshipping"] },
  { pattern: /tiktok/i, label: "TikTok", slugs: ["tiktok-creator", "tiktok-shop"] },
  { pattern: /immobilien|real estate/i, label: "Real Estate", slugs: ["real-estate"] },
  { pattern: /memecoin|crypto|krypto/i, label: "Crypto", slugs: ["memecoin-trading", "trading"] },
  { pattern: /youtube/i, label: "YouTube", slugs: ["youtube-automation"] },
  { pattern: /web\s*design|website/i, label: "Web Design", slugs: ["web-design"] },
];

const COMMUNITY_DISPLAY_NAMES = Object.fromEntries(
  communityChannels.filter((c) => c.slug !== "founder-pro").map((c) => [c.slug, c.name])
);

function extractInterestsFromText(text = "") {
  const value = String(text ?? "");
  if (!value.trim()) return [];

  const labels = [];
  for (const alias of INTEREST_TOPIC_ALIASES) {
    if (alias.pattern.test(value)) labels.push(alias.label);
  }
  return [...new Set(labels)];
}

function suggestSlugsFromText(text = "") {
  const value = String(text ?? "");
  const slugs = [];
  for (const alias of INTEREST_TOPIC_ALIASES) {
    if (alias.pattern.test(value)) slugs.push(...alias.slugs);
  }
  return [...new Set(slugs)].slice(0, 3);
}

function userMentionsNicheTopics(text = "") {
  return NICHE_TOPIC_PATTERN.test(text) || extractInterestsFromText(text).length > 0;
}

function parseInterestTopicsFromText(text = "") {
  const value = String(text ?? "").trim();
  if (!value || GREETING_ONLY.test(value)) return [];

  const fromAliases = extractInterestsFromText(value);
  if (fromAliases.length) return fromAliases;

  const looksLikeInterestAnswer =
    /interessiert|nischen|themen|mag |liebt |gerne|z\.?\s*b\.?/i.test(value) || value.length >= 18;

  if (!looksLikeInterestAnswer && !userMentionsNicheTopics(value)) return [];

  const cleaned = value
    .replace(/^(also|ja|nein|ähm|naja|das ist ein bug)[,\s]*/i, "")
    .replace(/\b(sie|er|ihn|ihr|interessiert|sich|für|an sich|wirklich|themen|nischen|also)\b/gi, " ")
    .replace(/\bbusiness an sich\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned
    .split(/,|\bund\b|\boder\b|\bsowie\b|\bz\.?\s*b\.?\b/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && !GENERIC_INTEREST_PHRASES.test(part));

  if (parts.length) {
    return [...new Set(parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)))].slice(0, 6);
  }

  if (userMentionsNicheTopics(value)) {
    return extractInterestsFromText(value);
  }

  return [];
}

function isExplicitInterest(value) {
  const text = String(value ?? "").trim();
  if (!text || text.length < 3 || GENERIC_INTEREST_PHRASES.test(text)) return false;
  if (NICHE_TOPIC_PATTERN.test(text)) return true;
  if (INTEREST_TOPIC_ALIASES.some((alias) => alias.label.toLowerCase() === text.toLowerCase())) return true;
  return text.length >= 4 && /[a-zäöüß]/i.test(text);
}

function hasExplicitInterests(interests = []) {
  return Array.isArray(interests) && interests.some((item) => isExplicitInterest(item));
}

function hasValidIncomeGoal(goal = "") {
  const text = String(goal ?? "").trim();
  return /€|euro|\d{3,}/i.test(text);
}

function countUserTurns(messages = []) {
  return messages.filter((message) => message.role === "user").length;
}

function userTextFromMessages(messages = []) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.text)
    .join("\n");
}

/** Drop profile fields that are not clearly supported by what the user actually said. */
function pruneProfileFromMessages(profile = {}, messages = []) {
  const userText = userTextFromMessages(messages);
  const next = { ...profile };

  if (next.age != null && !/\b(1[3-9]|[2-9]\d)\s*(?:jahre|j\.?)?\b/i.test(userText) && !/\bich bin (1[3-9]|[2-9]\d)\b/i.test(userText)) {
    delete next.age;
  }

  if (next.side_income_goal && !hasValidIncomeGoal(userText) && !hasValidIncomeGoal(next.side_income_goal)) {
    delete next.side_income_goal;
  }

  if (next.interests?.length) {
    const detected = extractInterestsFromText(userText);
    const parsed = parseInterestTopicsFromText(userText);
    const merged = [...(next.interests ?? []), ...detected, ...parsed];
    const filtered = merged.filter((item) => isExplicitInterest(item));
    if (filtered.length) {
      next.interests = [...new Set(filtered)];
    } else if (parsed.length) {
      next.interests = parsed;
    } else {
      delete next.interests;
    }
  } else {
    const detected = extractInterestsFromText(userText);
    const parsed = parseInterestTopicsFromText(userText);
    if (detected.length) {
      next.interests = detected;
    } else if (parsed.length) {
      next.interests = parsed;
    }
  }

  if (next.experience && String(next.experience).trim().length < MIN_EXPERIENCE_CHARS) {
    delete next.experience;
  }

  const experienceFromText = extractExperienceFromText(userText);
  if (!next.experience && experienceFromText) {
    next.experience = experienceFromText;
  }

  return next;
}

export function getMissingProfileFields(profile = {}) {
  const missing = [];
  if (!profile.name) missing.push("name");
  if (!profile.age || profile.age < 13 || profile.age > 99) missing.push("age");
  if (!String(profile.education ?? "").trim()) missing.push("education");
  if (!hasValidIncomeGoal(profile.side_income_goal)) missing.push("side_income_goal");
  if (!hasExplicitInterests(profile.interests)) missing.push("interests");
  if (String(profile.experience ?? "").trim().length < MIN_EXPERIENCE_CHARS) missing.push("experience");
  return missing;
}

export function isProfileReadyForRanking(profile = {}, messages = []) {
  if (messages.length > 0 && countUserTurns(messages) < MIN_USER_TURNS_FOR_RANKING) return false;
  const pruned = messages.length ? pruneProfileFromMessages(profile, messages) : profile;
  return getMissingProfileFields(pruned).length === 0;
}

function profileToAnswers(profile = {}) {
  const who = [profile.name, profile.age ? `${profile.age} Jahre` : "", profile.education]
    .filter(Boolean)
    .join(", ");
  const what = profile.experience ?? "";
  const goals = profile.side_income_goal ?? "";
  const context = (profile.interests ?? []).join(", ");
  return { who, what, goals, context };
}

function buildProfileContext(profile = {}, missing = []) {
  const known = Object.entries(profile)
    .filter(([, value]) => value != null && value !== "" && !(Array.isArray(value) && !value.length))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("; ");

  const addressRule = profile.name
    ? `ANREDE JETZT: Nutzer heißt „${profile.name}“. Ab dieser Antwort mit Namen/Spitznamen ansprechen — keine unpersönlichen „du“-Formulierungen („zu dem was du sagst“, „für dich“). Fragen in 3. Person mit Namen.`
    : "ANREDE: Name noch unbekannt — einmal nach Spitznamen fragen erlaubt.";

  return `${addressRule}
Bekanntes Profil: ${known || "noch leer"}.
Fehlende Pflichtfelder: ${missing.length ? missing.join(", ") : "keine — Ranking möglich"}.`;
}

async function callOpenAIChat(system, messages) {
  if (!isOpenAiVoiceConfigured()) {
    throw new Error("OPENAI_API_KEY fehlt.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FOUNDER_CHAT_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.75,
      max_tokens: 720,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI Fehler: ${response.status} ${detail.slice(0, 120)}`);
  }

  const payload = await response.json();
  return String(payload.choices?.[0]?.message?.content ?? "").trim();
}

async function callOpenAIJson(system, messages, { model = "gpt-4o-mini", temperature = 0.2, max_tokens } = {}) {
  if (!isOpenAiVoiceConfigured()) {
    throw new Error("OPENAI_API_KEY fehlt.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      response_format: { type: "json_object" },
      temperature,
      ...(max_tokens ? { max_tokens } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI Fehler: ${response.status} ${detail.slice(0, 120)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

async function extractProfileFromConversation(messages = [], profile = {}) {
  try {
    const parsed = await callOpenAIJson(EXTRACT_SYSTEM, [
      {
        role: "user",
        content: JSON.stringify({
          current_profile: profile,
          conversation: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      },
    ]);

    return {
      extracted: parsed.extracted ?? {},
      ready_for_ranking: Boolean(parsed.ready_for_ranking),
      missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    };
  } catch (error) {
    console.warn("Jarvis profile extract fallback", error);
    const fromConversation = extractAllFromConversation(messages, profile);
    return {
      extracted: fromConversation,
      ready_for_ranking: isProfileReadyForRanking(fromConversation, messages),
      missing: getMissingProfileFields(pruneProfileFromMessages(fromConversation, messages)),
    };
  }
}

const GREETING_ONLY =
  /^(hallo|hey|hi|moin|servus|yo|hello|guten tag|guten morgen|guten abend|was geht|na)[!.?\s]*$/i;

const INVALID_PROFILE_NAMES = new Set([
  "high",
  "found",
  "founder",
  "jarvis",
  "hallo",
  "hey",
  "hi",
  "moin",
  "ok",
  "ja",
  "nein",
  "gut",
  "super",
  "cool",
  "test",
  "user",
  "ich",
  "bin",
  "name",
  "du",
  "mir",
  "dir",
]);

export function isValidProfileName(name) {
  const value = String(name ?? "").trim();
  if (!value || value.length < 2 || value.length > 32) return false;
  if (INVALID_PROFILE_NAMES.has(value.toLowerCase())) return false;
  if (GREETING_ONLY.test(value)) return false;
  if (/\d/.test(value)) return false;
  return true;
}

function sanitizeProfile(profile = {}) {
  if (profile.name && !isValidProfileName(profile.name)) {
    const next = { ...profile };
    delete next.name;
    return next;
  }
  return profile;
}

const FALLBACK_PROMPTS = {
  name: "Wie darf ich dich nennen?",
  age: "Wie alt bist du?",
  education: "Was machst du gerade — Ausbildung, Studium oder Schule?",
  side_income_goal: "Wie viel möchtest du nebenbei verdienen — grob pro Monat?",
  interests: "Welche Nischen oder Themen interessieren dich wirklich — z.B. TikTok, Reselling, E-Commerce?",
  experience: "Was hast du in dem Bereich schon ausprobiert oder gemacht?",
};

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFallbackPrompt(field, name = "") {
  if (!name) return FALLBACK_PROMPTS[field] ?? "";

  const namedPrompts = {
    age: `Wie alt ist ${name}?`,
    education: `Was macht ${name} gerade — Ausbildung, Studium oder Schule?`,
    side_income_goal: `Wie viel soll ${name} nebenbei verdienen — grob pro Monat?`,
    interests: `Welche Nischen oder Themen interessieren ${name} wirklich — z.B. TikTok, Reselling, E-Commerce?`,
    experience: `Was hat ${name} in dem Bereich schon ausprobiert?`,
  };

  return namedPrompts[field] ?? FALLBACK_PROMPTS[field] ?? "";
}

function personalizeReplyAddress(reply = "", name = "") {
  const displayName = String(name ?? "").trim();
  if (!displayName || !String(reply ?? "").trim()) return reply;

  let text = String(reply).trim();
  const nameAtStart = new RegExp(`^${escapeRegExp(displayName)}\\b`, "i");

  const replacements = [
    [/\bzu dem was du sagst\b/gi, `zu dem was ${displayName} sagt`],
    [/\bwas du sagst\b/gi, `was ${displayName} sagt`],
    [/\bfür dich\b/gi, `für ${displayName}`],
    [/\bbei dir\b/gi, `bei ${displayName}`],
    [/\bmit dir\b/gi, `mit ${displayName}`],
    [/\bwenn du bereit bist\b/gi, `wenn ${displayName} bereit ist`],
    [/\btippe unten\b/gi, `tippe unten`],
    [/\bSchau sie dir\b/gi, `Schau sie an, ${displayName}`],
    [/\bdeine drei besten nischen\b/gi, `${displayName}s drei besten Nischen`],
    [/\bstell mir noch eine frage\b/gi, `${displayName} kann noch eine Frage stellen`],
    [/\bWas hast du\b/gi, `Was hat ${displayName}`],
    [/\bwas hast du\b/gi, `was hat ${displayName}`],
    [/\bWie alt bist du\b/gi, `Wie alt ist ${displayName}`],
    [/\bWie viel möchtest du\b/gi, `Wie viel soll ${displayName}`],
    [/\bWelche Nischen oder Themen interessieren dich\b/gi, `Welche Nischen interessieren ${displayName}`],
    [/\bErzähl mir noch etwas von dir\b/gi, `Erzähl ${displayName} noch etwas von sich`],
    [/\bWomit kann ich dir helfen\b/gi, `Womit kann ich ${displayName} helfen`],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  if (!nameAtStart.test(text) && /\b(du|dich|dir|dein|deine|deinen)\b/i.test(text)) {
    const lower = text.charAt(0).toLowerCase() + text.slice(1);
    text = `${displayName}, ${lower}`;
  }

  return text;
}

function extractNameFromText(text = "") {
  const value = String(text).trim();
  if (!value) return null;

  const patterns = [
    /(?:ich bin|ich heiße|ich heisse|mein name ist|name ist)\s+([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})/i,
    /(?:nenn(?:e)?|call)\s+mich\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})/i,
    /(?:mich|mir)\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})\s+nennen/i,
    /(?:darfst|sollst|kannst|will|würdest)\s+(?:du\s+)?mich\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})\s+nennen/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isValidProfileName(candidate)) return candidate;
  }

  return null;
}

function extractNameAnswer(text = "", { expectingField = false } = {}) {
  const fromPhrase = extractNameFromText(text);
  if (fromPhrase) return fromPhrase;

  if (!expectingField) return null;

  const cleaned = String(text).trim().replace(/[.!?]+$/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1 && isValidProfileName(words[0])) return words[0];
  if (words.length <= 3) {
    const last = words[words.length - 1];
    if (isValidProfileName(last)) return last;
  }

  return null;
}

function extractFromUserText(text = "", { expectingField = null, profile = {} } = {}) {
  const value = String(text).trim();
  if (!value || GREETING_ONLY.test(value)) return {};

  const patch = {};

  if (expectingField === "name" || !profile.name) {
    const nameAnswer = extractNameAnswer(value, { expectingField: expectingField === "name" });
    if (nameAnswer) patch.name = nameAnswer;
  }

  if (expectingField === "age" || !profile.age) {
    const ageOnly = value.match(/^(\d{1,2})$/);
    if (ageOnly) patch.age = Number(ageOnly[1]);
    const ageMatch =
      value.match(/\b(\d{1,2})\s*(?:jahre|j\.?)\b/i) ?? value.match(/\bich bin (\d{1,2})\b/i);
    if (ageMatch) patch.age = Number(ageMatch[1]);
  }

  if (expectingField === "education" || !profile.education) {
    if (expectingField === "education" && value.length >= 2) {
      patch.education = value.slice(0, 160);
    } else if (/studier|uni|ausbildung|schule|abitur|bachelor|master|berufsschule|fh\b/i.test(value)) {
      patch.education = value.slice(0, 160);
    }
  }

  if (expectingField === "side_income_goal" || !profile.side_income_goal) {
    const incomeMatch = value.match(/(\d[\d.,\s]*)\s*(?:€|eur|euro)/i);
    if (incomeMatch) {
      patch.side_income_goal = incomeMatch[0].trim();
    } else if (expectingField === "side_income_goal" && /\d/.test(value)) {
      patch.side_income_goal = value.slice(0, 120);
    }
  }

  const detectedInterests = extractInterestsFromText(value);
  if (detectedInterests.length) {
    patch.interests = detectedInterests;
  } else if (expectingField === "interests" || !hasExplicitInterests(profile.interests)) {
    const parsed = parseInterestTopicsFromText(value);
    if (parsed.length) {
      patch.interests = parsed;
    } else if (userMentionsNicheTopics(value)) {
      const parts = value
        .split(/,| und /i)
        .map((part) => part.trim())
        .filter((part) => isExplicitInterest(part));
      if (parts.length) patch.interests = parts.slice(0, 8);
    }
  }

  if (expectingField === "experience" || String(profile.experience ?? "").trim().length < MIN_EXPERIENCE_CHARS) {
    const experience = extractExperienceFromText(value);
    if (experience) patch.experience = experience;
  }

  return patch;
}

function extractAllFromConversation(messages = [], profile = {}) {
  let current = { ...profile };
  const userMessages = messages.filter((message) => message.role === "user");

  for (const message of userMessages) {
    const missing = getMissingProfileFields(current);
    const patch = extractFromUserText(message.text, {
      expectingField: missing[0] ?? null,
      profile: current,
    });
    current = mergeExtractedProfile(current, patch);
  }

  return current;
}

function buildFallbackReply(profile = {}, missing = [], messages = []) {
  const name = profile.name;
  const field = missing[0];
  const ready = isProfileReadyForRanking(profile, messages);

  if (!field) {
    if (!ready) {
      const nextMissing = getMissingProfileFields(pruneProfileFromMessages(profile, messages));
      if (nextMissing.length) return buildFallbackReply(profile, nextMissing, messages);
      return "Erzähl mir noch etwas — ich brauche noch ein paar Infos, bevor ich Nischen empfehlen kann.";
    }
    return name
      ? `Gute Basis, ${name}. Wenn ${name} bereit ist, tippe unten auf „Meine Top-Nischen“.`
      : "Wenn du bereit bist, tippe „Meine Top-Nischen“ für dein personalisiertes Ranking.";
  }

  const prompts = {
    name: FALLBACK_PROMPTS.name,
    age: getFallbackPrompt("age", name),
    education: getFallbackPrompt("education", name),
    side_income_goal: getFallbackPrompt("side_income_goal", name),
    interests: getFallbackPrompt("interests", name),
    experience: getFallbackPrompt("experience", name),
  };

  return prompts[field] ?? (name ? `Erzähl ${name} noch etwas — oder frag nach Founder.` : "Erzähl mir noch etwas von dir — oder frag mich, was Founder alles bietet.");
}

function isKnowledgeQuestion(text = "") {
  const value = String(text ?? "").toLowerCase();
  return (
    /rang(system|e)?|ränge|verifizier|aspiring|starter|builder|scaler|elite/i.test(value) ||
    /steuer|gewerbe|kleinunternehmer|umsatzsteuer|einkommensteuer|finanzamt|ust\b|mwst/i.test(value) ||
    /erklär|erklar|was ist founder|wie funktioniert founder/i.test(value)
  );
}

function buildKnowledgeFallbackReply(userText = "", profile = {}) {
  const text = String(userText ?? "").toLowerCase();
  const name = profile.name ? `${profile.name}, ` : "";

  if (/rang|ränge|verifizier|aspiring|starter|builder|scaler|elite/i.test(text)) {
    return `${name}das Founder-Rangsystem hat 5 Stufen — je höher, desto mehr Zugang:

1. **Aspiring** — nach Registrierung. Community lesen, Events sehen.
2. **Starter** — aktives Gewerbe + Gewerbeanmeldung hochladen. Schreiben in Branchen-Channels, kostenlose Events.
3. **Builder** — 50.000–250.000 € Umsatz/Jahr + Umsatznachweis. Mentoren, bezahlte Events, Mentor werden (max. 50 €/Monat).
4. **Scaler** — 250.000–1 Mio. € + BWA oder Steuerbescheid. Premium Channels, Deal-Board, Mentor max. 150 €/Monat.
5. **Elite** — über 1 Mio. € + Jahresabschluss/BWA. VIP Events, Mastermind, Mentor max. 500 €/Monat.

Verifizierung: **/raenge** oder **/profile** → Nachweise hochladen.`;
  }

  if (/steuer|gewerbe|kleinunternehmer|umsatzsteuer|einkommensteuer|finanzamt|ust\b|mwst/i.test(text)) {
    return `${name}kurz Steuer-Basics für Side-Hustles in DE — **keine Steuerberatung**:

• **Gewerbe anmelden**, sobald du regelmäßig gewerblich Geld verdienst (nicht nur einmal privat verkaufen).
• **Kleinunternehmerregelung** (§19 UStG): bis 22.000 € Vorjahresumsatz — keine Umsatzsteuer ausweisen, gut für den Start.
• **Einkommensteuer** auf deinen Gewinn (Einnahmen minus Kosten).
• Belege und Rechnungen aufbewahren. Founder-Ränge brauchen Umsatznachweise — das ist getrennt vom Finanzamt.

Bei deinem konkreten Fall: Steuerberater oder Lohnsteuerhilfeverein.`;
  }

  if (/was ist founder|wie funktioniert founder/i.test(text)) {
    return `${name}Founder (joinfounder.forum) ist eine deutsche Community für Gründer und Side-Hustler: Nischen-Communities (Trading, TikTok, E-Commerce …), Events, Mentoren, Ressourcen und ein Rangsystem mit Verifizierung. Start unter **/community** — oder frag mich konkret zu einem Thema.`;
  }

  return null;
}

function isCannedInterestPrompt(reply = "") {
  return /welche nischen oder themen interessieren/i.test(reply);
}

function userAskedForNicheSuggestions(text = "") {
  return /nischen?\s*(vorschlagen|empfehlen|passen|zeigen)/i.test(text) || /kannst du mir.*nischen/i.test(text);
}

function buildSmartNicheSuggestionReply(userText = "", profile = {}, messages = []) {
  if (!userMentionsNicheTopics(userText) && !userAskedForNicheSuggestions(userText)) return null;

  const slugs = suggestSlugsFromText(userText);
  if (!slugs.length) return null;

  const lines = [];
  if (/aktienmarkt|aktien|börse|borsen|trading|forex|trade republic/i.test(userText)) {
    lines.push(
      `**${COMMUNITY_DISPLAY_NAMES.trading ?? "Trading"}** — passend zum Aktienmarkt: Strategien, Charts, Erfahrungen mit anderen Tradern auf der Plattform.`
    );
  }
  if (/diamant|schmuck|\buhren?\b|luxus|jewelry|watches?/i.test(userText)) {
    lines.push(
      `**${COMMUNITY_DISPLAY_NAMES.reselling ?? "Reselling"}** — Luxus, Schmuck und Uhren lassen sich oft mit Marge weiterverkaufen (z.B. eBay, Chrono24, Vinted).`
    );
    lines.push(
      `**${COMMUNITY_DISPLAY_NAMES["e-commerce"] ?? "E-Commerce"}** — eigene Marke oder Shop, wenn ${profile.name ? `${profile.name} ein Produkt` : "du ein Produkt"} skalieren willst.`
    );
  }
  if (/produktverkauf|produkt|verkauf|resell|waren|eigenes produkt/i.test(userText)) {
    lines.push(
      `**${COMMUNITY_DISPLAY_NAMES.reselling ?? "Reselling"}** — Produkte einkaufen und mit Marge weiterverkaufen (z.B. eBay, Vinted).`
    );
    lines.push(
      `**${COMMUNITY_DISPLAY_NAMES["e-commerce"] ?? "E-Commerce"}** — eigenen Shop oder Marke, wenn du Produktverkauf skalieren willst.`
    );
  }

  for (const slug of slugs) {
    const name = COMMUNITY_DISPLAY_NAMES[slug];
    if (!name || lines.some((line) => line.includes(name))) continue;
    lines.push(`**${name}** — Community auf Founder mit Gleichgesinnten und konkreten Tipps.`);
  }

  const pruned = pruneProfileFromMessages(profile, messages);
  const missing = getMissingProfileFields(pruned);
  let followUp = "";
  if (missing.includes("experience")) {
    followUp = profile.name
      ? ` Was hat ${profile.name} in dem Bereich schon ausprobiert?`
      : " Was hast du in dem Bereich schon ausprobiert?";
  } else if (missing.includes("side_income_goal")) {
    followUp = profile.name
      ? ` Wie viel soll ${profile.name} nebenbei verdienen — pro Monat?`
      : " Was ist dein Nebenverdienst-Ziel pro Monat?";
  }

  const opener = profile.name ? `Gute Richtung, ${profile.name}` : "Gute Richtung";
  return `${opener} — zu dem was ${profile.name ? `${profile.name} sagt` : "du sagst"}, passen auf Founder besonders:\n\n${lines
    .slice(0, 3)
    .map((line) => `• ${line}`)
    .join("\n")}\n\nSchau unter **Community** in der App — oder ${profile.name ? `${profile.name} kann` : "stell mir"} noch eine Frage stellen.${followUp}`;
}

function buildAssistantDefaultReply(profile = {}) {
  const name = profile.name;
  return name
    ? `Womit kann ich ${name} helfen? Frag nach Rängen, Steuern, Nischen oder der Plattform.`
    : "Womit kann ich dir helfen? Frag mich zu Rängen, Steuern, Nischen oder der Plattform.";
}

function isSubstantiveReply(reply = "") {
  const text = String(reply ?? "").trim();
  if (text.length < 70) return false;
  if (isCannedInterestPrompt(text)) return false;
  if (/^wie (alt|darf ich)/i.test(text) && text.length < 120) return false;
  return true;
}

function finalizeJarvisTurn({
  messages = [],
  profile = {},
  llmReply = "",
  llmReady = false,
  llmExtracted = {},
  mode = "onboarding",
} = {}) {
  const merged = sanitizeProfile(mergeExtractedProfile(profile, llmExtracted));
  let fromConversation = sanitizeProfile(pruneProfileFromMessages(extractAllFromConversation(messages, merged), messages));

  const lastUserText = messages.filter((message) => message.role === "user").at(-1)?.text ?? "";
  const lastInterestAnswer = parseInterestTopicsFromText(lastUserText);
  if (lastInterestAnswer.length && !hasExplicitInterests(fromConversation.interests)) {
    fromConversation = mergeExtractedProfile(fromConversation, { interests: lastInterestAnswer });
  }

  if (!hasExplicitInterests(fromConversation.interests)) {
    for (const message of messages.filter((entry) => entry.role === "user")) {
      const parsed = parseInterestTopicsFromText(message.text);
      if (parsed.length) {
        fromConversation = mergeExtractedProfile(fromConversation, { interests: parsed });
        break;
      }
    }
  }

  let missing = getMissingProfileFields(fromConversation);
  const ready = isProfileReadyForRanking(fromConversation, messages);

  let reply = String(llmReply ?? "").trim();

  const cannedRankingOnly =
    reply.length < 100 &&
    (/^perfekt[,.]?\s/i.test(reply) || /^super[,.]?\s/i.test(reply) || /^gute basis/i.test(reply)) &&
    /top-nischen/i.test(reply);

  const smartNiche = buildSmartNicheSuggestionReply(lastUserText, fromConversation, messages);
  const knowledgeReply = buildKnowledgeFallbackReply(lastUserText, fromConversation);

  if (mode === "assistant") {
    if (!reply && knowledgeReply) reply = knowledgeReply;
    if (!reply && smartNiche) reply = smartNiche;
    if (!reply || (cannedRankingOnly && !isSubstantiveReply(reply))) {
      reply = knowledgeReply ?? smartNiche ?? buildAssistantDefaultReply(fromConversation);
    }
  } else if (isSubstantiveReply(reply) && isKnowledgeQuestion(lastUserText)) {
    // LLM answered a knowledge question — keep it, don't replace with profile prompts
  } else if (smartNiche && (!reply || cannedRankingOnly || isCannedInterestPrompt(reply))) {
    reply = smartNiche;
  } else if (!reply || cannedRankingOnly) {
    if (!reply && knowledgeReply) reply = knowledgeReply;
    else if (!isSubstantiveReply(reply)) reply = buildFallbackReply(fromConversation, missing, messages);
  }

  if (mode === "onboarding" && /top-nischen/i.test(reply) && !ready) {
    reply = smartNiche ?? buildFallbackReply(fromConversation, missing, messages);
  }

  if (/wie darf ich dich nennen/i.test(reply) && fromConversation.name) {
    const nextMissing = getMissingProfileFields(fromConversation);
    reply = nextMissing.length
      ? buildFallbackReply(fromConversation, nextMissing, messages)
      : `Alles klar, ${fromConversation.name} — womit kann ich ${fromConversation.name} helfen?`;
  }

  if (isCannedInterestPrompt(reply) && hasExplicitInterests(fromConversation.interests)) {
    missing = getMissingProfileFields(fromConversation);
    reply = buildFallbackReply(fromConversation, missing, messages);
  }

  if (fromConversation.name) {
    reply = personalizeReplyAddress(reply, fromConversation.name);
  }

  return {
    reply,
    profile: fromConversation,
    readyForRanking: ready,
    missing,
    autoRank: ready && mode === "onboarding",
  };
}

function chatWithJarvisFallback({ messages = [], profile = {}, mode = "onboarding" } = {}) {
  const fromConversation = pruneProfileFromMessages(extractAllFromConversation(messages, profile), messages);
  const missing = getMissingProfileFields(fromConversation);
  const lastUserText = messages.filter((message) => message.role === "user").at(-1)?.text ?? "";
  const llmReply =
    buildKnowledgeFallbackReply(lastUserText, fromConversation) ??
    (mode === "assistant"
      ? buildAssistantDefaultReply(fromConversation)
      : buildFallbackReply(fromConversation, missing, messages));

  return finalizeJarvisTurn({
    messages,
    profile: fromConversation,
    llmReply,
    llmReady: false,
    mode,
  });
}

export async function chatWithJarvis({ messages = [], profile = {}, mode = "onboarding" } = {}) {
  if (!isOpenAiVoiceConfigured()) {
    return chatWithJarvisFallback({ messages, profile, mode });
  }

  const openAiMessages = messages.map((m) => ({
    role: m.role === "founder" ? "assistant" : "user",
    content: m.text,
  }));

  const missing = getMissingProfileFields(profile);
  const profileContext = buildProfileContext(profile, missing);

  try {
    const parsed = await callOpenAIJson(
      `${buildJarvisChatJson(mode)}\n\n${profileContext}`,
      openAiMessages,
      { model: FOUNDER_CHAT_MODEL, temperature: 0.75, max_tokens: 720 }
    );

    const llmProfile = sanitizeProfile(mergeExtractedProfile(profile, parsed.extracted ?? {}));

    return finalizeJarvisTurn({
      messages,
      profile: llmProfile,
      llmReply: parsed.reply,
      llmReady: Boolean(parsed.ready_for_ranking),
      llmExtracted: parsed.extracted ?? {},
      mode,
    });
  } catch (error) {
    console.warn("Jarvis chat fallback", error);
    return chatWithJarvisFallback({ messages, profile, mode });
  }
}

function parseIncomeGoal(goal = "") {
  const text = String(goal).replace(/\./g, "").replace(/,/g, "");
  const match = text.match(/(\d{3,6})/);
  return match ? Number(match[1]) : 0;
}

function rankWithProfileHeuristics(profile, groups = []) {
  const answers = profileToAnswers(profile);
  const age = Number(profile.age) || 0;
  const income = parseIncomeGoal(profile.side_income_goal);
  const interestText = (profile.interests ?? []).join(" ").toLowerCase();
  const experienceText = String(profile.experience ?? "").toLowerCase();
  const signal = `${interestText} ${experienceText}`
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const ageSlugs =
    age > 0 && age < 22
      ? ["tiktok-creator", "tiktok-shop", "ki-creator", "reselling", "memecoin-trading"]
      : age < 28
        ? ["dropshipping", "reselling", "web-design", "youtube-automation", "e-commerce"]
        : ["e-commerce", "real-estate", "trading", "traditional-services"];

  const incomeSlugs =
    income >= 3000
      ? ["e-commerce", "real-estate", "trading"]
      : income >= 1500
        ? ["dropshipping", "e-commerce", "web-design"]
        : ["reselling", "tiktok-creator", "ki-creator"];

  const keywordRanked = rankCommunitiesFromAnswers(answers, groups).map((group) => {
    let boost = group.matchScore ?? 0;
    const slug = group.slug ?? "";
    const ageIdx = ageSlugs.indexOf(slug);
    const incomeIdx = incomeSlugs.indexOf(slug);
    if (ageIdx >= 0) boost += (3 - ageIdx) * 3;
    if (incomeIdx >= 0) boost += (3 - incomeIdx) * 2;
    if (signal && scoreCommunityMatch(slug, signal) > 0) boost += 12;
    return { ...group, matchScore: boost };
  });

  return keywordRanked.sort(
    (a, b) => b.matchScore - a.matchScore || (b.member_count ?? 0) - (a.member_count ?? 0)
  );
}

export async function rankNichesForProfile(profile, groups = []) {
  if (!isProfileReadyForRanking(profile, [])) {
    throw new Error("Profil unvollständig — erst Interessen und Erfahrung erfragen.");
  }

  const answers = profileToAnswers(profile);

  let rankedSlugs = [];
  let reasons = {};

  try {
    const parsed = await callOpenAIJson(
      RANK_SYSTEM,
      [
        {
          role: "user",
          content: JSON.stringify({
            name: profile.name,
            age: profile.age,
            education: profile.education,
            side_income_goal: profile.side_income_goal,
            interests: profile.interests,
            experience: profile.experience,
          }),
        },
      ],
      { model: FOUNDER_CHAT_MODEL, temperature: 0.45 }
    );
    rankedSlugs = (parsed.ranked_slugs ?? []).filter((s) => NICHE_SLUGS.includes(s)).slice(0, 3);
    reasons = parsed.reasons ?? {};
  } catch (error) {
    console.warn("LLM rank fallback", error);
  }

  const keywordRanked = rankWithProfileHeuristics(profile, groups);
  const slugOrder = rankedSlugs.length >= 3 ? rankedSlugs : keywordRanked.map((g) => g.slug);

  const bySlug = new Map(groups.map((g) => [g.slug, g]));
  const top = [];
  const seen = new Set();

  for (const slug of slugOrder) {
    if (!slug || seen.has(slug)) continue;
    const group = bySlug.get(slug);
    if (!group) continue;
    seen.add(slug);
    top.push({
      ...group,
      matchReason: reasons[slug] ?? keywordRanked.find((r) => r.slug === slug)?.coachTip ?? "",
      coachTip: COMMUNITY_COACH_TIPS[slug] ?? "Tritt bei und stell dich kurz vor.",
    });
    if (top.length >= 3) break;
  }

  for (const row of keywordRanked) {
    if (top.length >= 3) break;
    if (!seen.has(row.slug)) {
      seen.add(row.slug);
      top.push(row);
    }
  }

  const profilePatch = buildProfilePatchFromAnswers(answers, top);

  return {
    rankedGroups: top.map((group, index) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      category: group.category,
      description: group.description,
      member_count: group.member_count,
      rank: index + 1,
      matchReason: group.matchReason ?? group.coachTip,
      coachTip: group.coachTip,
    })),
    profilePatch,
  };
}

export function getJarvisOpeningMessage() {
  return JARVIS_OPENING;
}

/** Spoken summary after niche ranking — top 3 names for TTS. */
export function buildRankingSpeech(rankedGroups = [], name = "") {
  const items = rankedGroups.slice(0, 3);
  if (!items.length) {
    return "Ich konnte leider keine passenden Nischen finden — erzähl mir noch etwas von dir.";
  }

  const greet = name ? `${name}, ` : "";
  const labels = ["Platz eins", "Platz zwei", "Platz drei"];
  const named = items.map((group, index) => `${labels[index]}: ${group.name}`).join(". ");

  return name
    ? `${greet}hier ${name}s drei besten Nischen: ${named}. Schau sie auf der Treppe an und tritt bei, was am besten passt.`
    : `${greet}deine drei besten Nischen sind: ${named}. Schau sie dir auf der Treppe an und tritt bei, was sich am besten anfühlt.`;
}
