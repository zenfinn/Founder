import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { InboxView } from "@/components/inbox/InboxView";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Chats",
  description: "Private Nachrichten und Nachrichtenanfragen.",
};

export default async function InboxPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <CockpitPage
      eyebrow="Chats"
      title="Deine Nachrichten"
      description="Aktive Chats und neue Anfragen an einem Ort. Basic-Mitglieder können bis zu 3 Anfragen pro Tag senden."
    >
      <CockpitPanel>
        <Suspense
          fallback={<p className="text-sm font-semibold text-neutral-400">Chats werden geladen…</p>}
        >
          <InboxView />
        </Suspense>
      </CockpitPanel>
    </CockpitPage>
  );
}
