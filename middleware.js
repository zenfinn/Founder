import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const WAITLIST_ENABLED = process.env.WAITLIST_ENABLED !== "false";

function isBypassPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/waitlist") ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/api/og") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|js|html)$/.test(pathname)
  );
}

export async function middleware(request) {
  if (!WAITLIST_ENABLED || isBypassPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.system_role === "owner" || profile?.system_role === "admin") {
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return response;
    }
  }

  if (pathname === "/") {
    return response;
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
