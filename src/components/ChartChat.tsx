"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { BirthDetails, KundliChart } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FeedbackState {
  [messageIndex: number]: "accurate" | "off" | "more" | null;
}

interface Props {
  details: BirthDetails;
  chart: KundliChart;
  chartId?: string | null;
  transitPlanets?: any[];
  onUpgradeRequired?: (reason: string, limitType: "message" | "chart" | "feature") => void;
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

function FeedbackButtons({
  messageIndex,
  feedbackState,
  onFeedback,
  isStreaming,
}: {
  messageIndex: number;
  feedbackState: FeedbackState;
  onFeedback: (index: number, signal: "accurate" | "off" | "more") => void;
  isStreaming: boolean;
}) {
  if (isStreaming) return null;

  const current = feedbackState[messageIndex];

  const buttons: {
    signal: "accurate" | "off" | "more";
    label: string;
    activeColor: string;
  }[] = [
      { signal: "accurate", label: "✓ This landed", activeColor: "rgba(74,180,100,0.2)" },
      { signal: "more", label: "↓ Tell me more", activeColor: "rgba(201,168,76,0.2)" },
      { signal: "off", label: "✗ This missed", activeColor: "rgba(180,74,74,0.2)" },
    ];

  return (
    <div style={{
      display: "flex",
      gap: 5,
      marginTop: 10,
      paddingTop: 8,
      borderTop: "0.5px solid rgba(201,168,76,0.08)",
      flexWrap: "wrap",
    }}>
      {buttons.map(({ signal, label, activeColor }) => {
        const isActive = current === signal;
        return (
          <button
            key={signal}
            onClick={() => onFeedback(messageIndex, signal)}
            style={{
              fontSize: 10,
              padding: "3px 10px",
              borderRadius: 12,
              border: `0.5px solid ${isActive ? "rgba(201,168,76,0.45)" : "rgba(201,168,76,0.12)"}`,
              background: isActive ? activeColor : "transparent",
              color: isActive ? "var(--gold)" : "var(--dim)",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
              letterSpacing: 0.3,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                e.currentTarget.style.color = "var(--muted)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)";
                e.currentTarget.style.color = "var(--dim)";
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ChartChat({ details, chart, chartId, transitPlanets, onUpgradeRequired }: Props) {
  const welcomeMsg: Message = {
    role: "assistant",
    content: `Namaste! I am your Jyotish guide. I have studied ${details.name || "your"} birth chart carefully — Lagna in ${chart.lagna.rashi}, Moon in ${chart.planets.find(p => p.key === "mo")?.position.rashi}. Ask me anything about your chart, destiny, career, relationships, or remedies.`,
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  // ── Load conversation history ────────────────────────────────────────────
  useEffect(() => {
    if (!chartId || historyLoaded) return;
    async function loadHistory() {
      try {
        const res = await fetch(`/api/conversations?chartId=${chartId}`);
        if (!res.ok) return;
        const { conversations } = await res.json();
        if (!conversations?.length) return;
        const latest = conversations[0];
        setConvId(latest.id);
        const msgRes = await fetch(`/api/conversations/${latest.id}/messages`);
        if (!msgRes.ok) return;
        const { messages: history } = await msgRes.json();
        if (history?.length) {
          setMessages([
            welcomeMsg,
            ...history.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ]);
        }
      } catch { /* silent */ }
      finally { setHistoryLoaded(true); }
    }
    loadHistory();
  }, [chartId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Core stream executor — used by both sendMessage and "Tell me more" ──
  const executeStream = useCallback(async (
    userContent: string,
    baseMessages: Message[]
  ) => {
    const userMsg: Message = { role: "user", content: userContent };
    const currentMessages = [...baseMessages, userMsg];

    setMessages(currentMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details,
          chart,
          messages: currentMessages,
          chartId: chartId ?? undefined,
          conversationId: convId ?? undefined,
          transitPlanets: transitPlanets ?? [],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.upgradeRequired && onUpgradeRequired) {
          onUpgradeRequired(
            errData.error ?? "You've reached your plan limit.",
            errData.limitType ?? "message"
          );
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (errData.authRequired) {
          window.location.href = "/sign-in";
          return;
        }
        throw new Error(errData.error ?? "Request failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      const newAssistantIndex = currentMessages.length;
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      setStreamingIndex(newAssistantIndex);

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

      setStreamingIndex(null);

      if (!full || full.trim().length < 5) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "⚠ The reading came back empty. Please try again.",
          };
          return updated;
        });
      }

      const newConvId = res.headers.get("x-conversation-id");
      if (newConvId && !convId) setConvId(newConvId);

    } catch (err) {
      setStreamingIndex(null);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "⚠ Error: " + (err as Error).message,
          };
          return updated;
        }
        return [...prev, {
          role: "assistant",
          content: "⚠ Error: " + (err as Error).message,
        }];
      });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [details, chart, chartId, convId, transitPlanets]);

  // ── Send message (from input box) ────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || sendingRef.current) return;
    sendingRef.current = true;
    const content = input.trim();
    setInput("");
    await executeStream(content, messages);
  }, [input, loading, messages, executeStream]);

  // ── Feedback handler ─────────────────────────────────────────────────────
  const handleFeedback = useCallback(async (
    messageIndex: number,
    signal: "accurate" | "off" | "more"
  ) => {
    // Mark button as active immediately
    setFeedbackState(prev => ({ ...prev, [messageIndex]: signal }));

    // "Tell me more" — fire a deep follow-up automatically
    if (signal === "more") {
      if (loading || sendingRef.current) return;
      sendingRef.current = true;

      const msg = messages[messageIndex];

      // Extract a specific sentence from the response to drill into
      const plainText = msg?.content.replace(/<[^>]+>/g, "") ?? "";
      const sentences = plainText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 200);

      // Pick the most interesting sentence (not the first — often a header)
      const targetSentence = sentences[1] ?? sentences[0] ?? plainText.slice(0, 100);

      const followUp = targetSentence
        ? `Go deeper on this specifically: "${targetSentence.slice(0, 120)}"`
        : "Go deeper. Give me more specific observations about what you just described.";

      await executeStream(followUp, messages);
    }

    // Record feedback signal to memory (best-effort)
    if (!chartId) return;
    const msg = messages[messageIndex];
    const observationText = msg?.content
      .replace(/<[^>]+>/g, "")
      .split(/[.!?]/)[0]
      ?.trim()
      ?.slice(0, 200) ?? "";

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, signal, observationText }),
      });
    } catch { /* best-effort */ }

  }, [messages, chartId, loading, executeStream]);

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
                  <div style={{
                    fontSize: 9,
                    color: "var(--gold)",
                    fontFamily: "Cinzel Decorative, serif",
                    letterSpacing: 1.5,
                    marginBottom: 8,
                    opacity: 0.8,
                  }}>
                    ✦ JYOTISH GUIDE
                  </div>
                )}

                {m.role === "assistant" ? (
                  m.content ? (
                    <>
                      <div
                        className="chat-prose"
                        dangerouslySetInnerHTML={{ __html: formatText(m.content) }}
                      />
                      {/* Feedback buttons under every assistant message except welcome */}
                      {i > 0 && (
                        <FeedbackButtons
                          messageIndex={i}
                          feedbackState={feedbackState}
                          onFeedback={handleFeedback}
                          isStreaming={streamingIndex === i}
                        />
                      )}
                    </>
                  ) : loading && i === messages.length - 1 ? (
                    <span style={{ color: "#9E96B8", fontStyle: "normal" }}>
                      reading the stars…
                    </span>
                  ) : null
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions — only on first message */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              "What is my strongest planet?",
              "When will I get married?",
              "What career suits me?",
              "Why do I keep repeating patterns?",
              "Explain my current period",
            ].map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  background: "var(--surface2)",
                  border: "0.5px solid rgba(201,168,76,0.22)",
                  borderRadius: 20,
                  color: "#C4BEDD",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)";
                  e.currentTarget.style.color = "var(--gold)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.22)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
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
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
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
    </>
  );
}