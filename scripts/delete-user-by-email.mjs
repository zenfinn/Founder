import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node scripts/delete-user-by-email.mjs <email>");
  process.exit(1);
}

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional file
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listData, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

const user = listData.users.find((entry) => entry.email?.toLowerCase() === email);

if (!user) {
  console.log(`No auth user found for ${email}`);
  process.exit(0);
}

const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

if (deleteError) {
  console.error("deleteUser failed:", deleteError.message);
  process.exit(1);
}

console.log(`Deleted user ${email} (${user.id})`);
