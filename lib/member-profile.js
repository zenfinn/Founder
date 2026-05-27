export const MEMBER_PROFILE_SELECT =
  "id,display_name,username,company_name,industry,bio,interests,avatar_url,current_rank,instagram_url,tiktok_url,linkedin_url,website_url,twitter_url,trial_started_at,public_profile_enabled";

export async function fetchMemberProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(MEMBER_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchPendingMessageRequest(supabase, { senderId, recipientId }) {
  const { data, error } = await supabase
    .from("message_requests")
    .select("id,status,message,created_at")
    .eq("sender_id", senderId)
    .eq("recipient_id", recipientId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;
  return data;
}
