import { communityChannels } from "@/lib/founder-data";
import {
  COMMUNITY_COACH_TIPS,
  buildProfilePatchFromAnswers,
  rankCommunitiesFromAnswers,
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
• Fehlen noch Pflichtfelder (name, age, education, side_income_goal, interests) und der Nutzer hat gerade kein anderes Thema: höchstens EINE sanfte Nachfrage am Ende.
• Sind alle Pflichtfelder da: fasse kurz zusammen was du über ihn weißt und sag, dass du gleich seine drei besten Nischen berechnest.

VERBOTEN:
• Leere Floskeln („Super!“, „Perfekt!“, „Toll!“) ohne Inhalt.
• Nur „schau in der Community“ ohne zu erklären was er dort konkret tun soll.
• Roboterhafte Schablonen oder immer dieselbe Satzstruktur.
• „Klick auf Meine Top-Nischen“ — das passiert automatisch.

Sprache: Deutsch. Keine JSON, keine Meta-Kommentare — nur deine Antwort an den Nutzer.`;

const EXTRACT_SYSTEM = `Du analysierst ein Onboarding-Gespräch auf joinfounder.forum und extrahierst Profildaten.

Pflichtfelder für Nischen-Ranking: name, age, education, side_income_goal, interests (mindestens ein Eintrag).
Optional: experience.

Regeln:
• Nur Werte setzen die der Nutzer klar genannt oder eindeutig impliziert hat.
• interests: konkrete Nischen/Themen als Array (z.B. ["TikTok", "E-Commerce"]).
• age: Zahl in Jahren.
• ready_for_ranking: true nur wenn alle Pflichtfelder befüllt sind.

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

const RANK_SYSTEM = `Du rankst 12 Founder-Nischen für einen neuen Nutzer. Gib die besten 3 zurück.

Nischen (slug): ${NICHE_SLUGS.join(", ")}

Berücksichtige: Alter, finanzielle Ziele, Interessen, Erfahrung.
Junge Nutzer eher TikTok/KI/Reselling; höhere Ziele eher E-Commerce/Real Estate; wenig Erfahrung einsteigerfreundliche Nischen.

Antworte NUR als JSON:
{
  "ranked_slugs": ["slug1", "slug2", "slug3"],
  "reasons": { "slug1": "kurzer Grund", "slug2": "...", "slug3": "..." }
}`;

export function mergeExtractedProfile(current = {}, patch = {}) {
  const next = { ...current };
  if (patch.name) next.name = String(patch.name).trim();
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
  return missing;
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
      temperature: 0.82,
      max_tokens: 900,
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
      ready_for_ranking: getMissingProfileFields(fromConversation).length === 0,
      missing: getMissingProfileFields(fromConversation),
    };
  }
}

const GREETING_ONLY =
  /^(hallo|hey|hi|moin|servus|yo|hello|guten tag|guten morgen|guten abend|was geht|na)[!.?\s]*$/i;

const FALLBACK_PROMPTS = {
  name: "Wie darf ich dich nennen?",
  age: "Wie alt bist du?",
  education: "Was machst du gerade — Ausbildung, Studium oder Schule?",
  side_income_goal: "Wie viel möchtest du nebenbei verdienen — grob pro Monat?",
  interests: "Welche Nischen oder Themen interessieren dich?",
};

function isLikelyNameAnswer(text) {
  const value = String(text ?? "").trim();
  if (!value || value.length > 32 || GREETING_ONLY.test(value)) return false;
  if (/\d/.test(value)) return false;
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length > 3) return false;
  return words.every((word) => /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*$/.test(word));
}

function extractFromUserText(text = "", { expectingField = null, profile = {} } = {}) {
  const value = String(text).trim();
  if (!value || GREETING_ONLY.test(value)) return {};

  const patch = {};

  if (expectingField === "name" || (!profile.name && isLikelyNameAnswer(value))) {
    if (GREETING_ONLY.test(value)) return patch;
    const explicit = value.match(/(?:ich bin|ich heiße|name ist|nenn mich)\s+([A-Za-zÄÖÜäöüß-]{2,})/i);
    const candidate = explicit?.[1] ?? value.split(/\s+/)[0];
    if (candidate && !GREETING_ONLY.test(candidate)) patch.name = candidate;
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

  if (expectingField === "interests" || !profile.interests?.length) {
    if (expectingField === "interests") {
      patch.interests = value
        .split(/,| und /i)
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 8);
    } else {
      const interestHints = value.match(/(?:interesse|mag|liebe|will)\w*\s+(?:an\s+)?(.+)/i);
      if (interestHints) {
        patch.interests = interestHints[1]
          .split(/,| und /i)
          .map((part) => part.trim())
          .filter(Boolean)
          .slice(0, 8);
      }
    }
  }

  if (expectingField === "experience" && value.length >= 2) {
    patch.experience = value.slice(0, 200);
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
      ? `Starke Basis, ${name}. Ich berechne jetzt deine drei besten Nischen — gleich zeige ich sie dir.`
      : "Ich hab genug Infos. Gleich kommen deine drei besten Nischen.";
  }

  const prompts = {
    name: FALLBACK_PROMPTS.name,
    age: name ? `Hey ${name} — wie alt bist du?` : FALLBACK_PROMPTS.age,
    education: name ? `${name}, erzähl kurz: Ausbildung, Studium oder Schule?` : FALLBACK_PROMPTS.education,
    side_income_goal: name
      ? `Was ist dein Nebenverdienst-Ziel, ${name} — grob pro Monat?`
      : FALLBACK_PROMPTS.side_income_goal,
    interests: name
      ? `Welche Nischen interessieren dich, ${name}?`
      : FALLBACK_PROMPTS.interests,
  };

  return prompts[field] ?? "Erzähl mir noch etwas von dir — oder frag mich, was Founder alles bietet.";
}

function finalizeJarvisTurn({ messages = [], profile = {}, llmReply = "", llmReady = false, llmExtracted = {} } = {}) {
  const merged = mergeExtractedProfile(profile, llmExtracted);
  const fromConversation = extractAllFromConversation(messages, merged);
  const missing = getMissingProfileFields(fromConversation);
  const ready = missing.length === 0;

  let reply = String(llmReply ?? "").trim();

  const cannedRankingOnly =
    reply.length < 100 &&
    (/^perfekt[,.]?\s/i.test(reply) || /^super[,.]?\s/i.test(reply)) &&
    /top-nischen/i.test(reply);

  if (!reply || cannedRankingOnly) {
    reply = buildFallbackReply(fromConversation, missing);
  }

  return {
    reply,
    profile: fromConversation,
    readyForRanking: ready || (Boolean(llmReady) && missing.length === 0),
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
    llmReady: missing.length === 0,
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
    const [llmReply, extraction] = await Promise.all([
      callOpenAIChat(`${JARVIS_SYSTEM}\n\n${profileContext}`, openAiMessages),
      extractProfileFromConversation(messages, profile),
    ]);

    const llmProfile = mergeExtractedProfile(profile, extraction.extracted ?? {});

    return finalizeJarvisTurn({
      messages,
      profile: llmProfile,
      llmReply,
      llmReady: extraction.ready_for_ranking,
      llmExtracted: extraction.extracted ?? {},
    });
  } catch (error) {
    console.warn("Jarvis chat fallback", error);
    return chatWithJarvisFallback({ messages, profile });
  }
}

export async function rankNichesForProfile(profile, groups = []) {
  const answers = profileToAnswers(profile);

  let rankedSlugs = [];
  let reasons = {};

  try {
    const parsed = await callOpenAIJson(RANK_SYSTEM, [
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
    ]);
    rankedSlugs = (parsed.ranked_slugs ?? []).filter((s) => NICHE_SLUGS.includes(s)).slice(0, 3);
    reasons = parsed.reasons ?? {};
  } catch (error) {
    console.warn("LLM rank fallback", error);
  }

  const keywordRanked = rankCommunitiesFromAnswers(answers, groups);
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
