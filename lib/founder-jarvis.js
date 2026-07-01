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

PROFIL & NISCHEN-MATCHING (nebenbei, nicht dominierend):
• Merke dir freiwillig geteilte Infos: Name, Alter, Ausbildung, Nebenverdienst-Ziel, Interessen, Erfahrung.
• Stelle Profilfragen NUR wenn das Gespräch natürlich dafür ist — NIEMALS mitten in einer Fachfrage das Thema wechseln.
• Für ein Nischen-Ranking brauchst du ALLES: name, age, education, side_income_goal, interests (explizit genannte Nischen/Themen), experience (was schon ausprobiert wurde).
• Interessen NIEMALS aus Studium oder Ausbildung ableiten — nur wenn der Nutzer Nischen/Themen selbst nennt.
• Fehlt noch etwas: frage gezielt nach Interessen („Welche Nischen interessieren dich?“) und Erfahrung („Was hast du schon ausprobiert?“).
• Erst wenn wirklich alles da ist: kurz zusammenfassen und sagen, dass er „Meine Top-Nischen“ tippen kann — starte NICHT selbst das Ranking.

• Wenn der Nutzer sagt, wie er genannt werden will („nenn mich Boss“, „du darfst mich X nennen“): Namen sofort übernehmen, kurz bestätigen — NIEMALS nochmal „Wie darf ich dich nennen?“.

• Nutze den Vornamen NUR wenn er eindeutig genannt wurde (z.B. „ich heiße Max“) — nie aus unklaren Wörtern wie „High“, „Found“ oder Spracherkennungs-Fehlern.
• Kein „Hey [Name]“ in jeder Antwort — höchstens gelegentlich, sonst neutral und direkt.

VERBOTEN:
• Leere Floskeln („Super!“, „Perfekt!“, „Toll!“) ohne Inhalt.
• Nur „schau in der Community“ ohne zu erklären was er dort konkret tun soll.
• Roboterhafte Schablonen oder immer dieselbe Satzstruktur.
• „Klick auf Meine Top-Nischen“ — das passiert automatisch.

Sprache: Deutsch. Antworte natürlich und direkt.`;

const JARVIS_CHAT_JSON = `${JARVIS_SYSTEM}

Zusätzlich extrahiere im selben Schritt Profildaten. name auch bei Spitznamen wenn explizit genannt (z.B. „nenn mich Boss“). interests nur bei explizit genannten Nischen/Themen — nie aus Studium ableiten. ready_for_ranking nur wenn name, age, education, side_income_goal, interests und experience alle klar vom Nutzer stammen.

Antworte NUR als JSON:
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

const EXTRACT_SYSTEM = `Du analysierst ein Onboarding-Gespräch auf joinfounder.forum und extrahierst Profildaten.

Pflichtfelder für Nischen-Ranking: name, age, education, side_income_goal, interests (mindestens ein explizit genanntes Thema/Nische), experience (mindestens ein kurzer Satz).

Regeln:
• Nur Werte setzen die der Nutzer klar genannt hat — nicht raten, nicht aus Studium/Ausbildung ableiten.
• interests: NUR wenn der Nutzer Nischen, Branchen oder Themen genannt hat die ihn reizen (z.B. TikTok, Reselling, Immobilien). Studienfach ≠ Interesse.
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
    const merged = [...(next.interests ?? []), ...patch.interests].map((i) => String(i).trim()).filter(Boolean);
    next.interests = [...new Set(merged)];
  }
  return next;
}

export function getMissingProfileFields(profile = {}) {
  const missing = [];
  if (!profile.name) missing.push("name");
  if (!profile.age) missing.push("age");
  if (!profile.education) missing.push("education");
  if (!profile.side_income_goal) missing.push("side_income_goal");
  if (!profile.interests?.length) missing.push("interests");
  if (!String(profile.experience ?? "").trim()) missing.push("experience");
  return missing;
}

export function isProfileReadyForRanking(profile = {}) {
  return getMissingProfileFields(profile).length === 0;
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

  return `Bekanntes Profil: ${known || "noch leer"}.
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
      max_tokens: 480,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI Fehler: ${response.status} ${detail.slice(0, 120)}`);
  }

  const payload = await response.json();
  return String(payload.choices?.[0]?.message?.content ?? "").trim();
}

async function callOpenAIJson(system, messages, { model = "gpt-4o-mini", temperature = 0.2 } = {}) {
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
      ready_for_ranking: isProfileReadyForRanking(fromConversation),
      missing: getMissingProfileFields(fromConversation),
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

const NICHE_TOPIC_PATTERN =
  /tiktok|e-?commerce|resell|dropship|immobilien|real estate|trading|crypto|memecoin|ki\b|ai\b|creator|youtube|web.?design|amazon|fba|podcast|handwerk|dienstleist/i;

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

  if (expectingField === "interests" || (!profile.interests?.length && NICHE_TOPIC_PATTERN.test(value))) {
    if (expectingField === "interests" || NICHE_TOPIC_PATTERN.test(value)) {
      patch.interests = value
        .split(/,| und /i)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 8);
    }
  }

  if (expectingField === "experience") {
    if (value.length >= 4) {
      patch.experience = value.slice(0, 200);
    }
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

function buildFallbackReply(profile = {}, missing = []) {
  const name = profile.name;
  const field = missing[0];

  if (!field) {
    return name
      ? `Gute Basis, ${name}. Wenn du bereit bist, tippe unten auf „Meine Top-Nischen“ — ich hab genug für ein personalisiertes Ranking.`
      : "Wenn du bereit bist, tippe „Meine Top-Nischen“ für dein personalisiertes Ranking.";
  }

  const prompts = {
    name: FALLBACK_PROMPTS.name,
    age: FALLBACK_PROMPTS.age,
    education: FALLBACK_PROMPTS.education,
    side_income_goal: FALLBACK_PROMPTS.side_income_goal,
    interests: FALLBACK_PROMPTS.interests,
    experience: FALLBACK_PROMPTS.experience,
  };

  return prompts[field] ?? "Erzähl mir noch etwas von dir — oder frag mich, was Founder alles bietet.";
}

function finalizeJarvisTurn({ messages = [], profile = {}, llmReply = "", llmReady = false, llmExtracted = {} } = {}) {
  const merged = sanitizeProfile(mergeExtractedProfile(profile, llmExtracted));
  const fromConversation = sanitizeProfile(extractAllFromConversation(messages, merged));
  const missing = getMissingProfileFields(fromConversation);
  const ready = isProfileReadyForRanking(fromConversation);

  let reply = String(llmReply ?? "").trim();

  const cannedRankingOnly =
    reply.length < 100 &&
    (/^perfekt[,.]?\s/i.test(reply) || /^super[,.]?\s/i.test(reply)) &&
    /top-nischen/i.test(reply);

  if (!reply || cannedRankingOnly) {
    reply = buildFallbackReply(fromConversation, missing);
  }

  if (/wie darf ich dich nennen/i.test(reply) && fromConversation.name) {
    const nextMissing = getMissingProfileFields(fromConversation);
    reply = nextMissing.length
      ? buildFallbackReply(fromConversation, nextMissing)
      : `Alles klar, ${fromConversation.name} — womit kann ich dir helfen?`;
  }

  return {
    reply,
    profile: fromConversation,
    readyForRanking: ready,
    missing,
  };
}

function chatWithJarvisFallback({ messages = [], profile = {} }) {
  const fromConversation = extractAllFromConversation(messages, profile);
  const missing = getMissingProfileFields(fromConversation);
  return finalizeJarvisTurn({
    messages,
    profile: fromConversation,
    llmReply: buildFallbackReply(fromConversation, missing),
    llmReady: isProfileReadyForRanking(fromConversation),
  });
}

export async function chatWithJarvis({ messages = [], profile = {} }) {
  if (!isOpenAiVoiceConfigured()) {
    return chatWithJarvisFallback({ messages, profile });
  }

  const openAiMessages = messages.map((m) => ({
    role: m.role === "founder" ? "assistant" : "user",
    content: m.text,
  }));

  const missing = getMissingProfileFields(profile);
  const profileContext = buildProfileContext(profile, missing);

  try {
    const parsed = await callOpenAIJson(
      `${JARVIS_CHAT_JSON}\n\n${profileContext}`,
      openAiMessages,
      { model: FOUNDER_CHAT_MODEL, temperature: 0.75 }
    );

    const llmProfile = sanitizeProfile(mergeExtractedProfile(profile, parsed.extracted ?? {}));

    return finalizeJarvisTurn({
      messages,
      profile: llmProfile,
      llmReply: parsed.reply,
      llmReady: Boolean(parsed.ready_for_ranking),
      llmExtracted: parsed.extracted ?? {},
    });
  } catch (error) {
    console.warn("Jarvis chat fallback", error);
    return chatWithJarvisFallback({ messages, profile });
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
  if (!isProfileReadyForRanking(profile)) {
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

  return `${greet}deine drei besten Nischen sind: ${named}. Schau sie dir auf der Treppe an und tritt bei, was sich am besten anfühlt.`;
}
