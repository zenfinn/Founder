import Link from "next/link";
import Image from "next/image";
import { AppHeader } from "@/components/AppHeader";
import { MentorOfferForm } from "@/components/MentorOfferForm";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import { groupMentors } from "@/lib/founder-data";

function Stars({ rating }) {
  return <span className="text-sm font-bold text-amber-600">{"★".repeat(Math.round(rating))} {rating.toFixed(1)}</span>;
}

export default function MentorProfilePage({ params }) {
  const mentor = groupMentors.find((item) => item.id === params.id) ?? groupMentors[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/mentoren" />
      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8">
            <Link href="/mentoren" className="text-sm font-bold text-founder-600">Zurück zu Mentoren</Link>
            <div className="relative mt-6 h-24 w-24 overflow-hidden rounded-3xl bg-founder-600">
              <Image src={mentor.avatar_url} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-tight text-slate-950">{mentor.name}</h1>
            <p className="mt-3"><Stars rating={mentor.rating} /></p>
            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">{tag}</span>
              ))}
            </div>

            <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Bio</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{mentor.bio}</p>

            <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Erfahrung</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{mentor.experience}</p>

            <h2 className="mt-10 font-serif text-3xl font-bold text-slate-950">Bewertungen</h2>
            <div className="mt-4 space-y-3">
              {mentor.reviews.map((review) => (
                <p key={review} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{review}</p>
              ))}
            </div>
          </article>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Buchung</p>
            <p className="mt-3 font-serif text-4xl font-bold text-slate-950">{mentor.hourly_rate}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Buche eine 60-Minuten-Session per Stripe. Founder erfasst 15% Plattform-Provision für die Abrechnung.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {["Mo 10:00", "Di 14:00", "Mi 16:00", "Fr 09:00"].map((slot) => (
                <button key={slot} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700" type="button">
                  {slot}
                </button>
              ))}
            </div>
            <StripeCheckoutButton
              payload={{
                type: "mentor_booking",
                mentor_id: mentor.id,
                title: mentor.name,
                amount_cents: mentor.hourly_rate_cents,
                starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_path: `/mentoren/${mentor.id}`,
              }}
              className="mt-6 w-full rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white"
            >
              Via Stripe buchen
            </StripeCheckoutButton>
          </aside>
        </div>
        <MentorOfferForm />
      </section>
    </main>
  );
}
