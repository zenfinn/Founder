import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { BrandMark } from "@/components/BrandMark";
import { SEO } from "@/components/SEO";
import { PublicProfileAvatar } from "@/components/public/PublicProfileAvatar";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { PublicSocialLinks } from "@/components/public/PublicSocialLinks";
import { getRankLabel } from "@/lib/founder-data";
import { buildPersonSchema, buildProfileMetadata } from "@/lib/seo";
import {
  createPublicSupabaseClient,
  fetchProfilePostCount,
  fetchPublicProfile,
  formatDisplayName,
} from "@/lib/public-profile";


export async function generateMetadata({ params }) {
  const username = params.username;
  const supabase = createPublicSupabaseClient();
  const profile = await fetchPublicProfile(supabase, username);

  if (!profile) {
    return {
      title: { absolute: "Profil nicht gefunden | Founder" },
      description: "Dieses Founder Profil ist nicht öffentlich oder existiert nicht.",
      robots: { index: false, follow: false },
    };
  }

  return buildProfileMetadata(profile, username);
}

export default async function PublicProfilePage({ params }) {
  const username = params.username;
  const supabase = createPublicSupabaseClient();
  const profile = await fetchPublicProfile(supabase, username);

  if (!profile) notFound();

  const displayName = formatDisplayName(profile, username);
  const postCount = await fetchProfilePostCount(supabase, profile.id);
  const memberSince = profile.trial_started_at
    ? format(new Date(profile.trial_started_at), "MMMM yyyy", { locale: de })
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <SEO jsonLd={buildPersonSchema(profile, username)} />
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <Link href="/">
            <BrandMark />
          </Link>
        </div>
      </header>

      <section className="px-4 py-10 pb-16">
        <article className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10">
          <PublicProfileAvatar profile={profile} displayName={displayName} size="xl" />

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-founder-50 px-4 py-2 text-sm font-bold text-founder-700">
            <span aria-hidden="true">✓</span>
            Verifizierter {getRankLabel(profile.current_rank ?? "aspiring")} bei Founder 🇩🇪
          </p>

          <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{displayName}</h1>
          <p className="mt-2 text-slate-500">@{profile.username ?? username}</p>

          {(profile.company_name || profile.industry) && (
            <div className="mt-4 space-y-1">
              {profile.company_name && <p className="text-lg font-semibold text-slate-800">{profile.company_name}</p>}
              {profile.industry && <p className="text-sm font-medium text-slate-500">{profile.industry}</p>}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <PublicRankBadge rank={profile.current_rank ?? "aspiring"} size="lg" />
          </div>

          {profile.bio?.trim() && (
            <p className="mx-auto mt-8 max-w-lg text-base leading-7 text-slate-600">{profile.bio.trim()}</p>
          )}

          {(profile.interests ?? []).length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-founder-50 px-3 py-1.5 text-xs font-bold text-founder-700">
                  {interest}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <PublicSocialLinks profile={profile} />
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
            <div className="rounded-2xl bg-slate-50 px-4 py-5">
              <dt className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Mitglied seit</dt>
              <dd className="mt-2 text-lg font-bold text-slate-900">{memberSince ?? "—"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-5">
              <dt className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Community-Beiträge</dt>
              <dd className="mt-2 text-lg font-bold text-slate-900">{postCount}</dd>
            </div>
          </dl>

          <Link
            href="/register"
            className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-founder-600 px-6 py-4 text-base font-bold text-white transition hover:bg-founder-700 sm:w-auto sm:min-w-[280px]"
          >
            Bei Founder beitreten
          </Link>
        </article>
      </section>
    </main>
  );
}
