"use client";
// src/components/AuthButton.tsx
// Drop this into your landing page nav — matches existing gold aesthetic exactly

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function AuthButton() {
  const [user, setUser]       = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase              = createSupabaseBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) return null; // Don't flash anything while loading

  // Signed in — show avatar initial + sign out option
  if (user) {
    const initial = user.email?.[0]?.toUpperCase() ?? "U";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(201,168,76,0.15)",
          border: "0.5px solid rgba(201,168,76,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Cinzel, serif", fontSize: "0.7rem",
          color: "var(--gold)", cursor: "default",
        }} title={user.email}>
          {initial}
        </div>
        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.7rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--lmuted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0.4rem 0",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--lmuted)")}
        >
          Sign Out
        </button>
      </div>
    );
  }

  // Not signed in — show Sign In link
  return (
    <Link
      href="/sign-in"
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: "0.75rem",
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: "var(--gold)",
        textDecoration: "none",
        padding: "0.7rem 1.2rem",
        border: "0.5px solid rgba(201,168,76,0.35)",
        borderRadius: "4px",
        transition: "all 0.2s",
        display: "inline-block",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.8)";
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      Sign In
    </Link>
  );
}