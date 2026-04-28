"use client";
import { useState, useRef, useEffect } from "react";
import type { BirthDetails, KundliChart } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  details: BirthDetails;
  chart: KundliChart;
}

function formatText(text: string): string {
  return text
    .replace(/^---$/gm, "<hr style='border:none;border-top:0.5px solid rgba(201,168,76,0.15);margin:0.8rem 0;'/>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<div style='font-family:Cinzel,serif;font-size:0.72rem;letter-spacing:1.5px;color:var(--gold);margin:1rem 0 0.3rem;text-transform:uppercase;'>$1</div>")
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--gold-light);font-weight:600;'>$1</strong>")
    .replace(/^- (.+)$/gm, "<div style='padding-left:1rem;margin:0.2rem 0;'>· $1</div>")
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => {
      if (para.startsWith("<div") || para.startsWith("<hr")) return para;
      return `<p style='margin:0 0 0.5rem;'>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details, chart, messages: [...messages, userMsg] }),
      });
      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
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
    <>
      <style>{`
        .chat-prose p { margin: 0 0 0.55rem; }
        .chat-prose p:last-child { margin-bottom: 0; }
      `}</style>

      <div className="flex flex-col" style={{ height: 560 }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div style={{
                maxWidth: m.role === "user" ? "72%" : "94%",
                padding: m.role === "user" ? "9px 14px" : "14px 16px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                background: m.role === "user" ? "rgba(201,168,76,0.13)" : "var(--surface2)",
                border: `0.5px solid ${m.role === "user" ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.12)"}`,
                fontSize: 14.5,
                lineHeight: 1.75,
                color: m.role === "user" ? "var(--gold-light)" : "var(--text)",
              }}>

                {m.role === "assistant" && (
                  <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "Cinzel Decorative, serif", letterSpacing: 1.5, marginBottom: 8, opacity: 0.8 }}>
                    ✦ JYOTISH GUIDE
                  </div>
                )}

                {m.role === "assistant" ? (
                  m.content ? (
                    <div className="chat-prose" dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                  ) : loading && i === messages.length - 1 ? (
                    <span style={{ color: "var(--dim)", fontStyle: "italic" }}>reading the stars…</span>
                  ) : null
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {["What is my strongest planet?", "When will I get married?", "What career suits me?", "What are my lucky colors?", "Explain my current dasha"].map(q => (
              <button key={q} onClick={() => setInput(q)}
                style={{ fontSize: 12, padding: "5px 12px", background: "var(--surface2)", border: "0.5px solid rgba(201,168,76,0.22)", borderRadius: 20, color: "var(--muted)", cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"; e.currentTarget.style.color = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.22)"; e.currentTarget.style.color = "var(--muted)"; }}
              >{q}</button>
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
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="btn-gold px-4" style={{ minWidth: 60, fontSize: 18 }}>
            {loading ? "⟳" : "↑"}
          </button>
        </div>
      </div>
    </>
  );
}