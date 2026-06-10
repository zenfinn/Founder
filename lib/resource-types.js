export const resourceTypes = [
  {
    value: "saas_ai_tools",
    label: "SaaS & AI Tools",
    hint: "Software, Automation wie Make/Zapier, ChatGPT-Wrapper & AI-Stacks",
    badgeClass: "bg-violet-50 text-violet-700",
  },
  {
    value: "templates_blueprints",
    label: "Templates & Blueprints",
    hint: "Notion-Dashboards, Cold-Outreach-Skripte, Figma-Files & Playbooks",
    badgeClass: "bg-sky-50 text-sky-700",
  },
  {
    value: "supplier_wholesaler",
    label: "Supplier & Wholesaler",
    hint: "Sourcing, Großhändler & Lieferanten für E-Commerce & Reselling",
    badgeClass: "bg-amber-50 text-amber-800",
  },
  {
    value: "youtube_media",
    label: "YouTube & Media",
    hint: "Video-Guides, Tutorials, Podcasts & Creator-Tools",
    badgeClass: "bg-red-50 text-red-700",
  },
  {
    value: "discord_communities",
    label: "Discord & Communities",
    hint: "Networking-Gruppen, Masterminds & private Founder-Communities",
    badgeClass: "bg-indigo-50 text-indigo-700",
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
