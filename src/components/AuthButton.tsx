"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { SubscriptionTier } from "@/lib/supabase";

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free:  "#E8E4D9",
  basic: "#C9A84C",
  pro:   "#78C8FF",
};
const TIER_LABELS: Record<SubscriptionTier, string> = {
  free:  "FREE",
  basic: "BASIC",
  pro:   "PRO ✦",
};

export default function AuthButton() {
  const [user, setUser]   = useState<{ email?: string } | null>(null);
  const [tier, setTier]   = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    async function loadUserAndTier() {
      const { data } = await supabase.auth.getUser();
      const u = data.user ?? null;
      setUser(u);

      if (u) {
        // Parallel fetch — don't wait sequentially
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
            setTier((profile?.tier ?? "free") as SubscriptionTier);
          });
      }
      setLoading(false);
    }
    loadUserAndTier();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) setTier("free");
      else {
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", u.id)
          .single()
          .then(({ data: profile }) => {
            setTier((profile?.tier ?? "free") as SubscriptionTier);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setTier("free");
  }

  if (loading) return null;

  if (user) {
    const initial = user.email?.[0]?.toUpperCase() ?? "U";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {/* Tier badge */}
        <div style={{
          fontFamily:    "Cinzel, serif",
          fontSize:      "0.55rem",
          letterSpacing: "1.5px",
          color:         tier === "free" ? "#07060F" : TIER_COLORS[tier],
          border:        `0.5px solid ${TIER_COLORS[tier]}`,
          borderRadius:  "20px",
          padding:       "2px 8px",
          background:    tier === "free" ? "#E8E4D9" : "transparent",
          opacity:       1,
        }}>
          {TIER_LABELS[tier]}
        </div>

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
            fontFamily:    "Cinzel, serif",
            fontSize:      "0.7rem",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#C4BEDD",
            background:    "transparent",
            border:        "none",
            cursor:        "pointer",
            padding:       "0.4rem 0",
            transition:    "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--lmuted)")}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      style={{
        fontFamily:     "Cinzel, serif",
        fontSize:       "0.75rem",
        letterSpacing:  "2px",
        textTransform:  "uppercase",
        color:          "var(--gold)",
        textDecoration: "none",
        padding:        "0.7rem 1.2rem",
        border:         "0.5px solid rgba(201,168,76,0.35)",
        borderRadius:   "4px",
        transition:     "all 0.2s",
        display:        "inline-block",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.8)";
        e.currentTarget.style.background  = "rgba(201,168,76,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)";
        e.currentTarget.style.background  = "transparent";
      }}
    >
      Sign In
    </Link>
  );
}