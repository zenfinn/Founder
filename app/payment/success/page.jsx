import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { createStripeClient } from "@/lib/stripe";
import { CheckCircle, Sparkles } from "lucide-react";

export const metadata = {
  title: "Zahlung erfolgreich",
  description: "Deine Founder Zahlung wurde erfolgreich bestätigt.",
};

async function getCheckoutSession(sessionId) {
  if (!sessionId) return null;

  try {
    const stripe = createStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Stripe success session lookup failed", error);
    return null;
  }
}

export default async function PaymentSuccessPage({ searchParams }) {
  const session = await getCheckoutSession(searchParams?.session_id);
  const displayName = session?.customer_details?.name ?? session?.customer_details?.email ?? "Founder";
  const type = session?.metadata?.type ?? searchParams?.type ?? "founder_pro";
  const title = session?.metadata?.title ?? searchParams?.title;
  const copy =
    type === "event_ticket"
      ? {
          badge: "Ticket bestätigt",
          headline: "Dein Event-Ticket ist bestätigt.",
          body: `Willkommen, ${displayName}. Deine Buchung${title ? ` für "${title}"` : ""} wurde gespeichert und bestätigt.`,
        }
      : type === "mentor_booking"
        ? {
            badge: "Buchung bestätigt",
            headline: "Deine Mentor-Session ist bestätigt.",
            body: `Willkommen, ${displayName}. Deine Mentor-Buchung${title ? ` mit ${title}` : ""} wurde bezahlt und gespeichert.`,
          }
        : {
            badge: "Founder Pro aktiviert",
            headline: "Founder Pro ist jetzt aktiv.",
            body: `Willkommen, ${displayName}. Deine Stripe-Zahlung wurde bestätigt. Der Webhook schaltet deinen Pro-Zugang in deinem Profil frei; in der Regel ist das innerhalb weniger Sekunden sichtbar.`,
          };

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/dashboard" />
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-2xl shadow-emerald-950/5">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-founder-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-founder-700">
            <Sparkles className="h-4 w-4" />
            {copy.badge}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-bold text-slate-950">{copy.headline}</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">{copy.body}</p>
          <Link href="/dashboard" className="mt-8 inline-flex rounded-2xl bg-founder-600 px-6 py-4 text-sm font-bold text-white">
            Zum Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
