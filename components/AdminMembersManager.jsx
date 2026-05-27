"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const ranks = ["aspiring", "starter", "builder", "scaler", "elite"];

export function AdminMembersManager() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,username,company_name,industry,current_rank,founder_pro,is_banned,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMembers(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateMember(memberId, values) {
    const { error } = await supabase.from("profiles").update({ ...values, updated_at: new Date().toISOString() }).eq("id", memberId);
    if (error) {
      setMessage(error.message);
      return;
    }
    await load();
  }

  return (
    <section className="mt-8 space-y-3">
      {message && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>}
      {members.map((member) => (
        <article key={member.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">
                {member.founder_pro ? "Founder Pro" : "Free"} {member.is_banned ? "· Gesperrt" : ""}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-slate-950">
                {member.display_name || member.username || "Unbenanntes Mitglied"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{member.company_name || "Kein Unternehmen"} · {member.industry || "Keine Branche"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold"
                value={member.current_rank ?? "aspiring"}
                onChange={(event) => updateMember(member.id, { current_rank: event.target.value })}
              >
                {ranks.map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                type="button"
                onClick={() => updateMember(member.id, { is_banned: !member.is_banned })}
              >
                {member.is_banned ? "Entsperren" : "Sperren"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
