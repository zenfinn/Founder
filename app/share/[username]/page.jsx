import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { PublicRankBadge } from "@/components/public/PublicRankBadge";
import { getRankLabel } from "@/lib/founder-data";
import {
  createPublicSupabaseClient,
  fetchPublicProfile,
  formatDisplayName,
  getAppBaseUrl,
} from "@/lib/public-profile";

export async function generateMetadata({ params }) {
  const username = params.username;
  const supabase = createPublicSupabaseClient();
  const profile = await fetchPublicProfile(supabase, username);

  if (!profile) {
    return { title: "Share Card nicht gefunden" };
  }

  const displayName = formatDisplayName(profile, username);
  const rankLabel = getRankLabel(profile.current_rank ?? "aspiring");

  return {
    title: `${displayName} – Share Card`,
    description: `Ich bin verifizierter ${rankLabel} bei Founder 🇩🇪`,
    robots: { index: false, follow: false },
  };
}

export default async function ShareCardPage({ params }) {
  const username = params.username;
  const supabase = createPublicSupabaseClient();
  const profile = await fetchPublicProfile(supabase, username);

  if (!profile) notFound();

  const displayName = formatDisplayName(profile, username);
  const rank = profile.current_rank ?? "aspiring";
  const rankLabel = getRankLabel(rank);
  const profileUrl = `${getAppBaseUrl()}/u/${username}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=1a3aad&bgcolor=ffffff&data=${encodeURIComponent(profileUrl)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-founder-600 px-4 py-10">
      <article className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-founder-600 text-center text-white shadow-2xl">
        <div className="px-6 pt-8">
          <div className="flex justify-center [&_p]:text-white">
            <BrandMark />
          </div>

          <p className="mt-8 text-sm font-semibold leading-6 text-founder-100">
            Ich bin verifizierter {rankLabel} bei Founder 🇩🇪
          </p>

          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight">{displayName}</h1>

          {profile.company_name && <p className="mt-2 text-base font-semibold text-founder-100">{profile.company_name}</p>}

          <div className="mt-5 flex justify-center">
            <PublicRankBadge rank={rank} size="lg" />
          </div>
        </div>

        <div className="mx-auto mt-8 w-fit rounded-3xl bg-white p-4 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR-Code zu ${profileUrl}`} width={180} height={180} className="block" />
        </div>

        <p className="mt-6 px-6 text-sm font-medium text-founder-100">Scanne den Code für mein Founder Profil</p>

        <div className="mt-8 border-t border-founder-500/40 px-6 py-6">
          <Link href="/register" className="text-lg font-bold text-white underline decoration-white/40 underline-offset-4">
            Kostenlos beitreten
          </Link>
        </div>
      </article>
    </main>
  );
}
