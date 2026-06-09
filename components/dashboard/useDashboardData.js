"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  ensureGlobalLoungeMembership,
  fetchGlobalLoungeGroup,
  FOUNDER_LOUNGE_FALLBACK,
} from "@/lib/dashboard-lounge";
import { getAllApprovedResources, getUserCommunities, getUserMentorBookings, getUserSubgroups } from "@/lib/groups";
import { getOwnProfile } from "@/lib/profiles";
import { filterResourcesForMembership } from "@/lib/membership";

const fallbackPosts = [
  {
    id: "fallback-1",
    author: "Sarah Keller",
    avatarUrl: "",
    rank: "scaler",
    text: "Neuer E-Commerce Workshop ist live. Fokus: Retention und Operations.",
  },
  {
    id: "fallback-2",
    author: "Murat Aydin",
    avatarUrl: "",
    rank: "builder",
    text: "TikTok Creator Funnel Checkliste wurde in Ressourcen ergänzt.",
  },
  {
    id: "fallback-3",
    author: "Leon Hartmann",
    avatarUrl: "",
    rank: "starter",
    text: "Reselling Sourcing Call findet am Freitag statt.",
  },
];

export function useDashboardData() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("Nicht gestartet");
  const [posts, setPosts] = useState(fallbackPosts);
  const [communities, setCommunities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [loungeGroup, setLoungeGroup] = useState(FOUNDER_LOUNGE_FALLBACK);
  const [resourcePreview, setResourcePreview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

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

      await ensureGlobalLoungeMembership(supabase, user.id);
      const resolvedLounge = (await fetchGlobalLoungeGroup(supabase)) ?? FOUNDER_LOUNGE_FALLBACK;
      setLoungeGroup(resolvedLounge);

      const memberGroupIds = communityRows.map((group) => group.id);
      const allResources = await getAllApprovedResources(supabase);
      const visibleResources = filterResourcesForMembership(allResources, memberGroupIds, profileData);
      setResourcePreview(visibleResources.slice(0, 4));

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

      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  return {
    profile,
    userId,
    verificationStatus,
    posts,
    communities,
    mentors,
    subgroups,
    loungeGroup,
    resourcePreview,
    loading,
  };
}
