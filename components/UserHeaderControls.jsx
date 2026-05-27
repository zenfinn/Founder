"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Link2,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  UserPen,
} from "lucide-react";
import { ProfileAvatarWithRank } from "@/components/ProfileAvatarWithRank";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events";
import { getOwnProfile } from "@/lib/profiles";

const settingsLinks = [
  { href: "/profile/edit", label: "Profil bearbeiten", Icon: UserPen, description: "Name, Avatar, Bio & Links" },
  { href: "/profile", label: "Profil anzeigen", Icon: User, description: "Dein öffentliches Profil" },
  { href: "/profile/verify", label: "Rang verifizieren", Icon: ShieldCheck, description: "Dokumente hochladen" },
  { href: "/profile/edit#referral", label: "Referral-Link", Icon: Link2, description: "Persönlichen Link generieren" },
  { href: "/notifications", label: "Benachrichtigungen", Icon: Bell, description: "Inbox & Alerts" },
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, description: "Deine Übersicht" },
];

export function UserHeaderControls({ variant = "app", onNavigate }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const menuRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadProfile(userId, email) {
      try {
        const data = await getOwnProfile(supabase, userId);
        setProfile({ ...data, email });
      } catch {
        setProfile({ email });
      }
    }

    async function boot() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        await loadProfile(sessionUser.id, sessionUser.email);
      } else {
        setProfile(null);
      }

      setLoading(false);
    }

    boot();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        loadProfile(sessionUser.id, sessionUser.email);
      } else {
        setProfile(null);
      }
    });

    function handleProfileUpdated() {
      supabase.auth.getSession().then(({ data }) => {
        const sessionUser = data.session?.user;
        if (sessionUser) {
          loadProfile(sessionUser.id, sessionUser.email);
        }
      });
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      subscription.subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    onNavigate?.();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function closeMenu() {
    setOpen(false);
    onNavigate?.();
  }

  if (loading) {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          onClick={onNavigate}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-founder-200 hover:text-founder-600"
        >
          Login
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className={`rounded-full px-4 py-2 text-sm font-bold text-white transition ${
            variant === "landing" ? "bg-founder-600 hover:bg-founder-700" : "bg-founder-600 hover:bg-founder-700"
          }`}
        >
          {variant === "landing" ? "Kostenlos starten" : "Kostenlos starten"}
        </Link>
      </div>
    );
  }

  const profileHref = profile?.username ? `/u/${profile.username}` : "/profile";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-founder-200 hover:text-founder-600"
          aria-label="Einstellungen"
          aria-expanded={open}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-founder-600">Einstellungen</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {profile?.display_name || profile?.username || user.email}
              </p>
            </div>
            <nav className="grid gap-0.5 p-2">
              {settingsLinks.map(({ href, label, Icon, description }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-founder-600" />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{label}</span>
                    <span className="block text-xs font-medium text-slate-500">{description}</span>
                  </span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>

      <ProfileAvatarWithRank profile={{ ...profile, email: user.email }} href={profileHref} />
    </div>
  );
}
