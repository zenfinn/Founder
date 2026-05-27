"use client";

import Link from "next/link";
import { RankNobleIcon } from "@/components/RankNobleBadge";
import { OwnerNobleIcon } from "@/components/OwnerNobleIcon";
import { getProfileInitial } from "@/lib/profiles";
import { isPlatformOwner } from "@/lib/membership";

export function ProfileAvatarWithRank({ profile, href = "/profile", size = "md" }) {
  const rank = profile?.current_rank ?? "aspiring";
  const dimensions = size === "lg" ? 96 : size === "sm" ? 36 : 44;
  const badgeClass = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";
  const initialClass = size === "lg" ? "text-4xl" : "text-lg";
  const avatarUrl = profile?.avatar_url?.trim() || "";
  const initial = getProfileInitial(profile);
  const showOwnerBadge = isPlatformOwner(profile);

  return (
    <Link
      href={href}
      className="relative block shrink-0 rounded-full transition hover:opacity-90"
      title={profile?.display_name?.trim() || "Profil"}
      aria-label="Profil öffnen"
    >
      <div className="relative" style={{ width: dimensions, height: dimensions }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            width={dimensions}
            height={dimensions}
            className="h-full w-full rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center rounded-full bg-founder-600 font-serif font-bold text-white ring-2 ring-white shadow-sm ${initialClass}`}
            aria-hidden
          >
            {initial}
          </div>
        )}
        {showOwnerBadge && (
          <span className="absolute -bottom-0.5 -left-0.5 z-10">
            <OwnerNobleIcon className={badgeClass} />
          </span>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 z-10">
          <RankNobleIcon rank={rank} className={badgeClass} />
        </span>
      </div>
    </Link>
  );
}
