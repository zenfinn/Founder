import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MentorOfferForm } from "@/components/MentorOfferForm";
import { ProfileAvatarWithRank } from "@/components/ProfileAvatarWithRank";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { buildOgImageUrl, buildPageMetadata } from "@/lib/seo";
import {
  formatMentorPricing,
  formatMentorSessionPrice,
  getMentorSessionPriceCents,
  getMentorSessionAvailability,
} from "@/lib/mentors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function generateMetadata({ params }) {
  const adminSupabase = createAdminSupabaseClient();
  const { data: mentor } = await adminSupabase
    .from("mentors")
    .select("name, bio, expertise_tags")
    .eq("id", params.id)
    .eq("is_approved", true)
    .maybeSingle();

  if (!mentor?.name) {
    return { title: { absolute: "Mentor nicht gefunden | Founder" }, robots: { index: false } };
  }

  const description =
    mentor.bio?.slice(0, 155) ||
    `Mentor finden Unternehmer: ${mentor.name} – verifizierter Coach bei Founder Community Deutschland.`;

  return buildPageMetadata({
    path: `/mentoren/${params.id}`,
    title: `${mentor.name} | Mentor bei Founder Community`,
    description,
    ogImage: buildOgImageUrl({ title: mentor.name, subtitle: "Verifizierter Mentor · Founder" }),
  });
}

export default async function MentorProfilePage({ params }) {
  const adminSupabase = createAdminSupabaseClient();
  const { data: mentor } = await adminSupabase
    .from("mentors")
    .select("id,name,bio,experience,expertise_tags,monthly_rate_cents,hourly_rate_cents,sessions_per_month,rating,user_id")
    .eq("id", params.id)
    .eq("is_approved", true)
    .maybeSingle();

  if (!mentor) {
    notFound();
  }

  const availability = await getMentorSessionAvailability(adminSupabase, mentor);
  const sessionPriceCents = getMentorSessionPriceCents(mentor);

  const { data: similarMentors } = await adminSupabase
    .from("mentors")
    .select("id, name, monthly_rate_cents, hourly_rate_cents, sessions_per_month, expertise_tags")
    .eq("is_approved", true)
    .neq("id", mentor.id)
    .limit(3);

  const { data: profile } = mentor.user_id
    ? await adminSupabase
        .from("profiles")
        .select("avatar_url,current_rank,display_name,username")
        .eq("id", mentor.user_id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/mentoren" />
      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
            <Link href="/mentoren" className="text-sm font-bold text-founder-600">
              Zurück zu Mentoren
            </Link>
            <div className="mt-6">
              <ProfileAvatarWithRank
                profile={{
                  avatar_url: profile?.avatar_url ?? "",
                  current_rank: profile?.current_rank ?? "builder",
                  display_name: mentor.name,
                  email: mentor.name,
                }}
                size="lg"
              />
            </div>
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-tight text-slate-950">{mentor.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {(mentor.expertise_tags ?? []).map((tag) => (
                <span key={tag} className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">
                  {tag}
                </span>
              ))}
            </div>

            {mentor.bio && (
              <>
                <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Bio</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{mentor.bio}</p>
              </>
            )}

            {mentor.experience && (
              <>
                <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Erfahrung</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{mentor.experience}</p>
              </>
            )}
          </article>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Buchung</p>
            <p className="mt-3 font-serif text-4xl font-bold text-slate-950">{formatMentorPricing(mentor)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {availability.remaining} von {availability.sessionsPerMonth} Sessions diesen Monat verfügbar
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Buche eine 60-Minuten-Session per Stripe ({formatMentorSessionPrice(mentor)} pro Session). Founder erfasst
              15% Plattform-Provision für die Abrechnung.
            </p>
            {availability.isSoldOut ? (
              <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Dieser Mentor ist für diesen Monat ausgebucht. Schau nächsten Monat wieder vorbei.
              </p>
            ) : (
              <StripeCheckoutButton
                payload={{
                  type: "mentor_booking",
                  mentor_id: mentor.id,
                  title: mentor.name,
                  amount_cents: sessionPriceCents,
                  starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  cancel_path: `/mentoren/${mentor.id}`,
                }}
                className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white"
              >
                Session buchen ({formatMentorSessionPrice(mentor)})
              </StripeCheckoutButton>
            )}
          </aside>
        </div>

        {(similarMentors ?? []).length > 0 && (
          <aside className="mx-auto mt-8 max-w-6xl rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="font-serif text-2xl font-bold text-slate-950">Ähnliche Mentoren</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {similarMentors.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/mentoren/${item.id}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-founder-200 hover:bg-founder-50"
                  >
                    <p className="font-bold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold text-founder-600">{formatMentorPricing(item)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <MentorOfferForm />
      </section>
    </main>
  );
}
