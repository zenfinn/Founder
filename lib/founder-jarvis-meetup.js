export const MEETUP_CATEGORIES = ["Meetup", "Workshop", "Networking", "Dinner", "Coworking"];

const MEETUP_INTENT_PATTERN =
  /meetup|meet-?up|event\s+(organisier|planen|einreichen|vorschlagen)|treffen\s+organisier|workshop\s+(organisier|planen)|networking\s+(event|treffen)|veranstaltung\s+(organisier|planen)/i;

const CONFIRM_PATTERN =
  /^(ja|jap|jo|jep|ok|okay|passt|einreichen|los|gerne|mach|bitte|genau|stimmt|korrekt|so\s+passt|mach\s+so)\b/i;

const CANCEL_PATTERN = /abbrechen|abbruch|stop|vergiss|doch\s+nicht|nicht\s+mehr|lass\s+sein/i;

const MEETUP_PROMPTS = {
  title: "Wie soll das Meetup heißen?",
  starts_at: "Wann findet es statt — Datum und Uhrzeit?",
  location_text: "Wo soll es stattfinden — Stadt, Venue oder Adresse?",
  description: "Beschreib kurz, worum es geht und was die Teilnehmer erwarten können.",
};

export function userWantsMeetupFlow(text = "") {
  return MEETUP_INTENT_PATTERN.test(String(text ?? ""));
}

export function userConfirmsAction(text = "") {
  return CONFIRM_PATTERN.test(String(text ?? "").trim());
}

export function userCancelsFlow(text = "") {
  return CANCEL_PATTERN.test(String(text ?? ""));
}

export function parseMeetupDateTime(text = "") {
  const value = String(text ?? "").trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const deMatch = value.match(
    /(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:\s*(?:um\s*)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:uhr)?)?/i
  );
  if (deMatch) {
    const day = Number(deMatch[1]);
    const month = Number(deMatch[2]) - 1;
    let year = Number(deMatch[3]);
    if (year < 100) year += 2000;
    const hour = deMatch[4] != null ? Number(deMatch[4]) : 18;
    const minute = deMatch[5] != null ? Number(deMatch[5]) : 0;
    const date = new Date(year, month, day, hour, minute);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  return null;
}

export function mergeExtractedMeetup(current = {}, patch = {}) {
  const next = { ...current };

  if (patch.title) next.title = String(patch.title).trim().slice(0, 160);
  if (patch.location_text) next.location_text = String(patch.location_text).trim().slice(0, 200);
  if (patch.description) next.description = String(patch.description).trim().slice(0, 2000);
  if (patch.host_info) next.host_info = String(patch.host_info).trim().slice(0, 500);
  if (patch.category) {
    const category = String(patch.category).trim();
    if (category) next.category = category.slice(0, 60);
  }

  if (patch.starts_at) {
    const iso = parseMeetupDateTime(patch.starts_at);
    if (iso) next.starts_at = iso;
  }

  return next;
}

export function getMissingMeetupFields(meetup = {}) {
  const missing = [];
  if (!String(meetup.title ?? "").trim()) missing.push("title");
  if (!meetup.starts_at || Number.isNaN(new Date(meetup.starts_at).getTime())) missing.push("starts_at");
  if (!String(meetup.location_text ?? "").trim()) missing.push("location_text");
  if (!String(meetup.description ?? "").trim()) missing.push("description");
  return missing;
}

export function isMeetupReadyForSubmit(meetup = {}) {
  return getMissingMeetupFields(meetup).length === 0;
}

export function isMeetupFlowActive(meetup = {}, messages = []) {
  if (Object.entries(meetup).some(([, value]) => value != null && String(value).trim() !== "")) {
    return true;
  }

  const recentUser = messages.filter((message) => message.role === "user").slice(-4);
  return recentUser.some((message) => userWantsMeetupFlow(message.text));
}

export function formatMeetupDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function buildMeetupSummary(meetup = {}) {
  const lines = [
    `**Titel:** ${meetup.title}`,
    `**Wann:** ${formatMeetupDate(meetup.starts_at)}`,
    `**Ort:** ${meetup.location_text}`,
    `**Beschreibung:** ${meetup.description}`,
  ];

  if (meetup.category) lines.push(`**Kategorie:** ${meetup.category}`);
  if (meetup.host_info) lines.push(`**Host:** ${meetup.host_info}`);

  return lines.join("\n");
}

export function buildMeetupConfirmReply(meetup = {}, name = "") {
  const greet = name ? `${name}, ` : "";
  return `${greet}hier die Zusammenfassung für dein Meetup:\n\n${buildMeetupSummary(meetup)}\n\nSoll ich das so zur Prüfung einreichen? Sag einfach „ja“ oder „einreichen“.`;
}

function getMeetupPrompt(field, name = "") {
  if (!name) return MEETUP_PROMPTS[field] ?? "";
  const named = {
    title: `Wie soll ${name}s Meetup heißen?`,
    starts_at: `Wann findet ${name}s Meetup statt — Datum und Uhrzeit?`,
    location_text: `Wo soll ${name}s Meetup stattfinden?`,
    description: `Beschreib kurz, worum ${name}s Meetup geht.`,
  };
  return named[field] ?? MEETUP_PROMPTS[field] ?? "";
}

export function buildMeetupFallbackReply(meetup = {}, missing = [], name = "") {
  const field = missing[0];
  if (!field) return buildMeetupConfirmReply(meetup, name);
  return getMeetupPrompt(field, name);
}

export function extractMeetupFromText(text = "", { expectingField = null, meetup = {} } = {}) {
  const value = String(text ?? "").trim();
  if (!value) return {};

  const patch = {};

  if (expectingField === "title" || !meetup.title) {
    if (expectingField === "title" && value.length >= 3) {
      patch.title = value.slice(0, 160);
    }
  }

  if (expectingField === "starts_at" || !meetup.starts_at) {
    const iso = parseMeetupDateTime(value);
    if (iso) patch.starts_at = iso;
  }

  if (expectingField === "location_text" || !meetup.location_text) {
    if (expectingField === "location_text" && value.length >= 2) {
      patch.location_text = value.slice(0, 200);
    } else if (/stadt|straße|str\.|platz|café|büro|online|zoom|meet/i.test(value) && value.length >= 3) {
      patch.location_text = value.slice(0, 200);
    }
  }

  if (expectingField === "description" || !meetup.description) {
    if (expectingField === "description" && value.length >= 12) {
      patch.description = value.slice(0, 2000);
    }
  }

  if (!meetup.host_info && value.length >= 12 && /host|organisier|ich bin|unternehm/i.test(value)) {
    patch.host_info = value.slice(0, 500);
  }

  for (const category of MEETUP_CATEGORIES) {
    if (new RegExp(`\\b${category}\\b`, "i").test(value)) {
      patch.category = category;
      break;
    }
  }

  return patch;
}

export function extractAllMeetupFromConversation(messages = [], meetup = {}) {
  let current = { ...meetup };
  const userMessages = messages.filter((message) => message.role === "user");

  for (const message of userMessages) {
    const missing = getMissingMeetupFields(current);
    const patch = extractMeetupFromText(message.text, {
      expectingField: missing[0] ?? null,
      meetup: current,
    });
    current = mergeExtractedMeetup(current, patch);
  }

  return current;
}

export function buildMeetupHostInfoSeed(profile = {}, jarvisProfile = {}) {
  const parts = [
    jarvisProfile.name || profile.display_name,
    profile.company_name,
    profile.industry,
    profile.bio,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);

  return parts.join(" — ").slice(0, 500);
}
