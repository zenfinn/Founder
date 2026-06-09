import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getWaitlistTotal, isValidWaitlistEmail, WAITLIST_MAX, WAITLIST_SEED_COUNT } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

async function getRealSignupCount(admin) {
  const { count, error } = await admin
    .from("waitlist_signups")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

function buildPayload(realCount) {
  const total = getWaitlistTotal(realCount);
  return {
    total,
    max: WAITLIST_MAX,
    seed: WAITLIST_SEED_COUNT,
    real: realCount,
    remaining: Math.max(0, WAITLIST_MAX - total),
    progress: Math.min(100, Math.round((total / WAITLIST_MAX) * 100)),
  };
}

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();
    const realCount = await getRealSignupCount(admin);
    return NextResponse.json(buildPayload(realCount));
  } catch (error) {
    console.error("GET /api/waitlist", error);
    return NextResponse.json(buildPayload(0));
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!isValidWaitlistEmail(email)) {
      return NextResponse.json({ error: "Bitte gib eine gültige E-Mail ein." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const realCountBefore = await getRealSignupCount(admin);

    if (getWaitlistTotal(realCountBefore) >= WAITLIST_MAX) {
      return NextResponse.json({ error: "Die Waitlist ist voll. Bald geht es los." }, { status: 409 });
    }

    const { error: insertError } = await admin.from("waitlist_signups").insert({ email });

    if (insertError) {
      if (insertError.code === "23505") {
        const realCount = await getRealSignupCount(admin);
        return NextResponse.json({
          ...buildPayload(realCount),
          alreadyJoined: true,
          message: "Du stehst bereits auf der Waitlist.",
        });
      }
      throw insertError;
    }

    const realCount = await getRealSignupCount(admin);
    return NextResponse.json({
      ...buildPayload(realCount),
      message: "Du bist auf der Waitlist. Wir melden uns.",
    });
  } catch (error) {
    console.error("POST /api/waitlist", error);
    return NextResponse.json({ error: error.message ?? "Waitlist-Anmeldung fehlgeschlagen." }, { status: 500 });
  }
}
