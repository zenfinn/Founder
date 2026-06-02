import Link from "next/link";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
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
    <CockpitPage>
      <CockpitPanel className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30">
          <CheckCircle className="h-12 w-12 text-emerald-400" />
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#1a3aad]/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5b8cff]">
          <Sparkles className="h-4 w-4" />
          {copy.badge}
        </div>
        <h1 className="mt-5 font-serif text-4xl font-bold text-white">{copy.headline}</h1>
        <p className="mt-4 text-sm leading-6 text-neutral-400">{copy.body}</p>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-xl bg-[#1a3aad] px-6 py-4 text-sm font-bold text-white">
          Zum Dashboard
        </Link>
      </CockpitPanel>
    </CockpitPage>
  );
}
