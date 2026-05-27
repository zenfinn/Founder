"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RankBadge } from "@/components/RankBadge";
import { ProfileAvatarWithRank } from "@/components/ProfileAvatarWithRank";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events";
import {
  MAX_PROFILE_BIO_LENGTH,
  MAX_PROFILE_INTERESTS,
  PROFILE_INTEREST_OPTIONS,
  normalizeProfileInterests,
  truncateProfileBio,
} from "@/lib/profile-interests";
import {
  emptyOwnProfile,
  getOwnProfile,
  saveOwnProfile,
} from "@/lib/profiles";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ProfileEditor() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState(emptyOwnProfile());
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }

      setUserId(sessionData.session.user.id);

      try {
        const data = await getOwnProfile(supabase, sessionData.session.user.id);
        setProfile(data);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadProfile();
  }, [router, supabase]);

  async function handleUploadAvatar(file) {
    if (!file || !userId) return;
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Avatar-Upload fehlgeschlagen.");
      }

      setProfile({ ...emptyOwnProfile(), ...result.profile });
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
      setMessage("Avatar gespeichert.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const saved = await saveOwnProfile(supabase, userId, {
        ...profile,
        bio: truncateProfileBio(profile.bio ?? ""),
        interests: normalizeProfileInterests(profile.interests ?? []),
      });
      setProfile(saved);
      window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
      setMessage("Profil gespeichert.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleInterest(interest) {
    setProfile((current) => {
      const selected = normalizeProfileInterests(current.interests ?? []);
      if (selected.includes(interest)) {
        return { ...current, interests: selected.filter((item) => item !== interest) };
      }
      if (selected.length >= MAX_PROFILE_INTERESTS) {
        setMessage(`Maximal ${MAX_PROFILE_INTERESTS} Interessen auswählbar.`);
        return current;
      }
      return { ...current, interests: [...selected, interest] };
    });
  }

  const selectedInterests = normalizeProfileInterests(profile.interests ?? []);
  const bioLength = (profile.bio ?? "").length;

  return (
    <form onSubmit={saveProfile} className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <ProfileAvatarWithRank profile={profile} href="/profile" size="lg" />
        <label className="mt-5 block">
          <span className="text-sm font-bold text-slate-700">Avatar hochladen</span>
          <input
            className="mt-2 block w-full text-sm"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(event) => handleUploadAvatar(event.target.files?.[0])}
          />
        </label>
        {message && (
          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              message.includes("gespeichert") ? "bg-founder-50 text-founder-800" : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}
        <div className="mt-5">
          <RankBadge rank={profile.current_rank} prefix="" />
          <p className="mt-3 text-sm font-semibold text-emerald-700">Verified Badge</p>
          <p className="mt-2 text-sm text-slate-500">
            Mitglied seit{" "}
            {profile.trial_started_at
              ? new Date(profile.trial_started_at).toLocaleDateString("de-DE")
              : "heute"}
          </p>
        </div>
      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["display_name", "Name"],
            ["username", "Username"],
            ["company_name", "Unternehmensname"],
            ["industry", "Branche"],
          ].map(([key, label]) => (
            <label key={key}>
              <span className="text-sm font-bold text-slate-700">{label}</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={profile[key] ?? ""}
                onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
              />
            </label>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-slate-700">Über mich</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={profile.bio ?? ""}
            maxLength={MAX_PROFILE_BIO_LENGTH}
            onChange={(event) => setProfile({ ...profile, bio: event.target.value.slice(0, MAX_PROFILE_BIO_LENGTH) })}
            placeholder="Kurz wer du bist und woran du arbeitest..."
          />
          <span className="mt-1 block text-right text-xs font-semibold text-slate-400">
            {bioLength}/{MAX_PROFILE_BIO_LENGTH}
          </span>
        </label>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-700">Interessen</span>
            <span className="text-xs font-semibold text-slate-400">
              {selectedInterests.length}/{MAX_PROFILE_INTERESTS}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROFILE_INTEREST_OPTIONS.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-founder-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-founder-200 hover:bg-founder-50"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["instagram_url", "Instagram URL"],
            ["tiktok_url", "TikTok URL"],
            ["linkedin_url", "LinkedIn URL"],
            ["website_url", "Website URL"],
            ["twitter_url", "Twitter/X URL"],
          ].map(([key, label]) => (
            <label key={key}>
              <span className="text-sm font-bold text-slate-700">{label}</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                type="url"
                placeholder="https://..."
                value={profile[key] ?? ""}
                onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
              />
            </label>
          ))}
        </div>
        {message && (
          <p
            className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              message.includes("gespeichert") ? "bg-founder-50 text-founder-800" : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}
        <button
          className="mt-5 rounded-2xl bg-founder-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          type="submit"
          disabled={saving || uploading}
        >
          {saving ? "Speichert..." : "Profil speichern"}
        </button>
      </section>
    </form>
  );
}
