import { DEFAULT_SEED_KEY, MESSAGE_POOLS, SEED_PROFILES, resolveSeedKey } from "@/lib/group-chat-seed";

export const MESSAGES_PER_HOUR = 3;
export const SIMULATED_HOURS_HISTORY = 12;
const SLOT_OFFSETS_MINUTES = [11, 27, 43];

function hashSeed(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function hourStartTimestamp(timestamp) {
  const date = new Date(timestamp);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}

function getShuffledIndices(groupKey, groupId) {
  const pool = MESSAGE_POOLS[groupKey] ?? MESSAGE_POOLS[DEFAULT_SEED_KEY];
  const indices = pool.map((_, index) => index);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = hashSeed(`${groupKey}-${groupId}-shuffle-${index}`) % (index + 1);
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  return indices;
}

function pickTemplate(groupKey, groupId, globalSlotIndex) {
  const pool = MESSAGE_POOLS[groupKey] ?? MESSAGE_POOLS[DEFAULT_SEED_KEY];
  const order = getShuffledIndices(groupKey, groupId);
  return pool[order[globalSlotIndex % order.length]];
}

function globalSlotIndexFromHour(hourTs, slot, now) {
  const historyStart = hourStartTimestamp(now) - (SIMULATED_HOURS_HISTORY - 1) * 60 * 60 * 1000;
  const hoursFromStart = Math.round((hourTs - historyStart) / (60 * 60 * 1000));
  return hoursFromStart * MESSAGES_PER_HOUR + slot;
}

function buildSimulatedMessage({ groupId, hourTs, slot, template }) {
  const profile = SEED_PROFILES[template.profileKey];
  const jitter = hashSeed(`${groupId}-${hourTs}-${slot}`) % 9;
  const createdAt = new Date(hourTs + (SLOT_OFFSETS_MINUTES[slot] + jitter) * 60_000).toISOString();

  return {
    id: `sim-${groupId}-${hourTs}-${slot}`,
    author_id: profile.id,
    content: template.content,
    created_at: createdAt,
    isSeed: true,
    profile,
  };
}

export function getSimulatedMessageId(groupId, hourTs, slot) {
  return `sim-${groupId}-${hourTs}-${slot}`;
}

/** Alle sichtbaren Sim-Nachrichten der letzten Stunden (3 pro Stunde, ohne Wiederholungen im Fenster). */
export function getSimulatedChatMessages(group, groupId, now = Date.now()) {
  const key = resolveSeedKey(group);
  const messages = [];

  for (let hoursAgo = SIMULATED_HOURS_HISTORY - 1; hoursAgo >= 0; hoursAgo -= 1) {
    const hourTs = hourStartTimestamp(now) - hoursAgo * 60 * 60 * 1000;

    for (let slot = 0; slot < MESSAGES_PER_HOUR; slot += 1) {
      const slotIndex = globalSlotIndexFromHour(hourTs, slot, now);
      const template = pickTemplate(key, groupId, slotIndex);
      const message = buildSimulatedMessage({ groupId, hourTs, slot, template });

      if (new Date(message.created_at).getTime() <= now) {
        messages.push(message);
      }
    }
  }

  return messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/** Nächste fällige Sim-Nachricht (für Live-Tick). */
export function getDueSimulatedMessage(group, groupId, now = Date.now(), knownIds = new Set()) {
  const key = resolveSeedKey(group);
  const currentHourTs = hourStartTimestamp(now);

  for (let hoursAgo = 0; hoursAgo <= 1; hoursAgo += 1) {
    const hourTs = currentHourTs - hoursAgo * 60 * 60 * 1000;

    for (let slot = 0; slot < MESSAGES_PER_HOUR; slot += 1) {
      const id = getSimulatedMessageId(groupId, hourTs, slot);
      if (knownIds.has(id)) continue;

      const slotIndex = globalSlotIndexFromHour(hourTs, slot, now);
      const template = pickTemplate(key, groupId, slotIndex);
      const message = buildSimulatedMessage({ groupId, hourTs, slot, template });

      if (new Date(message.created_at).getTime() <= now) {
        return message;
      }
    }
  }

  return null;
}

/** Millisekunden bis zur nächsten geplanten Nachricht. */
export function msUntilNextSimulatedMessage(groupId, now = Date.now()) {
  const currentHourTs = hourStartTimestamp(now);

  for (let hoursAgo = 0; hoursAgo <= 1; hoursAgo += 1) {
    const hourTs = currentHourTs - hoursAgo * 60 * 60 * 1000;

    for (let slot = 0; slot < MESSAGES_PER_HOUR; slot += 1) {
      const jitter = hashSeed(`${groupId}-${hourTs}-${slot}`) % 9;
      const at = hourTs + (SLOT_OFFSETS_MINUTES[slot] + jitter) * 60_000;
      if (at > now) return at - now;
    }
  }

  const nextHour = currentHourTs + 60 * 60 * 1000 + SLOT_OFFSETS_MINUTES[0] * 60_000;
  return Math.max(nextHour - now, 60_000);
}

/** @deprecated – nutze getSimulatedChatMessages */
export function getSeedChatMessages(group) {
  return getSimulatedChatMessages(group, group?.id ?? group?.slug ?? "group");
}
