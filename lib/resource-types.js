export const resourceTypes = [
  {
    value: "saas_ai_tools",
    label: "SaaS & AI Tools",
    hint: "Software, Automation wie Make/Zapier, ChatGPT-Wrapper & AI-Stacks",
    badgeClass: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
  },
  {
    value: "templates_blueprints",
    label: "Templates & Blueprints",
    hint: "Notion-Dashboards, Cold-Outreach-Skripte, Figma-Files & Playbooks",
    badgeClass: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  },
  {
    value: "supplier_wholesaler",
    label: "Supplier & Wholesaler",
    hint: "Sourcing, Großhändler & Lieferanten für E-Commerce & Reselling",
    badgeClass: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  },
  {
    value: "youtube_media",
    label: "YouTube & Media",
    hint: "Video-Guides, Tutorials, Podcasts & Creator-Tools",
    badgeClass: "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
  },
  {
    value: "discord_communities",
    label: "Discord & Communities",
    hint: "Networking-Gruppen, Masterminds & private Founder-Communities",
    badgeClass: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25",
  },
];

const legacyResourceTypeLabels = {
  discord: "Discord & Communities",
  youtube: "YouTube & Media",
  tool: "SaaS & AI Tools",
  website: "Templates & Blueprints",
  other: "Andere",
};

export const defaultResourceType = resourceTypes[0].value;

export function getResourceTypeLabel(type) {
  return resourceTypes.find((item) => item.value === type)?.label ?? legacyResourceTypeLabels[type] ?? type;
}

export function getResourceTypeMeta(type) {
  return resourceTypes.find((item) => item.value === type) ?? null;
}

export function isValidResourceUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeResourceUrl(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}
