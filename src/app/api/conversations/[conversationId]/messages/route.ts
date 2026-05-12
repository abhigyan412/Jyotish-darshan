// src/app/api/conversations/[conversationId]/messages/route.ts
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { conversationId } = await params;

    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ messages });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}