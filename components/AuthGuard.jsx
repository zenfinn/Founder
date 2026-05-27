"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthGuard({ children, adminOnly = false }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (adminOnly) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("system_role")
          .eq("id", data.session.user.id)
          .maybeSingle();

        const isSystemAdmin = profile?.system_role === "owner" || profile?.system_role === "admin";

        if (!isSystemAdmin) {
          const { data: admin } = await supabase
            .from("founder_admins")
            .select("user_id")
            .eq("user_id", data.session.user.id)
            .maybeSingle();
          if (!admin) {
            router.replace("/dashboard");
            return;
          }
        }
      }

      setAllowed(true);
    }

    checkAuth();
  }, [adminOnly, router, supabase]);

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm font-semibold text-slate-600">Zugriff wird geprüft...</main>;
  }

  return children;
}
