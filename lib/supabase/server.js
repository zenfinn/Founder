import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl ?? "https://placeholder.supabase.co", supabaseAnonKey ?? "placeholder-anon-key", {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always mutate cookies; middleware/route handlers can.
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot always mutate cookies; middleware/route handlers can.
        }
      },
    },
  });
}
