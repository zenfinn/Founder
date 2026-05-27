import { AppHeader } from "@/components/AppHeader";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const typeLabels = {
  chat_message: "Chat",
  event_reminder: "Event",
  verification: "Verifikation",
  mentor_booking: "Mentor",
  message_request: "Nachricht",
  referral: "Referral",
};

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,link_url,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/notifications" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Notifications</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">Benachrichtigungen.</h1>
          {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error.message}</p>}
          <div className="mt-8 space-y-3">
            {(notifications ?? []).map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <span className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">
                  {typeLabels[item.type] ?? item.type}
                </span>
                <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                <p className="mt-3 text-xs font-semibold text-slate-400">
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}
                </p>
              </article>
            ))}
            {!error && (notifications ?? []).length === 0 && (
              <p className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600">
                Noch keine Benachrichtigungen vorhanden.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
