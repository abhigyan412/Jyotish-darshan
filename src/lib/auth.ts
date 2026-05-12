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

// Drop this at the top of every protected API route
// Returns userId, tier, limits, and the supabase client (with session attached)
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError("Unauthorized", 401);
  }

  // Get tier from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.tier ?? "free") as SubscriptionTier;

  return {
    userId: user.id,
    tier,
    limits: TIER_LIMITS[tier],
    supabase, // same client instance — reuse in the route
  };
}

// ─── Limit checkers ───────────────────────────────────────────────────────────

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
      `You've reached the chart limit for your plan (${max} charts). Upgrade to add more.`,
      403
    );
  }
}

export async function checkMessageLimit(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversationId: string,
  tier: SubscriptionTier
) {
  const max = TIER_LIMITS[tier].maxMessagesPerChart;
  if (max === Infinity) return;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "user"); // count only user turns

  if ((count ?? 0) >= max) {
    throw new AuthError(
      `Message limit reached (${max} messages on ${tier} plan). Upgrade for unlimited conversations.`,
      403
    );
  }
}