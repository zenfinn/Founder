import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
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
    <main className="min-h-screen bg-slate-50">
      <AppHeader active="/inbox" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Chats</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">Deine Nachrichten.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Aktive Chats und neue Anfragen an einem Ort. Basic-Mitglieder können bis zu 3 Anfragen pro Tag senden.
          </p>
          <div className="mt-8">
            <Suspense
              fallback={
                <p className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">
                  Chats werden geladen...
                </p>
              }
            >
              <InboxView />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
