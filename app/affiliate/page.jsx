import { AppHeader } from "@/components/AppHeader";
import { ReferralLinkCopy } from "@/components/ReferralLinkCopy";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureAffiliateForUser, formatEuroFromCents, FOUNDER_PRO_REFERRAL_RATE } from "@/lib/referrals";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function AffiliatePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const adminSupabase = createAdminSupabaseClient();
  const affiliate = await ensureAffiliateForUser(adminSupabase, session.user.id);

  const [{ data: referrals }, { data: commissions }] = await Promise.all([
    supabase.from("referrals").select("status,referred_user_id").eq("affiliate_id", affiliate.id),
    supabase
      .from("referral_commissions")
      .select("revenue_cents,commission_cents,created_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const registerLink = `${appUrl}/register?ref=${affiliate.referral_code}`;
  const proLink = `${appUrl}/dashboard?ref=${affiliate.referral_code}`;

  const referralRows = referrals ?? [];
  const commissionRows = commissions ?? [];
  const totalRevenueCents = commissionRows.reduce((sum, row) => sum + (row.revenue_cents ?? 0), 0);
  const totalCommissionCents = commissionRows.reduce((sum, row) => sum + (row.commission_cents ?? 0), 0);

  const stats = [
    { label: "Geworbene Nutzer", value: referralRows.filter((item) => item.referred_user_id).length.toString() },
    { label: "Pro-Abos (Umsatz)", value: formatEuroFromCents(totalRevenueCents) },
    { label: "Deine Provision", value: formatEuroFromCents(totalCommissionCents) },
    { label: "Provisionssatz", value: `${Math.round(FOUNDER_PRO_REFERRAL_RATE * 100)}%` },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/dashboard" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Founder Pro Referral</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Empfiehl Founder Pro.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Du erhältst {Math.round(FOUNDER_PRO_REFERRAL_RATE * 100)}% vom tatsächlich gezahlten Betrag – auch wenn dein
            Link mit Onboarding-Rabatt genutzt wird.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <ReferralLinkCopy label="Registrierungs-Link" href={registerLink} />
            <ReferralLinkCopy label="Founder Pro Link" href={proLink} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
                <h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">{stat.value}</h2>
              </article>
            ))}
          </div>

          {commissionRows.length > 0 && (
            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <h2 className="font-serif text-2xl font-bold text-slate-950">Letzte Provisionen</h2>
              <div className="mt-4 space-y-3">
                {commissionRows.slice(0, 8).map((row) => (
                  <div key={`${row.created_at}-${row.commission_cents}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600">
                      Umsatz {formatEuroFromCents(row.revenue_cents)}
                    </span>
                    <span className="font-bold text-founder-700">+{formatEuroFromCents(row.commission_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
