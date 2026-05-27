"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardOnboardingSteps } from "@/components/DashboardOnboardingSteps";
import { FeedAvatar } from "@/components/FeedAvatar";
import { RankBadge } from "@/components/RankBadge";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getUserCommunities, getUserMentorBookings, getUserSubgroups } from "@/lib/groups";
import { getOwnProfile } from "@/lib/profiles";
import { getProfileWelcomeName, isFounderPro } from "@/lib/membership";
import { sampleEvents } from "@/lib/founder-data";
import { Calendar, Layers3, MessageSquare, UserRound, Users } from "lucide-react";

const fallbackPosts = [
  { id: "fallback-1", author: "Sarah Keller", avatarUrl: "", rank: "scaler", text: "Neuer E-Commerce Workshop ist live. Fokus: Retention und Operations." },
  { id: "fallback-2", author: "Murat Aydin", avatarUrl: "", rank: "builder", text: "TikTok Creator Funnel Checkliste wurde in Ressourcen ergänzt." },
  { id: "fallback-3", author: "Leon Hartmann", avatarUrl: "", rank: "starter", text: "Reselling Sourcing Call findet am Freitag statt." },
];

function ChannelSection({ title, icon: Icon, emptyText, items }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2">
        <Icon className="h-4 w-4 text-founder-600" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      </div>
      <div className="mt-2 space-y-1">
        {items.length === 0 ? (
          <p className="rounded-xl px-4 py-3 text-xs font-semibold text-slate-400">{emptyText}</p>
        ) : (
          items.map((item) => (
            <Link key={item.key} href={item.href} className="group block rounded-xl px-4 py-3 transition hover:bg-slate-50">
              <p className="truncate text-sm font-bold text-slate-950">{item.label}</p>
              {item.meta && <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{item.meta}</p>}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function DashboardClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("Nicht gestartet");
  const [posts, setPosts] = useState(fallbackPosts);
  const [communities, setCommunities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [subgroups, setSubgroups] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      setUserId(user.id);
      const profileData = await getOwnProfile(supabase, user.id);
      setProfile(profileData);

      const { data: verification } = await supabase
        .from("verification_requests")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerificationStatus(verification?.status ?? "Nicht gestartet");

      const [communityRows, mentorRows, subgroupRows] = await Promise.all([
        getUserCommunities(supabase, user.id),
        getUserMentorBookings(supabase, user.id),
        getUserSubgroups(supabase, user.id),
      ]);
      setCommunities(communityRows);
      setMentors(mentorRows);
      setSubgroups(subgroupRows);

      const { data: feedPosts } = await supabase
        .from("posts")
        .select("id,content,created_at,author_id")
        .order("created_at", { ascending: false })
        .limit(3);

      if (feedPosts?.length) {
        const authorIds = [...new Set(feedPosts.map((post) => post.author_id))];
        const { data: authors } = await supabase
          .from("profiles")
          .select("id,display_name,username,current_rank,avatar_url")
          .in("id", authorIds);

        setPosts(
          feedPosts.map((post) => {
            const author = authors?.find((item) => item.id === post.author_id);
            return {
              id: post.id,
              author: author?.display_name ?? (author?.username ? `@${author.username}` : "Mitglied"),
              avatarUrl: author?.avatar_url ?? "",
              rank: author?.current_rank ?? "aspiring",
              text: post.content,
            };
          })
        );
      }
    }

    loadDashboard();
  }, [supabase]);

  const welcomeName = getProfileWelcomeName(profile);
  const currentRank = profile?.current_rank ?? "aspiring";
  const proMember = isFounderPro(profile);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#f7f8fb]">
        <AppHeader active="/dashboard" />
        <section className="px-4 py-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-4 shadow-sm shadow-slate-950/5 backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-founder-600">Founder Dashboard</p>
                <h1 className="mt-1 font-serif text-2xl font-bold text-slate-950">Willkommen zurück, {welcomeName}.</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                  {proMember ? "Founder Pro" : "Basic"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                  Verifikation: {verificationStatus}
                </span>
                <RankBadge rank={currentRank} />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
              <aside className="h-fit space-y-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Channels</p>

                <ChannelSection
                  title="Communities"
                  icon={Users}
                  emptyText="Noch keiner Community beigetreten."
                  items={communities.map((group) => ({
                    key: group.id,
                    href: `/community/${group.id}`,
                    label: group.name,
                    meta: group.category,
                  }))}
                />

                <ChannelSection
                  title="Mentoren"
                  icon={UserRound}
                  emptyText="Noch keine Mentor-Sessions gebucht."
                  items={mentors.map((booking) => ({
                    key: booking.id,
                    href: booking.mentor_key ? `/mentoren/${booking.mentor_key}` : "/mentoren",
                    label: booking.mentor_name ?? "Mentor Session",
                    meta: booking.status === "paid" ? "Gebucht" : booking.status,
                  }))}
                />

                <ChannelSection
                  title="Untergruppen"
                  icon={Layers3}
                  emptyText="Noch keiner Untergruppe beigetreten."
                  items={subgroups.map((subgroup) => ({
                    key: subgroup.id,
                    href: `/community/${subgroup.group_id}?tab=subgroups`,
                    label: subgroup.name,
                    meta: subgroup.group_name,
                  }))}
                />

                <Link href="/community" className="block rounded-xl px-4 py-3 text-sm font-bold text-founder-600 transition hover:bg-founder-50">
                  + Community entdecken
                </Link>
              </aside>

              <section className="min-h-[680px] rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-founder-600" />
                  <h2 className="font-serif text-3xl font-bold text-slate-950">Activity Feed</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">Live-Aktivität aus Community, Events und Mentoring.</p>
                <div className="mt-6 space-y-4">
                  {posts.map((post) => (
                    <article key={post.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 transition hover:border-founder-100 hover:bg-white">
                      <div className="flex items-start gap-4">
                        <FeedAvatar name={post.author} avatarUrl={post.avatarUrl} size={44} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-950">{post.author}</p>
                            <RankBadge rank={post.rank} prefix="" />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{post.text}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-5">
                <DashboardOnboardingSteps
                  userId={userId}
                  profile={profile}
                  verificationStatus={verificationStatus}
                  communitiesCount={communities.length}
                  subgroupsCount={subgroups.length}
                />

                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-founder-600" />
                    <h2 className="font-serif text-2xl font-bold text-slate-950">Kommende Events</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {sampleEvents.slice(0, 3).map((event) => (
                      <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl bg-slate-50 p-4 transition hover:bg-founder-50/50">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-founder-600">{event.category}</p>
                        <p className="mt-2 text-sm font-bold leading-5 text-slate-950">{event.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
