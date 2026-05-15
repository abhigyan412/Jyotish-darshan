// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { chartId, signal, observationText } = await req.json();

    if (!chartId || !signal) {
      return NextResponse.json({ error: "Missing chartId or signal" }, { status: 400 });
    }

    if (!["accurate", "off", "more"].includes(signal)) {
      return NextResponse.json({ error: "Invalid signal" }, { status: 400 });
    }

    // Get userId from session
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call handleFeedback from memory.ts
    const { handleFeedback } = await import("@/lib/memory");
    await handleFeedback(chartId, user.id, signal, observationText);

    console.log(`[feedback] chartId=${chartId} signal=${signal}`);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[feedback] ERROR:", (err as Error).message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}