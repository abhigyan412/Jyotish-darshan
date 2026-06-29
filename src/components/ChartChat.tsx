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

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--gold)",
          opacity: 0.4,
          animation: `typingPulse 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
          display: "inline-block",
        }} />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text.replace(/<[^>]+>/g, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied ? "var(--gold)" : "#5A5470",
        fontSize: 11,
        padding: "2px 6px",
        borderRadius: 4,
        transition: "color 0.15s",
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Copy"
    >
      {copied ? "✓ Copied" : "⎘ Copy"}
    </button>
  );
}

function FeedbackButtons({
  messageIndex, feedbackState, onFeedback, isStreaming,
}: {
  messageIndex: number;
  feedbackState: FeedbackState;
  onFeedback: (index: number, signal: "accurate" | "off" | "more") => void;
  isStreaming: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isStreaming) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isStreaming]);

  if (!visible) return null;

  const current = feedbackState[messageIndex];
  const buttons: { signal: "accurate" | "off" | "more"; label: string; activeColor: string }[] = [
    { signal: "accurate", label: "✓ This landed", activeColor: "rgba(74,180,100,0.2)" },
    { signal: "more", label: "↓ Tell me more", activeColor: "rgba(201,168,76,0.2)" },
    { signal: "off", label: "✗ This missed", activeColor: "rgba(180,74,74,0.2)" },
  ];

  return (
    <div style={{
      display: "flex", gap: 5, marginTop: 10, paddingTop: 8,
      borderTop: "0.5px solid rgba(201,168,76,0.08)", flexWrap: "wrap",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s ease",
    }}>
      {buttons.map(({ signal, label, activeColor }) => {
        const isActive = current === signal;
        return (
          <button
            key={signal}
            onClick={() => onFeedback(messageIndex, signal)}
            style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 12,
              border: `0.5px solid ${isActive ? "rgba(201,168,76,0.45)" : "rgba(201,168,76,0.12)"}`,
              background: isActive ? activeColor : "transparent",
              color: isActive ? "var(--gold)" : "#9E96B8",
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "inherit", letterSpacing: 0.3,
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "var(--muted)"; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)"; e.currentTarget.style.color = "#9E96B8"; } }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What is my strongest planet?",
  "When will I get married?",
  "What career suits me?",
  "Why do I keep repeating patterns?",
  "Explain my current dasha period",
  "What are my biggest strengths?",
];

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
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const isAtBottomRef = useRef(true);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "36px";
    if (!input) { ta.style.overflowY = "hidden"; return; }
    const next = Math.min(Math.max(ta.scrollHeight, 36), 120);
    ta.style.height = `${next}px`;
    ta.style.overflowY = ta.scrollHeight > 120 ? "auto" : "hidden";
  }, [input]);

  // ── Track scroll position ────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      isAtBottomRef.current = atBottom;
      setShowScrollBtn(!atBottom && messages.length > 1);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length]);

  // ── Smart auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    isAtBottomRef.current = true;
    setShowScrollBtn(false);
  }, []);

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
              role: m.role, content: m.content,
            })),
          ]);
        }
      } catch { /* silent */ }
      finally { setHistoryLoaded(true); }
    }
    loadHistory();
  }, [chartId]);

  // ── Core stream executor ─────────────────────────────────────────────────
  const executeStream = useCallback(async (userContent: string, baseMessages: Message[]) => {
    const userMsg: Message = { role: "user", content: userContent };
    const currentMessages = [...baseMessages, userMsg];
    setMessages(currentMessages);
    setLoading(true);
    isAtBottomRef.current = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          details, chart, messages: currentMessages,
          chartId: chartId ?? undefined,
          conversationId: convId ?? undefined,
          transitPlanets: transitPlanets ?? [],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.upgradeRequired && onUpgradeRequired) {
          onUpgradeRequired(errData.error ?? "You've reached your plan limit.", errData.limitType ?? "message");
          setMessages(prev => prev.slice(0, -1));
          return;
        }
        if (errData.authRequired) { window.location.href = "/sign-in"; return; }
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
          updated[updated.length - 1] = { role: "assistant", content: "The reading came back empty. Please try again." };
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
          updated[updated.length - 1] = { role: "assistant", content: "Error: " + (err as Error).message };
          return updated;
        }
        return [...prev, { role: "assistant", content: "Error: " + (err as Error).message }];
      });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [details, chart, chartId, convId, transitPlanets]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || sendingRef.current) return;
    sendingRef.current = true;
    const content = input.trim();
    setInput("");
    await executeStream(content, messages);
  }, [input, loading, messages, executeStream]);

  const handleFeedback = useCallback(async (messageIndex: number, signal: "accurate" | "off" | "more") => {
    setFeedbackState(prev => ({ ...prev, [messageIndex]: signal }));
    if (signal === "more") {
      if (loading || sendingRef.current) return;
      sendingRef.current = true;
      const msg = messages[messageIndex];
      const plainText = msg?.content.replace(/<[^>]+>/g, "") ?? "";
      const sentences = plainText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 30 && s.length < 200);
      const targetSentence = sentences[1] ?? sentences[0] ?? plainText.slice(0, 100);
      const followUp = targetSentence
        ? `Go deeper on this specifically: "${targetSentence.slice(0, 120)}"`
        : "Go deeper. Give me more specific observations about what you just described.";
      await executeStream(followUp, messages);
    }
    if (!chartId) return;
    const msg = messages[messageIndex];
    const observationText = msg?.content.replace(/<[^>]+>/g, "").split(/[.!?]/)[0]?.trim()?.slice(0, 200) ?? "";
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
        @keyframes typingPulse {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollBtnFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: msgFadeIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        .scroll-fab { animation: scrollBtnFade 0.2s ease both; }
        .composer-wrap:focus-within { border-color: rgba(201,168,76,0.5) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.06); }
        .send-btn:hover:not(:disabled) { background: var(--gold) !important; color: #07060F !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.35; }
        .suggestion-chip:hover { border-color: rgba(201,168,76,0.6) !important; color: var(--gold) !important; background: rgba(201,168,76,0.06) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: 560, position: "relative" }}>

        {/* ── Messages ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 12, scrollBehavior: "smooth" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className="msg-animate"
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                }}
              >
                <div style={{
                  maxWidth: m.role === "user" ? "72%" : "94%",
                  padding: m.role === "user" ? "10px 16px" : "14px 18px",
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: m.role === "user"
                    ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))"
                    : "var(--surface2)",
                  border: `0.5px solid ${m.role === "user" ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.1)"}`,
                  fontSize: 14.5,
                  lineHeight: 1.75,
                  color: m.role === "user" ? "var(--gold-light)" : "var(--text)",
                  boxShadow: m.role === "user"
                    ? "0 2px 12px rgba(201,168,76,0.08)"
                    : "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "box-shadow 0.2s",
                }}>
                  {m.role === "assistant" && (
                    <div style={{
                      fontSize: 8, color: "var(--gold)", fontFamily: "Cinzel Decorative, serif",
                      letterSpacing: 2, marginBottom: 10, opacity: 0.7,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(201,168,76,0.12)",
                        border: "0.5px solid rgba(201,168,76,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8,
                      }}>{"✦"}</span>
                      JYOTISH GUIDE
                    </div>
                  )}

                  {m.role === "assistant" ? (
                    m.content ? (
                      <>
                        <div className="chat-prose" dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                        {streamingIndex === i && (
                          <span style={{
                            display: "inline-block", width: 2, height: "1em",
                            background: "var(--gold)", marginLeft: 2,
                            verticalAlign: "text-bottom",
                            animation: "typingPulse 1s step-end infinite",
                          }} />
                        )}
                        {i > 0 && streamingIndex !== i && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <FeedbackButtons
                              messageIndex={i} feedbackState={feedbackState}
                              onFeedback={handleFeedback} isStreaming={streamingIndex === i}
                            />
                            <CopyButton text={m.content} />
                          </div>
                        )}
                      </>
                    ) : loading && i === messages.length - 1 ? (
                      <TypingDots />
                    ) : null
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} style={{ height: 8 }} />
        </div>

        {/* ── Scroll to bottom FAB ── */}
        {showScrollBtn && (
          <button
            className="scroll-fab"
            onClick={scrollToBottom}
            style={{
              position: "absolute", bottom: 80, right: 8,
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--surface2)",
              border: "0.5px solid rgba(201,168,76,0.35)",
              color: "var(--gold)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, zIndex: 10,
              transition: "background 0.2s, transform 0.15s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; }}
            title="Scroll to bottom"
          >
            ↓
          </button>
        )}

        {/* ── Suggested questions ── */}
        {messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={q}
                className="suggestion-chip"
                onClick={() => {
                  setInput(q);
                  textareaRef.current?.focus();
                }}
                style={{
                  fontSize: 12, padding: "6px 14px",
                  background: "var(--surface2)",
                  border: "0.5px solid rgba(201,168,76,0.2)",
                  borderRadius: 20, color: "#C4BEDD",
                  cursor: "pointer", transition: "all 0.15s",
                  animation: `msgFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both`,
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Composer ── */}
        <div
          className="composer-wrap"
          style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "var(--surface2)",
            border: "0.5px solid rgba(201,168,76,0.2)",
            borderRadius: 16, padding: "8px 8px 8px 16px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <textarea
            ref={textareaRef}
            placeholder="Ask about your chart…"
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            disabled={loading}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "var(--text)", fontFamily: "inherit", fontSize: 15,
              lineHeight: 1.6, resize: "none", minHeight: 36, maxHeight: 120,
              overflowY: "hidden", padding: "4px 0",
            }}
          />
          <button
            className="send-btn"
            onClick={loading ? undefined : sendMessage}
            disabled={!input.trim() && !loading}
            style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: loading ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.12)",
              border: "0.5px solid rgba(201,168,76,0.3)",
              color: "var(--gold)", cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, transition: "all 0.15s",
            }}
          >
            {loading ? (
              <span style={{ animation: "typingPulse 1s ease infinite", display: "inline-block" }}>⟳</span>
            ) : "↑"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#5A5470", marginTop: 6, letterSpacing: 0.5 }}>
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </>
  );
}