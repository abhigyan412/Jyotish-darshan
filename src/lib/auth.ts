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

// ─── Message Limit — reset interval now depends on tier ───────────────────────
// "weekly" tier resets every 7 days; "free" and "pro" reset every 30 days.
// This matters because the field is shared (messages_used / messages_reset_at)
// across all tiers in the profiles table — without this branch, a weekly
// subscriber's cap would only refresh once a month, defeating the tier.

const RESET_INTERVAL_DAYS: Record<SubscriptionTier, number> = {
  free: 30,
  weekly: 7,
  pro: 30,
};

export async function checkMessageLimit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  tier: SubscriptionTier
) {
  const max = TIER_LIMITS[tier].maxMessagesPerMonth;
  if (max === Infinity) return;

  const resetIntervalDays = RESET_INTERVAL_DAYS[tier] ?? 30;

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

  // Reset counter if the tier's interval has passed since the last reset
  const shouldReset = !resetAt || now >= new Date(resetAt.getTime() + resetIntervalDays * 24 * 60 * 60 * 1000);

  if (shouldReset) {
    await supabase
      .from("profiles")
      .update({ messages_used: 0, messages_reset_at: now.toISOString() })
      .eq("id", userId);
    return; // fresh reset — allow message
  }

  const used = profile?.messages_used ?? 0;

  if (used >= max) {
    const periodLabel = tier === "weekly" ? "this week" : "this month";
    throw new AuthError(
      `UPGRADE_REQUIRED:message:You've used all ${max} messages on your ${tier} plan ${periodLabel}.`,
      403
    );
  }
}

// ─── Increment message count after successful message ─────────────────────────
// Cleaned up: removed a dead/no-op update call that was passing a Promise
// into the update payload before the actual RPC call. The RPC call below
// was the only one that ever actually worked.

export async function incrementMessageCount(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { error } = await supabase.rpc("increment_messages_used", { user_id_input: userId });
  if (error) {
    console.log("[auth] increment FAILED for", userId, error.message);
  } else {
    console.log("[auth] increment called for", userId);
  }
}

// ─── Per-minute rate limiter (anti-abuse, independent of monthly limits) ──────
// FIXED: previous version did a separate SELECT then UPSERT from JS, which
// raced under concurrent requests — multiple requests could read the same
// "existing" state before any of them wrote back, so the count never
// reliably reached maxPerMinute and the limiter could be bypassed by
// simultaneous requests (e.g. double-tap send, multiple tabs).
// Now delegates the whole check-and-record to a single atomic Postgres
// function (check_and_record_rate_limit) that uses SELECT ... FOR UPDATE
// to lock the user's row, making concurrent calls queue instead of race.

export async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  maxPerMinute: number = 8
) {
  const { data: allowed, error } = await supabase.rpc("check_and_record_rate_limit", {
    p_user_id: userId,
    p_max_per_minute: maxPerMinute,
  });

  if (error) {
    console.log("[ratelimit] RPC error:", error.message);
    return; // fail-open on error, same behavior as the old version
  }

  if (!allowed) {
    throw new AuthError(
      `RATE_LIMITED:You're sending messages too quickly. Please wait a moment.`,
      429
    );
  }
}