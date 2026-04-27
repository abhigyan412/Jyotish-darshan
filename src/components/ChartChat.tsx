"use client";
import { useState, useRef, useEffect } from "react";
import type { BirthDetails, KundliChart } from "@/types";
import { PLANET_META } from "@/lib/astro";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  details: BirthDetails;
  chart: KundliChart;
}

export default function ChartChat({ details, chart }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Namaste! I am your Jyotish guide. I have studied ${details.name || "your"} birth chart carefully — Lagna in ${chart.lagna.rashi}, Moon in ${chart.planets.find(p => p.key === "mo")?.position.rashi}. Ask me anything about your chart, destiny, career, relationships, or remedies.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const apiKey = sessionStorage.getItem("__kak");
    const baseUrl = sessionStorage.getItem("__kbu") || undefined;

    if (!apiKey) {
      setMessages(prev => [...prev, { role: "assistant", content: "API key not found. Please go back and re-enter." }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          details,
          chart,
          messages: [...messages, userMsg],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      // Add empty assistant message to stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠ Error: " + (err as Error).message,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 520 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user"
                  ? "rgba(201,168,76,0.15)"
                  : "var(--surface2)",
                border: `0.5px solid ${m.role === "user" ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.15)"}`,
                fontSize: 15,
                lineHeight: 1.7,
                color: m.role === "user" ? "var(--gold-light)" : "var(--text)",
                fontStyle: m.role === "assistant" ? "normal" : "normal",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.role === "assistant" && (
                <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "Cinzel Decorative, serif", letterSpacing: 1, marginBottom: 4 }}>
                  ✦ JYOTISH GUIDE
                </div>
              )}
              {m.content || (loading && i === messages.length - 1 ? (
                <span className="animate-pulse-slow" style={{ color: "var(--dim)" }}>reading the stars…</span>
              ) : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            "What is my strongest planet?",
            "When will I get married?",
            "What career suits me?",
            "What are my lucky colors?",
            "Explain my current dasha",
          ].map(q => (
            <button key={q} onClick={() => setInput(q)}
              style={{
                fontSize: 12, padding: "5px 10px",
                background: "var(--surface2)",
                border: "0.5px solid rgba(201,168,76,0.25)",
                borderRadius: 20, color: "var(--muted)",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)")}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="mystic-input flex-1"
          placeholder="Ask about your chart…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-gold px-4"
          style={{ minWidth: 60, fontSize: 18 }}
        >
          {loading ? "⟳" : "↑"}
        </button>
      </div>
    </div>
  );
}