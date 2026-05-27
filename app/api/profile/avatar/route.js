import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { saveOwnAvatar, uploadAvatarBytes } from "@/lib/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Bitte logge dich erneut ein." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Keine Bilddatei erhalten." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || "avatar.jpg";
    const contentType = file.type?.startsWith("image/") ? file.type : "image/jpeg";

    let avatarUrl;

    try {
      avatarUrl = await uploadAvatarBytes(supabase, user.id, { bytes, fileName, contentType });
    } catch (userUploadError) {
      try {
        const admin = createAdminSupabaseClient();
        avatarUrl = await uploadAvatarBytes(admin, user.id, { bytes, fileName, contentType }, { skipAuthCheck: true });
      } catch (adminUploadError) {
        throw userUploadError;
      }
    }

    let profile;

    try {
      profile = await saveOwnAvatar(supabase, user.id, avatarUrl);
    } catch {
      const admin = createAdminSupabaseClient();
      profile = await saveOwnAvatar(admin, user.id, avatarUrl);
    }

    return NextResponse.json({ profile: { ...profile, avatar_url: avatarUrl } });
  } catch (error) {
    return NextResponse.json({ error: error.message ?? "Avatar-Upload fehlgeschlagen." }, { status: 400 });
  }
}
