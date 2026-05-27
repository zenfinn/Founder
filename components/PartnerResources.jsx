"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { partnerResources } from "@/lib/founder-data";
import { getOwnProfile } from "@/lib/profiles";
import { ProResourcesGate } from "@/components/ProResourcesGate";

const categoryStyles = {
  Reselling: "bg-amber-50 text-amber-700",
  Dropshipping: "bg-blue-50 text-blue-700",
  TikTok: "bg-fuchsia-50 text-fuchsia-700",
  "E-Commerce": "bg-indigo-50 text-indigo-700",
};

export function PartnerResources() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [partners, setPartners] = useState(partnerResources);
  const [profile, setProfile] = useState(null);

  async function trackClick(partner) {
    const { data } = await supabase.auth.getSession();
    await supabase.from("resource_clicks").insert({
      resource_id: partner.id,
      user_id: data.session?.user?.id ?? null,
      target_url: partner.external_url,
    });
  }

  useEffect(() => {
    async function loadPartners() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        setProfile(await getOwnProfile(supabase, user.id));
      }

      const { data, error } = await supabase
        .from("partner_resources")
        .select("id,name,description,category,external_url,logo_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        setPartners(data);
      }
    }

    loadPartners();
  }, [supabase]);

  return (
    <ProResourcesGate profile={profile}>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {partners.map((partner) => (
          <article key={partner.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-founder-50 font-serif text-2xl font-bold text-founder-600">
              {partner.logo_url ? "Logo" : partner.name.charAt(0)}
            </div>
            <span
              className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                categoryStyles[partner.category] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {partner.category}
            </span>
            <h2 className="mt-4 font-serif text-2xl font-bold text-slate-950">{partner.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{partner.description}</p>
            <a
              href={partner.external_url}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackClick(partner)}
              className="mt-6 block rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-founder-700"
            >
              Partner öffnen
            </a>
          </article>
        ))}
        <Link
          href="/admin/partners"
          className="rounded-[1.5rem] border border-dashed border-founder-200 bg-founder-50 p-5 text-founder-800"
        >
          <p className="text-sm font-bold uppercase tracking-[0.18em]">Admin</p>
          <h2 className="mt-4 font-serif text-2xl font-bold">Partner verwalten</h2>
          <p className="mt-3 text-sm leading-6">Neue Partner anlegen, Kategorien pflegen und Ressourcen aktivieren.</p>
        </Link>
      </div>
    </ProResourcesGate>
  );
}
