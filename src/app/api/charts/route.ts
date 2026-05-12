// src/app/api/charts/route.ts
import { NextResponse } from "next/server";
import { requireAuth, checkChartLimit, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    // RLS ensures user only sees their own — no .eq("user_id") needed
    const { data, error } = await supabase
      .from("charts")
      .select("id, name, dob, tob, pob, is_primary, label, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ charts: data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, tier, supabase } = await requireAuth();
    await checkChartLimit(supabase, userId, tier);

    const { name, dob, tob, pob, latitude, longitude, timezone, chart_data, is_primary, label } = await req.json();
    if (!name || !dob || !tob || !pob || !chart_data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (is_primary) {
      await supabase.from("charts").update({ is_primary: false }).eq("user_id", userId).eq("is_primary", true);
    }

    const { data, error } = await supabase
      .from("charts")
      .insert({ user_id: userId, name, dob, tob, pob, latitude, longitude, timezone, chart_data, is_primary: is_primary ?? false, label })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ chart: data }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}