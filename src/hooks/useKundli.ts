"use client";
// src/hooks/useKundli.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseBrowserClient, type DbChart, type DbConversation, type DbMessage, type SubscriptionTier, TIER_LIMITS } from "@/lib/supabase";

// ─── useAuth ──────────────────────────────────────────────────────────────────

export function useAuth() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser]     = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }, [supabase]);

  return { user, loading, signOut };
}

// ─── useCharts ────────────────────────────────────────────────────────────────

export function useCharts() {
  const [charts, setCharts]   = useState<DbChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/charts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCharts(json.charts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);

  const saveChart = useCallback(async (payload: {
    name: string; dob: string; tob: string; pob: string;
    latitude?: number; longitude?: number; timezone?: string;
    chart_data: Record<string, unknown>;
    is_primary?: boolean; label?: string;
  }) => {
    const res  = await fetch("/api/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchCharts();
    return json.chart as DbChart;
  }, [fetchCharts]);

  const deleteChart = useCallback(async (chartId: string) => {
    const res = await fetch(`/api/charts/${chartId}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).error);
    await fetchCharts();
  }, [fetchCharts]);

  return { charts, loading, error, saveChart, deleteChart, refetch: fetchCharts };
}

// ─── useConversations ─────────────────────────────────────────────────────────

export function useConversations(chartId: string | null) {
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!chartId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/conversations?chartId=${chartId}`);
      const json = await res.json();
      if (res.ok) setConversations(json.conversations);
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { conversations, loading, refetch: fetch_ };
}

// ─── useChat ──────────────────────────────────────────────────────────────────

export function useChat({
  chartId,
  conversationId: initialConvId,
  transitChart,
  onConversationCreated,
}: {
  chartId: string;
  conversationId?: string;
  transitChart?: { planets: unknown[]; date: string };
  onConversationCreated?: (id: string) => void;
}) {
  const [messages, setMessages]     = useState<{ role: string; content: string }[]>([]);
  const [streaming, setStreaming]   = useState(false);
  const [conversationId, setConvId] = useState(initialConvId);
  const [error, setError]           = useState<string | null>(null);
  const abortRef                    = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    setError(null);
    setStreaming(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }, { role: "assistant", content: "" }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, conversationId, message: userMessage, transitChart }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error((await res.json()).error ?? "Chat failed");

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.conversationId && !conversationId) {
              setConvId(parsed.conversationId);
              onConversationCreated?.(parsed.conversationId);
            }
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev];
                const last    = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: last.content + parsed.text };
                return updated;
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message);
        setMessages(prev => prev.slice(0, -1)); // remove empty assistant message
      }
    } finally {
      setStreaming(false);
    }
  }, [chartId, conversationId, transitChart, onConversationCreated]);

  return { messages, setMessages, streaming, error, conversationId, sendMessage, stop: () => abortRef.current?.abort() };
}

// ─── useSubscription ──────────────────────────────────────────────────────────

export function useSubscription() {
  const [data, setData] = useState<{
    tier: SubscriptionTier;
    usage: { charts: number; chartsMax: number | null };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const isAllowed = (feature: "yearlyPredictions" | "transitAnalysis") =>
    data ? (TIER_LIMITS[data.tier] as any)[feature] === true : false;

  return { ...data, loading, isAllowed };
}