import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { requireAuth } from "@/lib/auth";

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 41900,   // ₹419 in paise
  pro:   419900,  // ₹4199 in paise
};

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { plan }   = await req.json();

    if (!PLAN_AMOUNTS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount:   PLAN_AMOUNTS[plan],
      currency: "INR",
      notes:    { userId, plan },
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      key:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}