import { communityChannels } from "@/lib/founder-data";
import {
  COMMUNITY_COACH_TIPS,
  buildProfilePatchFromAnswers,
  rankCommunitiesFromAnswers,
} from "@/lib/founder-ai-onboarding";
import { isOpenAiVoiceConfigured } from "@/lib/openai-voice";

export const JARVIS_OPENING =
  "Willkommen. Ich bin Founder — dein Jarvis für den Weg zum Unternehmer. Erzähl mir von dir: Name, Alter, Ausbildung oder Studium, wie viel du nebenbei verdienen willst — und was dich interessiert.";

export const NICHE_SLUGS = communityChannels
  .filter((c) => c.slug !== "founder-pro")
  .map((c) => c.slug);

const REQUIRED_FIELDS = ["name", "age", "education", "side_income_goal", "interests"];

const JARVIS_SYSTEM = `Du bist Founder — Jarvis-Style: freundlich, smart, fokussiert wie JARVIS bei Tony Stark. Du sprichst Deutsch, kurz und menschlich (2–4 Sätze).

Ziel: Im Gespräch diese Infos sammeln:
- name (Vorname reicht)
- age (Zahl)
- education (Ausbildung, Studium, Schule — was zutrifft)
- side_income_goal (wie viel EUR/Monat oder Jahr nebenbei verdienen will)
- interests (Nischen/Interessen als Array, z.B. Reselling, TikTok)
- experience (optional: Erfahrung, was schon probiert wurde)

Regeln:
- Stell pro Antwort maximal EINE Nachfrage, wenn etwas fehlt.
- Sei interessiert, nicht kitschig. Kein "Wow super!".
- Kurze Sätze mit natürlicher Interpunktion — gut für Sprachausgabe.
- Wenn alle Pflichtfelder da sind (name, age, education, side_income_goal, interests), setze ready_for_ranking true und fasse in 1–2 Sätzen zusammen — dann matchst du gleich die Nischen.

Antworte NUR als JSON:
{
  "reply": "string",
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

async function callOpenAIJson(system, messages) {
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
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, ...messages],
      response_format: { type: "json_object" },
      temperature: 0.65,
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

const FALLBACK_PROMPTS = {
  name: "Wie darf ich dich nennen?",
  age: "Wie alt bist du?",
  education: "Was machst du gerade — Ausbildung, Studium oder Schule?",
  side_income_goal: "Wie viel möchtest du nebenbei verdienen — grob pro Monat?",
  interests: "Welche Nischen oder Themen interessieren dich?",
};

const GREETING_ONLY = /^(hallo|hey|hi|moin|servus|yo|hello|guten tag|guten morgen|guten abend)[!.?\s]*$/i;

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
  if (!value) return {};

  const patch = {};

  if (expectingField === "name" || (!profile.name && isLikelyNameAnswer(value))) {
    const explicit = value.match(/(?:ich bin|ich heiße|name ist|nenn mich)\s+([A-Za-zÄÖÜäöüß-]{2,})/i);
    patch.name = explicit?.[1] ?? value.split(/\s+/)[0];
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

function buildFollowUpReply(profile = {}, missing = []) {
  const name = profile.name;
  const field = missing[0];
  if (!field) {
    return `Perfekt${name ? `, ${name}` : ""}. Klick auf „Meine Top-Nischen“.`;
  }

  const prompts = {
    name: FALLBACK_PROMPTS.name,
    age: name ? `Hey ${name}! Wie alt bist du?` : FALLBACK_PROMPTS.age,
    education: name ? `${name}, erzähl kurz: Ausbildung, Studium oder Schule?` : FALLBACK_PROMPTS.education,
    side_income_goal: name
      ? `Was ist dein Nebenverdienst-Ziel, ${name} — grob pro Monat?`
      : FALLBACK_PROMPTS.side_income_goal,
    interests: name
      ? `Welche Nischen interessieren dich, ${name}?`
      : FALLBACK_PROMPTS.interests,
  };

  return prompts[field] ?? "Erzähl mir noch etwas von dir.";
}

function finalizeJarvisTurn({ messages = [], profile = {}, llmReply = "", llmReady = false } = {}) {
  const fromConversation = extractAllFromConversation(messages, profile);
  const missing = getMissingProfileFields(fromConversation);
  const ready = missing.length === 0;

  let reply = String(llmReply ?? "").trim();
  if (ready) {
    reply = buildFollowUpReply(fromConversation, []);
  } else if (!reply || (fromConversation.name && /wie darf ich dich nennen/i.test(reply))) {
    reply = buildFollowUpReply(fromConversation, missing);
  } else if (missing.length && !reply.includes("?")) {
    reply = buildFollowUpReply(fromConversation, missing);
  }

  return {
    reply,
    profile: fromConversation,
    readyForRanking: ready || (Boolean(llmReady) && missing.length === 0),
    missing,
  };
}

function chatWithJarvisFallback({ messages = [], profile = {} }) {
  return finalizeJarvisTurn({ messages, profile });
}

export async function chatWithJarvis({ messages = [], profile = {} }) {
  if (!isOpenAiVoiceConfigured()) {
    return chatWithJarvisFallback({ messages, profile });
  }

  const openAiMessages = messages.map((m) => ({
    role: m.role === "founder" ? "assistant" : "user",
    content: m.text,
  }));

  try {
    const parsed = await callOpenAIJson(
      `${JARVIS_SYSTEM}\n\nBisher bekanntes Profil: ${JSON.stringify(profile)}`,
      openAiMessages
    );

    const llmProfile = mergeExtractedProfile(profile, parsed.extracted ?? {});

    return finalizeJarvisTurn({
      messages,
      profile: llmProfile,
      llmReply: parsed.reply,
      llmReady: Boolean(parsed.ready_for_ranking),
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
