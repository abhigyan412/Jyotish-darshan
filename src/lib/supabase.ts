// src/lib/supabase.ts
// BROWSER ONLY — safe to import in client components
// Does NOT import next/headers

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Shared types (safe everywhere) ──────────────────────────────────────────

// RENAMED: "basic" -> "weekly" as part of the cost-corrected tier restructure.
// If existing user rows have tier='basic' in the database, run the migration
// SQL below before deploying this type change, or those rows will silently
// fall through TIER_LIMITS lookups.
export type SubscriptionTier = "free" | "weekly" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  tier: SubscriptionTier;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  messages_used: number;
  messages_reset_at: string | null;
}

export interface DbChart {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  tob: string;
  pob: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  chart_data: Record<string, unknown>;
  is_primary: boolean;
  label: string | null;
  created_at: string;
}

export interface DbConversation {
  id: string;
  user_id: string;
  chart_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  protocol: string | null;
  created_at: string;
}

// ─── TIER LIMITS — corrected against real measured Zima cost data ───────────
// Blended real cost per message: ~₹2.07 (verified via Zima dashboard,
// post condensing-fix). Previous limits (basic: 500/mo, pro: 3000/mo) were
// set before this was measured and would produce deeply negative margins
// (-421% and -522% respectively) if a subscriber actually used their cap.
//
// NOTE on "weekly" reset interval: maxMessagesPerMonth is misleadingly named
// for this tier — for "weekly" it must be enforced on a 7-day rolling window,
// not 30. See the updated checkMessageLimit() in auth.ts which branches on
// tier to pick the correct reset interval. Do not rename the field without
// also updating every other place that reads it.

export const TIER_LIMITS: Record<SubscriptionTier, {
  maxCharts: number;
  maxMessagesPerMonth: number;  // interpreted as PER WEEK for the "weekly" tier — see note above
  yearlyPredictions: boolean;
  transitAnalysis: boolean;
}> = {
  free:   { maxCharts: 2,  maxMessagesPerMonth: 3,   yearlyPredictions: false, transitAnalysis: false },
  weekly: { maxCharts: 5,  maxMessagesPerMonth: 20,  yearlyPredictions: true,  transitAnalysis: true  },
  pro:    { maxCharts: 50, maxMessagesPerMonth: 250, yearlyPredictions: true,  transitAnalysis: true  },
};