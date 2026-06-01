import { NextResponse } from "next/server";
import { canPostShowcase } from "@/lib/showcases";
import { getOwnProfile } from "@/lib/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Bitte logge dich ein." }, { status: 401 });
  }

  const profile = await getOwnProfile(supabase, user.id);
  if (!canPostShowcase(profile?.current_rank ?? "aspiring")) {
    return NextResponse.json({ error: "Ab Starter-Rang kannst du Showcases posten." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Keine Bilddatei erhalten." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const contentType = file.type?.startsWith("image/") ? file.type : "image/jpeg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const admin = createAdminSupabaseClient();
  const { error: uploadError } = await admin.storage.from("showcase-images").upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data } = admin.storage.from("showcase-images").getPublicUrl(path);
  return NextResponse.json({ image_url: data.publicUrl });
}
