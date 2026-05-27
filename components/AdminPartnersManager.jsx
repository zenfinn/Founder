"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const emptyForm = {
  name: "",
  description: "",
  category: "Reselling",
  external_url: "",
};

export function AdminPartnersManager() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const loadPartners = useCallback(async () => {
    const { data, error } = await supabase
      .from("partner_resources")
      .select("id,name,description,category,external_url,is_active")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPartners(data ?? []);
  }, [supabase]);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
      await loadPartners();
    }

    boot();
  }, [loadPartners, router, supabase]);

  async function createPartner(event) {
    event.preventDefault();
    setMessage("");

    const { error } = await supabase.from("partner_resources").insert({
      ...form,
      created_by: userId,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm(emptyForm);
    await loadPartners();
  }

  async function togglePartner(partner) {
    const { error } = await supabase
      .from("partner_resources")
      .update({ is_active: !partner.is_active, updated_at: new Date().toISOString() })
      .eq("id", partner.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadPartners();
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={createPartner} className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <h2 className="font-serif text-2xl font-bold text-slate-950">Partner anlegen</h2>
        <div className="mt-5 space-y-4">
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
            placeholder="Beschreibung"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            <option>Reselling</option>
            <option>Dropshipping</option>
            <option>TikTok</option>
            <option>E-Commerce</option>
          </select>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-founder-600 focus:ring-4 focus:ring-founder-100"
            placeholder="Externer Link"
            type="url"
            value={form.external_url}
            onChange={(event) => setForm({ ...form, external_url: event.target.value })}
            required
          />
        </div>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <button className="mt-5 w-full rounded-2xl bg-founder-600 px-5 py-3 font-bold text-white" type="submit">
          Speichern
        </button>
      </form>

      <section className="space-y-3">
        {partners.map((partner) => (
          <article key={partner.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">{partner.category}</p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">{partner.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{partner.description}</p>
              </div>
              <button
                onClick={() => togglePartner(partner)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                type="button"
              >
                {partner.is_active ? "Deaktivieren" : "Aktivieren"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
