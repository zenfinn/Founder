import {
  normalizeProfileInterests,
  truncateProfileBio,
  validateProfileBio,
  validateProfileInterests,
} from "@/lib/profile-interests";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

export const OWN_PROFILE_SELECT =
  "display_name,username,company_name,industry,bio,interests,avatar_url,instagram_url,tiktok_url,linkedin_url,website_url,twitter_url,current_rank,system_role,founder_pro,plan,trial_started_at,updated_at";

const NULLABLE_TEXT_FIELDS = [
  "username",
  "company_name",
  "industry",
  "bio",
  "avatar_url",
  "instagram_url",
  "tiktok_url",
  "linkedin_url",
  "website_url",
  "twitter_url",
];

export function getProfileInitial(profile) {
  const name = profile?.display_name?.trim();
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

export function emptyOwnProfile() {
  return {
    display_name: "",
    username: "",
    company_name: "",
    industry: "",
    bio: "",
    interests: [],
    avatar_url: "",
    instagram_url: "",
    tiktok_url: "",
    linkedin_url: "",
    website_url: "",
    twitter_url: "",
    current_rank: "aspiring",
    system_role: "member",
    founder_pro: false,
    plan: null,
    trial_started_at: null,
    updated_at: null,
  };
}

export function sanitizeProfilePayload(profile) {
  const bioError = validateProfileBio(profile.bio ?? "");
  if (bioError) throw new Error(bioError);

  const interests = normalizeProfileInterests(profile.interests ?? []);
  const interestsError = validateProfileInterests(interests);
  if (interestsError) throw new Error(interestsError);

  const payload = {};

  payload.display_name = profile.display_name?.trim() || null;
  payload.bio = truncateProfileBio(profile.bio?.trim() ?? "") || null;
  payload.interests = interests;

  for (const key of NULLABLE_TEXT_FIELDS) {
    if (key === "bio") continue;
    const value = profile[key]?.trim?.() ?? profile[key];
    payload[key] = value ? value : null;
  }

  if (payload.username) {
    payload.username = payload.username.toLowerCase();
  }

  return payload;
}

export async function getOwnProfile(supabase, userId) {
  const { data, error } = await supabase.from("profiles").select(OWN_PROFILE_SELECT).eq("id", userId).maybeSingle();

  if (error) throw error;
  return data ? { ...emptyOwnProfile(), ...data } : emptyOwnProfile();
}

export async function saveOwnProfile(supabase, userId, profile) {
  const payload = {
    ...sanitizeProfilePayload(profile),
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();

  if (readError) throw readError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(OWN_PROFILE_SELECT)
      .single();

    if (error) throw error;
    return { ...emptyOwnProfile(), ...data };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, ...payload })
    .select(OWN_PROFILE_SELECT)
    .single();

  if (error) throw error;
  return { ...emptyOwnProfile(), ...data };
}

export async function saveOwnAvatar(supabase, userId, avatarUrl) {
  const updatedAt = new Date().toISOString();
  const { data: existing, error: readError } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();

  if (readError) throw readError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: updatedAt })
      .eq("id", userId)
      .select(OWN_PROFILE_SELECT)
      .single();

    if (error) throw error;
    return { ...emptyOwnProfile(), ...data };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, avatar_url: avatarUrl, updated_at: updatedAt })
    .select(OWN_PROFILE_SELECT)
    .single();

  if (error) throw error;
  return { ...emptyOwnProfile(), ...data };
}

function getAvatarObjectPath(userId, fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const allowed = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
  const safeExt = allowed.has(ext) ? ext : "jpg";
  return `${userId}/avatar.${safeExt}`;
}

function buildAvatarPublicUrl(supabase, path) {
  const { data: urlData } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(path);
  return `${urlData.publicUrl}?v=${Date.now()}`;
}

export async function uploadAvatarBytes(
  supabase,
  userId,
  { bytes, fileName, contentType },
  { skipAuthCheck = false } = {},
) {
  if (!bytes?.length) {
    throw new Error("Bitte wähle eine Bilddatei aus.");
  }

  if (bytes.length > 5 * 1024 * 1024) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  if (!skipAuthCheck) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      throw new Error("Bitte logge dich erneut ein.");
    }
  }

  const path = getAvatarObjectPath(userId, fileName);
  const mimeType = contentType?.startsWith("image/") ? contentType : "image/jpeg";

  let uploadError = null;

  ({ error: uploadError } = await supabase.storage.from(PROFILE_AVATAR_BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: mimeType,
    cacheControl: "3600",
  }));

  if (uploadError) {
    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([path]);
    ({ error: uploadError } = await supabase.storage.from(PROFILE_AVATAR_BUCKET).upload(path, bytes, {
      upsert: false,
      contentType: mimeType,
      cacheControl: "3600",
    }));
  }

  if (uploadError) {
    throw uploadError;
  }

  return buildAvatarPublicUrl(supabase, path);
}

export async function uploadOwnAvatar(supabase, userId, file) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const avatarUrl = await uploadAvatarBytes(supabase, userId, {
    bytes,
    fileName: file.name || "avatar.jpg",
    contentType: file.type || "image/jpeg",
  });

  const saved = await saveOwnAvatar(supabase, userId, avatarUrl);
  return { ...emptyOwnProfile(), ...saved, avatar_url: avatarUrl };
}
