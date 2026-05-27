"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PublicProfileAvatar } from "@/components/public/PublicProfileAvatar";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { PublicSocialLinks } from "@/components/public/PublicSocialLinks";
import { MessageRequestForm } from "@/components/members/MessageRequestForm";
import { formatDisplayName } from "@/lib/public-profile";

function InterestTags({ interests = [] }) {
  if (!interests.length) return null;

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {interests.map((interest) => (
        <span key={interest} className="rounded-full bg-founder-50 px-3 py-1.5 text-xs font-bold text-founder-700">
          {interest}
        </span>
      ))}
    </div>
  );
}

export function MemberProfileView({ profile, viewerId, pendingRequest = null }) {
  const displayName = formatDisplayName(profile, profile.username ?? "founder");
  const isOwnProfile = viewerId === profile.id;

  const publicProfileHref = useMemo(() => {
    if (!profile.username || !profile.public_profile_enabled) return null;
    return `/u/${profile.username}`;
  }, [profile.public_profile_enabled, profile.username]);

  return (
    <article className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
      <PublicProfileAvatar profile={profile} displayName={displayName} size="xl" />

      <div className="mt-6 flex justify-center">
        <PublicRankBadge rank={profile.current_rank ?? "aspiring"} size="lg" />
      </div>

      <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight text-slate-950">{displayName}</h1>
      {profile.username && <p className="mt-2 text-slate-500">@{profile.username}</p>}

      {(profile.company_name || profile.industry) && (
        <div className="mt-4 space-y-1">
          {profile.company_name && <p className="text-lg font-semibold text-slate-800">{profile.company_name}</p>}
          {profile.industry && <p className="text-sm font-medium text-slate-500">{profile.industry}</p>}
        </div>
      )}

      {profile.bio?.trim() && (
        <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-slate-600">{profile.bio.trim()}</p>
      )}

      <InterestTags interests={profile.interests ?? []} />

      <div className="mt-8">
        <PublicSocialLinks profile={profile} />
      </div>

      {publicProfileHref && (
        <Link href={publicProfileHref} className="mt-6 inline-flex text-sm font-bold text-founder-600 hover:underline">
          Öffentliches Profil ansehen →
        </Link>
      )}

      {!isOwnProfile && (
        <div className="mt-10 border-t border-slate-100 pt-8 text-left">
          <MessageRequestForm recipientId={profile.id} recipientName={displayName} pendingRequest={pendingRequest} />
        </div>
      )}

      {isOwnProfile && (
        <Link
          href="/profile/edit"
          className="mt-10 inline-flex rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
        >
          Profil bearbeiten
        </Link>
      )}
    </article>
  );
}
