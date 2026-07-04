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

• Wenn der Nutzer Nischen vorschlagen will („kannst du Nischen vorschlagen“): dann passende Founder-Communities nennen — aber NUR wenn er explizit danach fragt ODER das Profil komplett ist.
• JEDES Thema, Hobby oder Business-Idee des Nutzers ist ein gültiges Interesse (Schmuck, Fitness, Autos, Immobilien, Trading …) — merken, später einordnen. Während des Profil-Sammelns KEINE Community-Listen vorschlagen.

PROFIL & NISCHEN-MATCHING (nebenbei, nicht dominierend):
• Merke dir freiwillig geteilte Infos: Name, Alter, Ausbildung, Nebenverdienst-Ziel, Interessen, Erfahrung.
• Stelle Profilfragen der Reihe nach: Name → Alter → Ausbildung → Einkommensziel → Interessen → Erfahrung. Eine Frage pro Antwort.
• Nach Einkommensziel: kurz bestätigen und nach Interessen fragen — NICHT schon Communities/Nischen vorschlagen.
• Nach Interessen: kurz bestätigen (Themen wiederholen) und nach Erfahrung fragen — NICHT schon Communities listen.
• Community-Empfehlungen und Nischen-Ranking erst wenn ALLE 6 Felder da sind — dann „Meine Top-Nischen“ erwähnen.

• Wenn der Nutzer sagt, wie er genannt werden will („nenn mich Boss“, „du darfst mich X nennen“): Namen sofort übernehmen, kurz bestätigen — NIEMALS nochmal „Wie darf ich dich nennen?“.

ANREDE (wichtig):
• Der Nutzer spricht in der Regel über SICH SELBST — dann duzen mit Namen: „Thunder, wie alt bist du?“ — NICHT „Wie alt ist Thunder?“
• Nur wenn der Nutzer ausdrücklich über eine ANDERE Person spricht (sie/er, „für sie“, „meine Freundin“ …): 3. Person mit deren Namen.
• „Hi“ / „Hallo“ allein ist eine Begrüßung, kein Name — dann freundlich zurückgrüßen und nach dem Namen fragen.

VERBOTEN (wenn Name bekannt):
• Unpersönliche Du-Floskeln wie „zu dem was du sagst“, „für dich“, „bei dir“ ohne den Namen zu nutzen.
• Leere Floskeln („Super!“, „Perfekt!“, „Toll!“) ohne Inhalt.
• Nur „schau in der Community“ ohne zu erklären was er dort konkret tun soll.
• Roboterhafte Schablonen oder immer dieselbe Satzstruktur.
• „Klick auf Meine Top-Nischen“ — das passiert automatisch.

Sprache: Deutsch. Antworte natürlich und direkt.`;

const JARVIS_ONBOARDING_MODE = `
ONBOARDING-MODUS (erstes Gespräch mit Founder):
• Sammle das Profil Schritt für Schritt — beantworte echte Fragen (Ränge, Steuern …) trotzdem zuerst vollständig.
• Pflichtfelder: name, age, education, side_income_goal, interests, experience.
• Nach side_income_goal: bestätigen + Interessen fragen. Keine Nischen/Communities vorschlagen.
• Nach interests: Themen kurz bestätigen + Erfahrung fragen. Keine Community-Liste.
• Nischen-Empfehlungen erst wenn alle Felder vollständig sind.`;

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
      : "Zusätzlich extrahiere Profildaten. interests: JEDES Thema/Hobby/Business-Idee das der Nutzer nennt — auch ungewöhnliche (Schmuck, Fitness, Autos …). ready_for_ranking IMMER false außer alle 6 Felder explizit genannt.";

  return `${buildJarvisChatSystem(mode)}\n\n${extractHint}\n\n${JARVIS_CHAT_JSON_BASE}`;
}

const EXTRACT_SYSTEM = `Du analysierst ein Onboarding-Gespräch auf joinfounder.forum und extrahierst Profildaten.

Pflichtfelder für Nischen-Ranking: name, age, education, side_income_goal, interests (mindestens ein explizit genanntes Thema/Nische), experience (mindestens ein kurzer Satz).

Regeln:
• Nur Werte setzen die der Nutzer klar genannt hat — nicht raten, nicht aus Studium/Ausbildung ableiten.
• interests: jedes Thema, Hobby, Branche oder Business-Idee das der Nutzer selbst nennt — auch ungewöhnliche (Diamanten, Fitness, Autos, Coaching …). Studienfach ≠ Interesse. Mehrere Topics als Array.
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
      .filter((i) => i && isUserStatedInterest(i));
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
  { pattern: /\bki\b|künstliche intelligenz|chatgpt/i, label: "KI", slugs: ["ki-creator"] },
  { pattern: /youtube/i, label: "YouTube", slugs: ["youtube-automation"] },
  { pattern: /web\s*design|website/i, label: "Web Design", slugs: ["web-design"] },
  { pattern: /fußball|fussball/i, label: "Fußball", slugs: [] },
  { pattern: /fitness|krafttraining|gym\b/i, label: "Fitness", slugs: [] },
];

function extractNormalizedInterestsFromText(text = "") {
  const value = String(text ?? "");
  if (!value.trim()) return [];

  const labels = [];
  for (const alias of INTEREST_TOPIC_ALIASES) {
    if (alias.pattern.test(value)) labels.push(alias.label);
  }
  return [...new Set(labels)];
}

function formatInterestsForReply(interests = []) {
  const normalized = [];
  for (const item of interests) {
    normalized.push(...extractNormalizedInterestsFromText(item));
    const clean = String(item ?? "").trim();
    if (clean.length > 36 || /^(also|ich|mich|genau)\b/i.test(clean)) continue;
    if (isUserStatedInterest(clean)) normalized.push(clean);
  }
  return [...new Set(normalized)].slice(0, 4);
}

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

function parseInterestTopicsFromText(text = "", { expectingField = null } = {}) {
  const value = String(text ?? "").trim();
  if (!value || GREETING_ONLY.test(value) || isIncomeAnswer(value)) return [];

  const fromAliases = extractInterestsFromText(value);
  if (fromAliases.length) return fromAliases;

  const looksLikeInterestAnswer =
    expectingField === "interests" ||
    /interessiert|nischen|themen|mag |liebt |gerne|hobby|passiert|z\.?\s*b\.?/i.test(value) ||
    userMentionsNicheTopics(value);

  if (!looksLikeInterestAnswer) return [];

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

function isUserStatedInterest(value) {
  const text = String(value ?? "").trim();
  if (!text || text.length < 3 || GENERIC_INTEREST_PHRASES.test(text)) return false;
  if (/^(und|oder|also|das|die|der|ich|mir|dir|für)$/i.test(text)) return false;
  if (isIncomeAnswer(text)) return false;
  return true;
}

function isExplicitInterest(value) {
  return isUserStatedInterest(value);
}

function isIncomeAnswer(text = "") {
  const value = String(text ?? "").trim();
  if (!value) return false;
  if (hasValidIncomeGoal(value)) return true;
  return (
    /\d/.test(value) &&
    /\b(pro monat|monatlich|monat|nebenbei|verdienen|verdienst|€|euro|eur)\b/i.test(value) &&
    !/interessiert|nischen|themen|trading|tiktok|resell/i.test(value)
  );
}

function hasExplicitInterests(interests = []) {
  return Array.isArray(interests) && interests.some((item) => isUserStatedInterest(item));
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

function collectInterestsFromMessages(messages = []) {
  const collected = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") continue;

    const priorFounder = [...messages.slice(0, index)]
      .reverse()
      .find((entry) => entry.role === "founder");
    const askedInterests = priorFounder && /nischen|themen interessieren|interessiert/i.test(priorFounder.text);
    const relevant =
      askedInterests ||
      userMentionsNicheTopics(message.text) ||
      /spiele|hobby|beschäftige|interessier/i.test(message.text);

    if (!relevant) continue;

    const normalized = extractNormalizedInterestsFromText(message.text);
    if (normalized.length) {
      collected.push(...normalized);
      continue;
    }

    if (askedInterests) {
      collected.push(...parseInterestTopicsFromText(message.text, { expectingField: "interests" }));
    }
  }

  return [...new Set(collected.filter(isUserStatedInterest))].slice(0, 8);
}

function collectExperienceFromMessages(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;

    const priorFounder = [...messages.slice(0, index)]
      .reverse()
      .find((entry) => entry.role === "founder");
    const askedExperience =
      priorFounder &&
      /ausprobiert|erfahrung|schon gemacht|in dem bereich|bereich schon/i.test(priorFounder.text);
    if (!askedExperience) continue;

    const experience = extractExperienceFromText(message.text);
    if (experience) return experience;
  }

  return null;
}

/** Drop profile fields that are not clearly supported by what the user actually said. */
function pruneProfileFromMessages(profile = {}, messages = []) {
  const userText = userTextFromMessages(messages);
  const next = { ...profile };

  if (next.name && (isAssistantAlias(next.name) || isGreetingToAssistant(userText.split("\n")[0] ?? ""))) {
    delete next.name;
  }

  const nameFromUser = collectNameFromMessages(messages);
  if (nameFromUser) {
    next.name = nameFromUser;
  } else if (next.name) {
    delete next.name;
  }

  if (next.age != null && !/\b(1[3-9]|[2-9]\d)\s*(?:jahre|j\.?)?\b/i.test(userText) && !/\bich bin (1[3-9]|[2-9]\d)\b/i.test(userText)) {
    delete next.age;
  }

  if (next.side_income_goal && !hasValidIncomeGoal(userText) && !hasValidIncomeGoal(next.side_income_goal)) {
    delete next.side_income_goal;
  }

  const interestsFromUser = collectInterestsFromMessages(messages);
  if (interestsFromUser.length) {
    next.interests = interestsFromUser;
  } else if (!hasExplicitInterests(next.interests)) {
    delete next.interests;
  }

  const experienceFromUser = collectExperienceFromMessages(messages);
  if (experienceFromUser && experienceFromUser.length >= MIN_EXPERIENCE_CHARS) {
    next.experience = experienceFromUser;
  } else if (String(next.experience ?? "").trim().length < MIN_EXPERIENCE_CHARS) {
    delete next.experience;
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
  const pruned = messages.length ? pruneProfileFromMessages(profile, messages) : sanitizeProfile(profile);
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

function buildProfileContext(profile = {}, missing = [], messages = []) {
  const known = Object.entries(profile)
    .filter(([, value]) => value != null && value !== "" && !(Array.isArray(value) && !value.length))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("; ");

  const aboutSelf = messages.length ? userOnboardingIsAboutSelf(messages) : true;
  const addressRule = profile.name
    ? aboutSelf
      ? `ANREDE: Nutzer heißt „${profile.name}“ und spricht über sich selbst. Duzen mit Namen: „${profile.name}, wie alt bist du?“ — NICHT „Wie alt ist ${profile.name}?“.`
      : `ANREDE: Nutzer spricht über „${profile.name}“ in der 3. Person — Fragen in 3. Person stellen.`
    : "ANREDE: Name noch unbekannt — Begrüßungen freundlich beantworten und nach dem Namen fragen.";

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

const GREETING_PREFIX = /^(?:hallo|hey|hi|moin|servus|yo|hello|guten tag|guten morgen|guten abend|na)\b/i;

const GREETING_ONLY =
  /^(hallo|hey|hi|moin|servus|yo|hello|guten tag|guten morgen|guten abend|was geht|na)[!.?\s]*$/i;

/** STT often mishears „Founder“ / „Jarvis“ — treat as greeting, not a name. */
const GREETING_ASSISTANT_NOISE =
  /^(?:hallo|hey|hi|moin|servus|yo|hello)(?:\s+(?:founder|jarvis|founder\s*ai|found|frauen|frau|founda|founders?))(?:\s+\w+)?[!.?\s]*$/i;

const INVALID_PROFILE_NAMES = new Set([
  "high",
  "found",
  "founder",
  "jarvis",
  "founderai",
  "founder ai",
  "frauen",
  "frau",
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
  "da",
  "dort",
  "hier",
  "mal",
  "eben",
  "also",
  "noch",
  "na",
  "ey",
  "äh",
  "aeh",
  "hm",
  "hmm",
]);

const ASSISTANT_NAME_PATTERN = /^(founder|jarvis|founder\s*ai)$/i;

function isAssistantAlias(name = "") {
  return ASSISTANT_NAME_PATTERN.test(String(name ?? "").trim());
}

function isGreetingToAssistant(text = "") {
  const value = String(text ?? "").trim();
  if (!value) return false;
  if (GREETING_ASSISTANT_NOISE.test(value)) return true;
  return /^(hallo|hey|hi|moin|servus|yo|hello)(\s+(founder|jarvis|founder\s*ai))(?:[!.?\s,]|$)/i.test(value);
}

function startsWithCasualGreeting(text = "") {
  return GREETING_PREFIX.test(String(text ?? "").trim());
}

const NON_NAME_ICH_BIN_PATTERN =
  /\d|jahre|jahr|alt\b|semester|studier|student|ausbildung|schüler|schueler|beruf|lehre|praktikum|job|arbeit/i;

const NON_NAME_ICH_BIN_WORDS = new Set([
  "bwl",
  "vwl",
  "jura",
  "medizin",
  "informatik",
  "wirtschaft",
  "recht",
  "psychologie",
  "marketing",
  "design",
  "ingenieur",
  "lehrer",
  "arzt",
  "student",
  "studentin",
  "schüler",
  "schueler",
  "azubi",
  "selbstständig",
  "selbststaendig",
  "angestellt",
  "arbeitlos",
  "rentner",
  "gründer",
  "gruender",
]);

function isIchBinSelfDescription(text = "") {
  const value = String(text ?? "").trim();
  const match = value.match(/^ich bin\s+(.+)/i);
  if (!match) return false;
  const rest = match[1];
  if (NON_NAME_ICH_BIN_PATTERN.test(rest)) return true;
  const firstWord = rest.split(/\s+/)[0]?.toLowerCase();
  return NON_NAME_ICH_BIN_WORDS.has(firstWord);
}

function extractIchBinName(text = "") {
  const value = String(text ?? "").trim();
  if (isIchBinSelfDescription(value)) return null;
  const match = value.match(/^ich bin\s+([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß'-]{1,})/i);
  const candidate = match?.[1]?.trim();
  if (candidate && isValidProfileName(candidate)) return candidate;
  return null;
}

function isExplicitNameIntentPhrase(text = "") {
  const value = String(text ?? "").trim();
  if (!value) return false;
  if (/nenn(?:e)?\s+mich|darfst\s+mich|sollst\s+mich|heiße|heisse|mein name ist/i.test(value)) {
    return Boolean(extractNameFromText(value));
  }
  if (/^ich bin\s+/i.test(value)) return Boolean(extractIchBinName(value));
  return Boolean(extractNameFromText(value));
}

function hasExplicitNamePhrase(text = "") {
  return isExplicitNameIntentPhrase(text);
}

const NAME_STOPWORDS = new Set([
  "nennen",
  "nenne",
  "finden",
  "finde",
  "heißen",
  "heiße",
  "heisse",
  "sagen",
  "darfst",
  "darf",
  "sollst",
  "soll",
  "sollen",
  "musst",
  "müsst",
  "dürfte",
  "bitte",
  "gerne",
  "einfach",
  "eigentlich",
]);

export function isValidProfileName(name) {
  const value = String(name ?? "").trim();
  if (!value || value.length < 2 || value.length > 32) return false;
  if (INVALID_PROFILE_NAMES.has(value.toLowerCase())) return false;
  if (NAME_STOPWORDS.has(value.toLowerCase())) return false;
  if (GREETING_ONLY.test(value)) return false;
  if (/\d/.test(value)) return false;
  return true;
}

function sanitizeProfile(profile = {}) {
  if (profile.name && (!isValidProfileName(profile.name) || isAssistantAlias(profile.name))) {
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

function userOnboardingIsAboutSelf(messages = []) {
  const userText = userTextFromMessages(messages);
  if (/\b(sie|er|ihn|ihr)\s+(interessiert|macht|ist|hat|will|kann)\b/i.test(userText)) return false;
  if (/\b(für|bei)\s+(sie|ihn|die|den|der)\b/i.test(userText)) return false;
  if (/\bmeine (freundin|schwester|tochter|mutter)\b/i.test(userText)) return false;
  return true;
}

function isCasualGreeting(text = "") {
  const value = String(text ?? "").trim();
  if (!value || GREETING_ONLY.test(value)) return true;
  if (isGreetingToAssistant(value)) return true;
  if (startsWithCasualGreeting(value) && !hasExplicitNamePhrase(value)) return true;
  return false;
}

function getFallbackPrompt(field, name = "", { aboutSelf = true } = {}) {
  if (!name) return FALLBACK_PROMPTS[field] ?? "";

  if (aboutSelf) {
    const selfPrompts = {
      age: `${name}, wie alt bist du?`,
      education: `${name}, was machst du gerade — Ausbildung, Studium oder Schule?`,
      side_income_goal: `${name}, wie viel möchtest du nebenbei verdienen — grob pro Monat?`,
      interests: `${name}, welche Nischen oder Themen interessieren dich wirklich — z.B. TikTok, Reselling, E-Commerce?`,
      experience: `${name}, was hast du in dem Bereich schon ausprobiert?`,
    };
    return selfPrompts[field] ?? FALLBACK_PROMPTS[field] ?? "";
  }

  const namedPrompts = {
    age: `Wie alt ist ${name}?`,
    education: `Was macht ${name} gerade — Ausbildung, Studium oder Schule?`,
    side_income_goal: `Wie viel soll ${name} nebenbei verdienen — grob pro Monat?`,
    interests: `Welche Nischen oder Themen interessieren ${name} wirklich — z.B. TikTok, Reselling, E-Commerce?`,
    experience: `Was hat ${name} in dem Bereich schon ausprobiert?`,
  };

  return namedPrompts[field] ?? FALLBACK_PROMPTS[field] ?? "";
}

function personalizeReplyAddress(reply = "", name = "", { aboutSelf = true } = {}) {
  const displayName = String(name ?? "").trim();
  if (!displayName || !String(reply ?? "").trim()) return reply;

  let text = String(reply).trim();
  const nameAtStart = new RegExp(`^${escapeRegExp(displayName)}\\b`, "i");
  const nameEarly = new RegExp(`\\b${escapeRegExp(displayName)}\\b`, "i");

  if (nameAtStart.test(text) || nameEarly.test(text.slice(0, 120))) return text;

  if (aboutSelf) {
    if (/\b(du|dich|dir|dein|deine|deinen|bist du|hast du)\b/i.test(text)) {
      text = `${displayName}, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
    }
    return text;
  }

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

function getExpectingFieldBeforeMessage(messages = [], messageIndex = 0) {
  const priorFounder = [...messages.slice(0, messageIndex)]
    .reverse()
    .find((message) => message.role === "founder");
  if (!priorFounder?.text) return null;
  return getExpectingFieldFromMessages([...messages.slice(0, messageIndex), priorFounder]);
}

function extractNameFromText(text = "") {
  const value = String(text).trim();
  if (!value) return null;

  const patterns = [
    /(?:nenn(?:e)?|call)\s+mich\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})/i,
    /(?:mich|mir)\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})\s+nennen/i,
    /(?:du\s+)?(?:darfst|darf|sollst|soll|sollen|sollt|kannst|könnt|will|würdest|dürft|musst|müsst)\s+(?:du\s+)?mich\s+(?:gerne\s+|bitte\s+)?([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})(?:\s+nennen)?/i,
    /(?:du\s+)?darfst\s+mich\s+([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})(?:\s+nennen)?/i,
    /(?:ich heiße|ich heisse|mein name ist|name ist)\s+([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})/i,
    /^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})\s+nennen$/i,
    /^([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]{1,})\s+heißt\s+mich$/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isValidProfileName(candidate)) return candidate;
  }

  const ichBinName = extractIchBinName(value);
  if (ichBinName) return ichBinName;

  return null;
}

function extractNameAnswer(text = "", { expectingField = false } = {}) {
  const value = String(text).trim();
  if (isCasualGreeting(value) && !expectingField) return null;

  const fromPhrase = extractNameFromText(value);
  if (fromPhrase) return fromPhrase;

  if (!expectingField) return null;

  if (startsWithCasualGreeting(value) && !hasExplicitNamePhrase(value)) return null;

  const cleaned = value.replace(/[.!?]+$/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (/nennen?$/i.test(words[words.length - 1] ?? "")) {
    const nameCandidates = words.filter(
      (word) =>
        isValidProfileName(word) &&
        !NAME_STOPWORDS.has(word.toLowerCase()) &&
        !/^(du|dich|mir|mich)$/i.test(word)
    );
    if (nameCandidates.length) return nameCandidates[nameCandidates.length - 1];
  }

  if (words.length === 2 && /^nennen?$/i.test(words[1]) && isValidProfileName(words[0])) return words[0];
  if (words.length === 1 && isValidProfileName(words[0])) return words[0];
  if (words.length <= 6) {
    const withoutFillers = words.filter((word) => !NAME_STOPWORDS.has(word.toLowerCase()) && !/^(du|mich|mir)$/i.test(word));
    if (withoutFillers.length === 1 && isValidProfileName(withoutFillers[0])) return withoutFillers[0];
    const last = withoutFillers[withoutFillers.length - 1];
    if (last && isValidProfileName(last)) return last;
  }

  return null;
}

function collectNameFromMessages(messages = []) {
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const expectingField = getExpectingFieldBeforeMessage(messages, index);
    const name = extractNameAnswer(message.text, { expectingField: expectingField === "name" });
    if (name) return name;
  }

  for (const message of messages.filter((entry) => entry.role === "user")) {
    if (!isExplicitNameIntentPhrase(message.text)) continue;
    const name = extractNameFromText(message.text);
    if (name) return name;
  }

  return null;
}

function buildNameAckReply(profile = {}, { aboutSelf = true } = {}) {
  const name = profile.name;
  if (!name) return FALLBACK_PROMPTS.name;
  return aboutSelf
    ? `${name}, schön dich kennenzulernen. Wie alt bist du?`
    : `${name} — alles klar. Wie alt ist ${name}?`;
}

function buildAgeAckReply(profile = {}, { aboutSelf = true } = {}) {
  return getFallbackPrompt("education", profile.name, { aboutSelf });
}

function buildEducationAckReply(profile = {}, { aboutSelf = true } = {}) {
  return getFallbackPrompt("side_income_goal", profile.name, { aboutSelf });
}

function extractFromUserText(text = "", { expectingField = null, profile = {} } = {}) {
  const value = String(text).trim();
  if (!value || GREETING_ONLY.test(value)) return {};

  const patch = {};

  if (
    (expectingField === "name" || !profile.name) &&
    !isCasualGreeting(value) &&
    expectingField !== "age" &&
    expectingField !== "education"
  ) {
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
    } else if (
      /studier|uni|ausbildung|schule|abitur|bachelor|berufsschule|fh\b/i.test(value) ||
      (/\bmaster\b/i.test(value) && /studium|studiere|abschluss|promotion|informatik|wirtschaft/i.test(value))
    ) {
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
  const shouldExtractInterests =
    !isIncomeAnswer(value) &&
    (expectingField === "interests" ||
      userMentionsNicheTopics(value) ||
      /interessiert|nischen|themen|mag |liebt |gerne|hobby/i.test(value));

  if (shouldExtractInterests) {
    if (detectedInterests.length) {
      patch.interests = detectedInterests;
    } else {
      const parsed = parseInterestTopicsFromText(value, { expectingField });
      if (parsed.length) {
        patch.interests = parsed;
      } else if (expectingField === "interests" && value.length >= 4) {
        const parts = value
          .split(/,|\bund\b|\boder\b/i)
          .map((part) => part.trim())
          .filter((part) => isUserStatedInterest(part));
        if (parts.length) patch.interests = parts.slice(0, 8);
        else if (isUserStatedInterest(value)) patch.interests = [value.slice(0, 80)];
      } else if (userMentionsNicheTopics(value)) {
        const parts = value
          .split(/,| und /i)
          .map((part) => part.trim())
          .filter((part) => isUserStatedInterest(part));
        if (parts.length) patch.interests = parts.slice(0, 8);
      }
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

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.role !== "user") continue;

    const missing = getMissingProfileFields(current);
    const contextExpecting = getExpectingFieldBeforeMessage(messages, index);
    const expectingField = contextExpecting || missing[0] || null;
    const patch = extractFromUserText(message.text, {
      expectingField,
      profile: current,
    });
    current = mergeExtractedProfile(current, patch);
  }

  const collectedName = collectNameFromMessages(messages);
  if (collectedName) current = mergeExtractedProfile(current, { name: collectedName });

  return current;
}

function buildFallbackReply(profile = {}, missing = [], messages = []) {
  const name = profile.name;
  const field = missing[0];
  const aboutSelf = userOnboardingIsAboutSelf(messages);
  const ready = isProfileReadyForRanking(profile, messages);
  const lastUserText = messages.filter((message) => message.role === "user").at(-1)?.text ?? "";

  if (!field) {
    if (!ready) {
      const nextMissing = getMissingProfileFields(pruneProfileFromMessages(profile, messages));
      if (nextMissing.length) return buildFallbackReply(profile, nextMissing, messages);
      return "Erzähl mir noch etwas — ich brauche noch ein paar Infos, bevor ich Nischen empfehlen kann.";
    }
    return name
      ? aboutSelf
        ? `Gute Basis, ${name}. Ich bereite jetzt dein persönliches Nischen-Ranking vor…`
        : `Gute Basis. Ich bereite jetzt ${name}s Nischen-Ranking vor…`
      : "Ich bereite jetzt dein persönliches Nischen-Ranking vor…";
  }

  if (field === "name" && isCasualGreeting(lastUserText)) {
    return "Hey! Schön, dass du da bist. Wie darf ich dich nennen?";
  }

  const prompts = {
    name: FALLBACK_PROMPTS.name,
    age: getFallbackPrompt("age", name, { aboutSelf }),
    education: getFallbackPrompt("education", name, { aboutSelf }),
    side_income_goal: getFallbackPrompt("side_income_goal", name, { aboutSelf }),
    interests: getFallbackPrompt("interests", name, { aboutSelf }),
    experience: getFallbackPrompt("experience", name, { aboutSelf }),
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

function getExpectingFieldFromMessages(messages = []) {
  const lastFounder = messages.filter((message) => message.role === "founder").at(-1)?.text ?? "";
  if (/wie darf ich dich nennen|spitzname/i.test(lastFounder)) return "name";
  if (/wie alt/i.test(lastFounder)) return "age";
  if (/ausbildung|studium|schule|was machst du gerade/i.test(lastFounder)) return "education";
  if (/verdienen|nebenbei|pro monat|einkommensziel/i.test(lastFounder)) return "side_income_goal";
  if (/nischen|themen interessieren|interessiert/i.test(lastFounder)) return "interests";
  if (/ausprobiert|erfahrung|schon gemacht/i.test(lastFounder)) return "experience";
  return null;
}

function isPrematureNicheSuggestion(reply = "") {
  return (
    /passen auf founder|community auf founder|gute richtung.*passen|schau unter \*\*community\*\*/i.test(reply) ||
    (/^\*\*/.test(reply) && /community|reselling|trading|e-?commerce/i.test(reply))
  );
}

function buildIncomeAckReply(profile = {}, { aboutSelf = true } = {}) {
  const name = profile.name;
  const goal = profile.side_income_goal ?? "dein Ziel";
  if (aboutSelf) {
    return name
      ? `Alles klar, ${name} — ${goal} als Ziel. Welche Nischen oder Themen interessieren dich wirklich?`
      : `Alles klar — ${goal}. Welche Nischen oder Themen interessieren dich wirklich?`;
  }
  return name
    ? `Alles klar — ${goal} als Nebenverdienst-Ziel für ${name}. Welche Nischen oder Themen interessieren ${name} wirklich?`
    : `Alles klar — ${goal}. Welche Nischen oder Themen interessieren dich wirklich?`;
}

function buildInterestAckReply(profile = {}, interests = [], { aboutSelf = true } = {}) {
  const name = profile.name;
  const topics = formatInterestsForReply(interests).join(", ") || "deine Themen";
  if (aboutSelf) {
    return name
      ? `${name}, verstanden — ${topics} klingt spannend. Was hast du in dem Bereich schon ausprobiert?`
      : `Verstanden — ${topics}. Was hast du in dem Bereich schon ausprobiert?`;
  }
  return name
    ? `Verstanden — ${topics} klingt spannend für ${name}. Was hat ${name} in dem Bereich schon ausprobiert?`
    : `Verstanden — ${topics}. Was hast du in dem Bereich schon ausprobiert?`;
}

function summarizeExperienceForReply(experience = "") {
  const text = String(experience ?? "").toLowerCase();
  if (/noch nicht|erstes mal|ersten mal|anfäng|keine erfahrung|habe nichts|noch nie|gerade erst|alles für mich/i.test(text)) {
    return "du fängst gerade erst an";
  }
  if (/schon|bereits|nutze|gemacht|ausprobiert/i.test(text)) {
    return "du hast schon erste Erfahrung";
  }
  return "notiert";
}

function buildExperienceAckReply(profile = {}, { aboutSelf = true, ready = false } = {}) {
  const name = profile.name;
  const summary = summarizeExperienceForReply(profile.experience);
  const topics = formatInterestsForReply(profile.interests ?? []).join(", ");
  const topicPart = topics ? ` mit Fokus auf ${topics}` : "";

  if (ready) {
    return aboutSelf
      ? name
        ? `${name}, verstanden — ${summary}${topicPart}. Ich bereite jetzt deine Top-Nischen vor…`
        : `Verstanden — ${summary}${topicPart}. Ich bereite jetzt deine Top-Nischen vor…`
      : name
        ? `Verstanden — ${name} ${summary}${topicPart}. Ich bereite jetzt die Top-Nischen vor…`
        : `Verstanden — ${summary}${topicPart}. Ich bereite jetzt die Top-Nischen vor…`;
  }

  return name
    ? `${name}, verstanden — ${summary}. Erzähl mir noch etwas von dir.`
    : `Verstanden — ${summary}. Erzähl mir noch etwas von dir.`;
}

function replyEchoesUserText(reply = "", userText = "") {
  const normalizedReply = String(reply ?? "").toLowerCase();
  const normalizedUser = String(userText ?? "").toLowerCase();
  if (!normalizedReply || normalizedUser.length < 16) return false;

  const words = normalizedUser.match(/\b[\wäöüß]{4,}\b/g) ?? [];
  if (words.length < 4) return false;

  const hits = words.filter((word) => normalizedReply.includes(word));
  return hits.length >= Math.max(4, Math.ceil(words.length * 0.3));
}

function isCannedInterestPrompt(reply = "") {
  return /welche nischen oder themen interessieren/i.test(reply);
}

function userAskedForNicheSuggestions(text = "") {
  return /nischen?\s*(vorschlagen|empfehlen|passen|zeigen)/i.test(text) || /kannst du mir.*nischen/i.test(text);
}

function buildSmartNicheSuggestionReply(userText = "", profile = {}, messages = [], { mode = "onboarding" } = {}) {
  const ready = isProfileReadyForRanking(profile, messages);
  const explicitlyAsked = userAskedForNicheSuggestions(userText);

  if (mode === "onboarding" && !ready && !explicitlyAsked) return null;
  if (!userMentionsNicheTopics(userText) && !explicitlyAsked) return null;

  const slugs = suggestSlugsFromText(userText);
  if (!slugs.length && !explicitlyAsked) return null;

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

function buildOnboardingProfile(messages = [], seedProfile = {}) {
  return sanitizeProfile(pruneProfileFromMessages(extractAllFromConversation(messages, seedProfile), messages));
}

function finalizeJarvisTurn({
  messages = [],
  profile = {},
  llmReply = "",
  llmReady = false,
  llmExtracted = {},
  mode = "onboarding",
} = {}) {
  const seedProfile = mode === "onboarding" ? profile : mergeExtractedProfile(profile, llmExtracted);
  let fromConversation = buildOnboardingProfile(messages, seedProfile);

  const lastUserText = messages.filter((message) => message.role === "user").at(-1)?.text ?? "";
  const expectingField = getExpectingFieldFromMessages(messages);

  if (mode === "onboarding" && (isGreetingToAssistant(lastUserText) || isCasualGreeting(lastUserText))) {
    delete fromConversation.name;
  }

  const explicitNameFromUser = isExplicitNameIntentPhrase(lastUserText) ? collectNameFromMessages(messages) : null;
  if (explicitNameFromUser) {
    fromConversation = mergeExtractedProfile(fromConversation, { name: explicitNameFromUser });
  }

  let missing = getMissingProfileFields(fromConversation);
  const ready = isProfileReadyForRanking(fromConversation, messages);
  const lastIsUser = messages.at(-1)?.role === "user";
  const messagesBeforeTurn = lastIsUser ? messages.slice(0, -1) : messages;
  const profileBeforeTurn = lastIsUser ? buildOnboardingProfile(messagesBeforeTurn, seedProfile) : fromConversation;
  const wasReadyBefore = lastIsUser
    ? isProfileReadyForRanking(profileBeforeTurn, messagesBeforeTurn)
    : ready;
  const aboutSelf = userOnboardingIsAboutSelf(messages);

  let reply = String(llmReply ?? "").trim();

  const cannedRankingOnly =
    reply.length < 100 &&
    (/^perfekt[,.]?\s/i.test(reply) || /^super[,.]?\s/i.test(reply) || /^gute basis/i.test(reply)) &&
    /top-nischen/i.test(reply);

  const smartNiche = buildSmartNicheSuggestionReply(lastUserText, fromConversation, messages, { mode });
  const knowledgeReply = buildKnowledgeFallbackReply(lastUserText, fromConversation);

  if (mode === "assistant") {
    if (!reply && knowledgeReply) reply = knowledgeReply;
    if (!reply && smartNiche) reply = smartNiche;
    if (!reply || (cannedRankingOnly && !isSubstantiveReply(reply))) {
      reply = knowledgeReply ?? smartNiche ?? buildAssistantDefaultReply(fromConversation);
    }
  } else if (isSubstantiveReply(reply) && isKnowledgeQuestion(lastUserText)) {
    // LLM answered a knowledge question — keep it
  } else if (
    expectingField === "side_income_goal" &&
    isIncomeAnswer(lastUserText) &&
    !missing.includes("side_income_goal")
  ) {
    reply = buildIncomeAckReply(fromConversation, { aboutSelf });
  } else if (
    expectingField === "interests" &&
    hasExplicitInterests(fromConversation.interests) &&
    missing.includes("experience")
  ) {
    reply = buildInterestAckReply(fromConversation, fromConversation.interests, { aboutSelf });
  } else if (
    expectingField === "experience" &&
    String(fromConversation.experience ?? "").trim().length >= MIN_EXPERIENCE_CHARS &&
    !missing.includes("experience")
  ) {
    reply = buildExperienceAckReply(fromConversation, { aboutSelf, ready });
  } else if (
    expectingField === "education" &&
    String(fromConversation.education ?? "").trim().length >= 2 &&
    !missing.includes("education")
  ) {
    reply = buildEducationAckReply(fromConversation, { aboutSelf });
  } else if (
    expectingField === "age" &&
    fromConversation.age &&
    !missing.includes("age")
  ) {
    reply = buildAgeAckReply(fromConversation, { aboutSelf });
  } else if (
    expectingField === "name" &&
    fromConversation.name &&
    !missing.includes("name") &&
    (missing.includes("age") || /nennen|heiß|heiss|name/i.test(lastUserText))
  ) {
    reply = buildNameAckReply(fromConversation, { aboutSelf });
  } else if (missing[0] === "name" && (isCasualGreeting(lastUserText) || isGreetingToAssistant(lastUserText))) {
    reply = "Hey! Schön, dass du da bist. Wie darf ich dich nennen?";
  } else if (smartNiche && userAskedForNicheSuggestions(lastUserText)) {
    reply = smartNiche;
  } else if (!reply || cannedRankingOnly || isCannedInterestPrompt(reply) || isPrematureNicheSuggestion(reply)) {
    if (!reply && knowledgeReply) reply = knowledgeReply;
    else if (
      !isSubstantiveReply(reply) ||
      isPrematureNicheSuggestion(reply) ||
      isCannedInterestPrompt(reply) ||
      (/wie darf ich dich nennen/i.test(reply) && isExplicitNameIntentPhrase(lastUserText))
    ) {
      reply = buildFallbackReply(fromConversation, missing, messages);
    }
  }

  if (mode === "onboarding" && (/top-nischen/i.test(reply) || isPrematureNicheSuggestion(reply)) && !ready) {
    reply = buildFallbackReply(fromConversation, missing, messages);
  }

  if (/wie darf ich dich nennen/i.test(reply) && (fromConversation.name || isExplicitNameIntentPhrase(lastUserText))) {
    if (!fromConversation.name) {
      const collectedName = collectNameFromMessages(messages);
      if (collectedName) fromConversation = { ...fromConversation, name: collectedName };
    }
    const nextMissing = getMissingProfileFields(fromConversation);
    reply = nextMissing.includes("age")
      ? buildNameAckReply(fromConversation, { aboutSelf })
      : buildFallbackReply(fromConversation, nextMissing, messages);
  }

  if (isCannedInterestPrompt(reply) && hasExplicitInterests(fromConversation.interests)) {
    missing = getMissingProfileFields(fromConversation);
    reply = buildFallbackReply(fromConversation, missing, messages);
  }

  if (mode === "onboarding" && replyEchoesUserText(reply, lastUserText)) {
    if (expectingField === "interests" && hasExplicitInterests(fromConversation.interests)) {
      reply = buildInterestAckReply(fromConversation, fromConversation.interests, { aboutSelf });
    } else if (expectingField === "experience" && fromConversation.experience) {
      reply = buildExperienceAckReply(fromConversation, { aboutSelf, ready });
    } else if (!isSubstantiveReply(reply) || reply.length > 220) {
      reply = buildFallbackReply(fromConversation, missing, messages);
    }
  }

  if (fromConversation.name) {
    reply = personalizeReplyAddress(reply, fromConversation.name, { aboutSelf });
  }

  return {
    reply,
    profile: fromConversation,
    readyForRanking: ready,
    missing,
    autoRank: mode === "onboarding" && ready && !wasReadyBefore,
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
  const profileContext = buildProfileContext(profile, missing, messages);

  try {
    const parsed = await callOpenAIJson(
      `${buildJarvisChatJson(mode)}\n\n${profileContext}`,
      openAiMessages,
      { model: FOUNDER_CHAT_MODEL, temperature: 0.75, max_tokens: 720 }
    );

    return finalizeJarvisTurn({
      messages,
      profile,
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

export async function rankNichesForProfile(profile, groups = [], { messages = [] } = {}) {
  if (!isProfileReadyForRanking(profile, messages)) {
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
