import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

// Period length now branches by plan — a weekly payment must only grant
// 7 days of access, not the old hardcoded 30. Previously every plan got
// +30 days regardless of what was actually paid for.
const PLAN_PERIOD_DAYS: Record<string, number> = {
  weekly: 7,
  pro: 30,
};

export async function POST(req: Request) {
  try {
    console.log("[verify] called");
    const { userId } = await requireAuth();
    console.log("[verify] userId:", userId);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    } = await req.json();

    // Verify signature
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.log("[verify] signature valid, updating tier to:", plan);

    // Period length depends on which plan was actually purchased
    const periodDays = PLAN_PERIOD_DAYS[plan] ?? 30;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + periodDays);
    console.log("[verify] plan:", plan, "periodDays:", periodDays, "periodEnd:", periodEnd.toISOString());

    // Update profile tier
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        tier:                 plan,
        current_period_end:   periodEnd.toISOString(),
        cancel_at_period_end: false,
        razorpay_customer_id: razorpay_payment_id,
        // Reset usage counters on a fresh paid period so the new tier's
        // limits start from zero rather than carrying over a prior tier's count.
        messages_used:        0,
        messages_reset_at:    new Date().toISOString(),
      })
      .eq("id", userId);

    console.log("[verify] updateError:", updateError);

    // Save subscription record
    const { error: subError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        id:                   razorpay_payment_id,
        user_id:              userId,
        razorpay_order_id,
        razorpay_payment_id,
        plan,
        status:               "active",
        current_period_start: new Date().toISOString(),
        current_period_end:   periodEnd.toISOString(),
      });

    console.log("[verify] subError:", subError);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.log("[verify] CRASH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}