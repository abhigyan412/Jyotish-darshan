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

export type SubscriptionTier = "free" | "basic" | "pro";

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

export const TIER_LIMITS: Record<SubscriptionTier, {
  maxCharts: number;
  maxMessagesPerMonth: number;
  yearlyPredictions: boolean;
  transitAnalysis: boolean;
}> = {
  free: { maxCharts: 3, maxMessagesPerMonth: 20, yearlyPredictions: false, transitAnalysis: false },
  basic: { maxCharts: 10, maxMessagesPerMonth: 500, yearlyPredictions: true, transitAnalysis: true },
  pro: { maxCharts: 50, maxMessagesPerMonth: 3000, yearlyPredictions: true, transitAnalysis: true },
};