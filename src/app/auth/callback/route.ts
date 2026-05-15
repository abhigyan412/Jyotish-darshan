// src/app/auth/callback/route.ts
// Supabase redirects here after OAuth (Google) or magic link clicks
// Exchanges the code for a session and redirects to dashboard

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}