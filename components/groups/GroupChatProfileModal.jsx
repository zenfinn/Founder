"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RankNobleBadge } from "@/components/RankNobleBadge";
import { formatDisplayName } from "@/lib/public-profile";
import { MessageCircle, X } from "lucide-react";

function ProfileAvatar({ profile, size = 44 }) {
  const name = formatDisplayName(profile, "F");
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-founder-600 to-founder-800 font-serif font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt="" width={size} height={size} className="h-full w-full object-cover" unoptimized />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export function GroupChatProfileModal({ profile, viewerId, onClose }) {
  const router = useRouter();
  const isOwnProfile = profile?.id === viewerId;

  if (!profile) return null;

  const displayName = formatDisplayName(profile, "Founder Mitglied");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-founder-600">Mitglied</p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-slate-950">{displayName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-6 text-center">
          <div className="mx-auto">
            <ProfileAvatar profile={profile} size={72} />
          </div>
          <div className="mt-4 flex justify-center">
            <RankNobleBadge rank={profile.current_rank ?? "aspiring"} size="sm" />
          </div>
          {profile.username && <p className="mt-2 text-sm font-semibold text-slate-500">@{profile.username}</p>}
          {profile.bio?.trim() && <p className="mt-4 text-sm leading-6 text-slate-600">{profile.bio.trim()}</p>}
        </div>

        <div className="space-y-3 border-t border-slate-100 px-5 py-5">
          {!isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/inbox?to=${profile.id}`);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-founder-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-founder-700"
            >
              <MessageCircle className="h-4 w-4" />
              Nachricht senden
            </button>
          )}
          <Link
            href={`/members/${profile.id}`}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Vollständiges Profil
          </Link>
        </div>
      </div>
    </div>
  );
}
