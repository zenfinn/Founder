import { createClient } from "@supabase/supabase-js";

const viteEnv = import.meta.env ?? {};
const supabaseUrl = viteEnv.VITE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase: NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. Bitte in .env setzen."
  );
}

export const supabase = createClient(supabaseUrl ?? "https://placeholder.supabase.co", supabaseAnonKey ?? "placeholder-anon-key");
