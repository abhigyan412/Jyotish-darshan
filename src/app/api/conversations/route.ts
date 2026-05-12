// src/app/api/conversations/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const chartId = searchParams.get("chartId");

    if (!chartId) {
      return NextResponse.json({ error: "chartId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("chart_id", chartId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ conversations: data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}