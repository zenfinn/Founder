"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ProfileAvatarWithRank } from "@/components/ProfileAvatarWithRank";

function formatRate(cents = 0) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100) + "/h";
}

export function MentorsList() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMentors() {
      const { data, error } = await supabase
        .from("mentors")
        .select("id,name,bio,experience,expertise_tags,hourly_rate_cents,rating,user_id")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        const userIds = data.map((mentor) => mentor.user_id).filter(Boolean);
        const { data: profiles } = userIds.length
          ? await supabase.from("profiles").select("id,avatar_url,current_rank,display_name,username").in("id", userIds)
          : { data: [] };

        setMentors(
          data.map((mentor) => ({
            ...mentor,
            profile: profiles?.find((profile) => profile.id === mentor.user_id) ?? null,
          }))
        );
      } else {
        setMentors([]);
      }

      setLoading(false);
    }

    loadMentors();
  }, [supabase]);

  if (loading) {
    return (
      <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500">
        Mentoren werden geladen...
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Noch keine Mentoren live</p>
        <h2 className="mt-3 font-serif text-3xl font-bold text-slate-950">Wir suchen die ersten Mentoren</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Die Mentor-Liste wird gerade aufgebaut. Wenn du Builder-Rang oder höher hast, bewirb dich unten als Mentor.
        </p>
        <a
          href="#apply"
          className="mt-6 inline-flex rounded-2xl bg-founder-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-founder-700"
        >
          Als Mentor bewerben
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {mentors.map((mentor) => (
        <article key={mentor.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
          <ProfileAvatarWithRank
            profile={{
              avatar_url: mentor.profile?.avatar_url ?? "",
              current_rank: mentor.profile?.current_rank ?? "builder",
              display_name: mentor.name,
              email: mentor.profile?.display_name ?? mentor.name,
            }}
            href={`/mentoren/${mentor.id}`}
            size="lg"
          />
          <h2 className="mt-5 font-serif text-2xl font-bold text-slate-950">{mentor.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(mentor.expertise_tags ?? []).slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-founder-50 px-3 py-1 text-xs font-bold text-founder-700">
                {tag}
              </span>
            ))}
          </div>
          {mentor.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{mentor.bio}</p>}
          <p className="mt-4 text-sm font-bold text-founder-600">{formatRate(mentor.hourly_rate_cents)}</p>
          <Link
            href={`/mentoren/${mentor.id}`}
            className="mt-6 block rounded-2xl bg-founder-600 px-5 py-3 text-center text-sm font-bold text-white"
          >
            Profil ansehen
          </Link>
        </article>
      ))}
    </div>
  );
}
