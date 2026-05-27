import Image from "next/image";
import { getProfileInitial } from "@/lib/profiles";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";

export function PublicProfileAvatar({ profile, displayName, size = "lg" }) {
  const dimensions = size === "xl" ? "h-36 w-36 text-5xl" : size === "lg" ? "h-28 w-28 text-4xl" : "h-12 w-12 text-lg";
  const initial = getProfileInitial({ display_name: displayName });

  return (
    <div className="relative mx-auto">
      <div
        className={`relative mx-auto flex items-center justify-center overflow-hidden rounded-full bg-founder-600 font-serif font-bold text-white ring-4 ring-white shadow-soft ${dimensions}`}
      >
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="" fill className="object-cover" unoptimized />
        ) : (
          initial
        )}
      </div>
      <div className="absolute -bottom-1 -right-1">
        <PublicRankBadge rank={profile?.current_rank ?? "aspiring"} size="sm" showIcon />
      </div>
    </div>
  );
}
