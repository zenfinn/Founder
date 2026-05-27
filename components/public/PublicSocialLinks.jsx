import { Globe, Instagram, Linkedin, Music2, Twitter } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/public-profile";

const iconMap = {
  tiktok: Music2,
  instagram: Instagram,
  linkedin: Linkedin,
  website: Globe,
  twitter: Twitter,
};

export function PublicSocialLinks({ profile, variant = "light" }) {
  const activeLinks = SOCIAL_LINKS.filter(({ key }) => profile?.[key]);
  if (activeLinks.length === 0) return null;

  const buttonClass =
    variant === "dark"
      ? "inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
      : "inline-flex h-12 w-12 items-center justify-center rounded-full bg-founder-50 text-founder-700 transition hover:bg-founder-100";

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {activeLinks.map(({ key, label, icon }) => {
        const Icon = iconMap[icon];
        return (
          <a
            key={key}
            href={profile[key]}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonClass}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}
