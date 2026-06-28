// src/lib/auth.ts
// Server-side helper — use at the top of every API route

import { TIER_LIMITS, type SubscriptionTier } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface AuthContext {
  userId: string;
  tier: SubscriptionTier;
  limits: typeof TIER_LIMITS[SubscriptionTier];
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized", 401);
  }

  // Get tier + subscription status from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, current_period_end, messages_used, messages_reset_at")
    .eq("id", user.id)
    .single();

  // Auto-downgrade to free if subscription expired
  let tier = (profile?.tier ?? "free") as SubscriptionTier;
  if (
    tier !== "free" &&
    profile?.current_period_end &&
    new Date(profile.current_period_end) < new Date()
  ) {
    // Subscription expired — downgrade to free
    await supabase
      .from("profiles")
      .update({ tier: "free" })
      .eq("id", user.id);
    tier = "free";
  }

  return {
    userId: user.id,
    tier,
    limits: TIER_LIMITS[tier],
    supabase,
  };
}

// ─── Chart Limit ──────────────────────────────────────────────────────────────

export async function checkChartLimit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: SubscriptionTier
) {
  const max = TIER_LIMITS[tier].maxCharts;
  if (max === Infinity) return;

  const { count } = await supabase
    .from("charts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= max) {
    throw new AuthError(
      `UPGRADE_REQUIRED:chart:You've reached the chart limit (${max} charts) on your ${tier} plan.`,
      403
    );
  }
}

// ─── Monthly Message Limit ────────────────────────────────────────────────────

export async function checkMessageLimit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: SubscriptionTier
) {
  const max = TIER_LIMITS[tier].maxMessagesPerMonth;
  if (max === Infinity) return;

  // Fetch current usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("messages_used, messages_reset_at")
    .eq("id", userId)
    .single();

  const now = new Date();
  const resetAt = profile?.messages_reset_at
    ? new Date(profile.messages_reset_at)
    : null;

  // Reset counter if a month has passed
  const shouldReset = !resetAt || now >= new Date(resetAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (shouldReset) {
    await supabase
      .from("profiles")
      .update({ messages_used: 0, messages_reset_at: now.toISOString() })
      .eq("id", userId);
    return; // fresh reset — allow message
  }

  const used = profile?.messages_used ?? 0;

  if (used >= max) {
    throw new AuthError(
      `UPGRADE_REQUIRED:message:You've used all ${max} messages on your ${tier} plan this month.`,
      403
    );
  }
}

// ─── Increment message count after successful message ─────────────────────────

export async function incrementMessageCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { error } = await supabase
    .from("profiles")
    .update({ messages_used: supabase.rpc("increment_messages_used") })
    .eq("id", userId);
    
  // Direct SQL increment instead
  await supabase.rpc("increment_messages_used", { user_id_input: userId });
  console.log("[auth] increment called for", userId);
}