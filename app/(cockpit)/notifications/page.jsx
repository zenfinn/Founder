import { redirect } from "next/navigation";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    <CockpitPage eyebrow="Notifications" title="Benachrichtigungen">
      {error && (
        <CockpitPanel>
          <p className="text-sm font-semibold text-red-300">{error.message}</p>
        </CockpitPanel>
      )}
      <div className="space-y-3">
        {(notifications ?? []).map((item) => (
          <CockpitPanel key={item.id}>
            <span className="rounded-full border border-[#1a3aad]/40 px-3 py-1 text-xs font-bold text-[#5b8cff]">
              {typeLabels[item.type] ?? item.type}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-bold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">{item.body}</p>
            {item.link_url && (
              <a href={item.link_url} className="mt-4 inline-flex text-sm font-bold text-[#5b8cff] hover:underline">
                Öffnen →
              </a>
            )}
            <p className="mt-3 text-xs font-semibold text-neutral-500">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}
            </p>
          </CockpitPanel>
        ))}
        {!error && (notifications ?? []).length === 0 && (
          <CockpitPanel>
            <p className="text-sm font-semibold text-neutral-400">Noch keine Benachrichtigungen vorhanden.</p>
          </CockpitPanel>
        )}
      </div>
    </CockpitPage>
  );
}
