"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { BirthDetails, KundliChart, InterpretationSection } from "@/types";

interface Props {
  details: BirthDetails;
  chart: KundliChart;
}

const SECTIONS: { key: InterpretationSection; label: string; icon: string }[] = [
  { key: "full",          label: "Full Reading",   icon: "✦" },
  { key: "personality",  label: "Personality",    icon: "☽" },
  { key: "career",       label: "Career",          icon: "♄" },
  { key: "relationships",label: "Relationships",  icon: "♀" },
  { key: "health",       label: "Health",          icon: "♃" },
  { key: "remedies",     label: "Remedies",        icon: "☉" },
];

function formatText(text: string): string {
  return text
    .replace(/^---$/gm, "<hr style='border:none;border-top:0.5px solid rgba(201,168,76,0.15);margin:0.8rem 0;'/>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<div style='font-family:Cinzel,serif;font-size:0.72rem;letter-spacing:1.5px;color:var(--gold);margin:1.1rem 0 0.3rem;text-transform:uppercase;'>$1</div>")
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:var(--gold-light);font-weight:600;'>$1</strong>")
    .replace(/^- (.+)$/gm, "<div style='padding-left:1rem;margin:0.2rem 0;'>· $1</div>")
    .replace(/^\d+\.\s+(.+)$/gm, "<div style='padding-left:1rem;margin:0.25rem 0;'>$1</div>")
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => {
      if (para.startsWith("<div") || para.startsWith("<hr")) return para;
      return `<p style='margin:0 0 0.55rem;'>${para.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
}

export default function InterpretationPanel({ details, chart }: Props) {
  const [activeSection, setActiveSection] = useState<InterpretationSection>("full");
  const [cache, setCache] = useState<Partial<Record<InterpretationSection, string>>>({});
  const [streaming, setStreaming] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchInterpretation = useCallback(async (section: InterpretationSection) => {
    if (cache[section]) {
      setCurrentText(cache[section]!);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setCurrentText("");
    setError("");
    setAuthRequired(false);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ details, chart, section }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.authRequired) {
          setAuthRequired(true);
          return;
        }
        throw new Error(err.error || "API error");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setCurrentText(full);
      }

      setCache(prev => ({ ...prev, [section]: full }));
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Something went wrong.");
      }
    } finally {
      setStreaming(false);
    }
  }, [cache, details, chart]);

  useEffect(() => {
    fetchInterpretation(activeSection);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const displayText = cache[activeSection] || currentText;

  if (authRequired) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}>
        <div style={{ fontSize: "2rem", color: "var(--gold)" }}>{"✦"}</div>
        <div style={{
          fontFamily: "Cinzel Decorative, serif",
          fontSize: "0.9rem",
          color: "var(--gold)",
          letterSpacing: 2,
        }}>
          Sign In to Access AI Readings
        </div>
        <p style={{
          fontSize: "0.9rem",
          color: "#C4BEDD",
          maxWidth: 320,
          lineHeight: 1.7,
        }}>
          Create a free account to unlock AI-powered Kundli interpretations, chart chat, and personalized insights.
        </p>
        <a
          href="/sign-in"
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.72rem",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
            color: "#07060F",
            background: "var(--gold)",
            padding: "0.75rem 2rem",
            borderRadius: "4px",
            textDecoration: "none",
            display: "inline-block",
            transition: "opacity 0.2s",
          }}
        >
          Sign In Free
        </a>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .interp-prose p { margin: 0 0 0.55rem; }
        .interp-prose p:last-child { margin-bottom: 0; }
      `}</style>

      <div className="flex flex-wrap gap-2 mb-5">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className="px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              fontFamily: "Cinzel Decorative, serif",
              fontSize: 10,
              letterSpacing: 1,
              background: activeSection === s.key ? "rgba(201,168,76,0.15)" : "var(--surface2)",
              border: `0.5px solid ${activeSection === s.key ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.15)"}`,
              color: activeSection === s.key ? "var(--gold)" : "var(--dim)",
              cursor: "pointer",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">

        {error && (
          <div className="text-sm p-4 rounded-lg" style={{
            background: "rgba(226,75,74,0.1)",
            border: "0.5px solid rgba(226,75,74,0.3)",
            color: "#E24B4A",
          }}>
            {"⚠"} {error}
          </div>
        )}

        {!error && !displayText && streaming && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-3xl animate-rotateSlow">{"✦"}</div>
            <div className="text-sm animate-pulse-slow" style={{ color: "#C4BEDD" }}>
              The stars are speaking
            </div>
          </div>
        )}

        {displayText && (
          <div style={{
            padding: "18px 20px",
            borderRadius: "4px 16px 16px 16px",
            background: "var(--surface2)",
            border: "0.5px solid rgba(201,168,76,0.12)",
            fontSize: 14.5,
            lineHeight: 1.75,
            color: "var(--text)",
          }}>
            <div style={{
              fontSize: 9,
              color: "var(--gold)",
              fontFamily: "Cinzel Decorative, serif",
              letterSpacing: 1.5,
              marginBottom: 12,
              opacity: 0.8,
            }}>
              {"✦"} JYOTISH GUIDE — {SECTIONS.find(s => s.key === activeSection)?.label.toUpperCase()}
            </div>

            <div
              className="interp-prose"
              dangerouslySetInnerHTML={{ __html: formatText(displayText) }}
            />

            {streaming && !cache[activeSection] && (
              <span style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: "var(--gold)",
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }} />
            )}
          </div>
        )}
      </div>

      {!streaming && displayText && (
        <button
          onClick={() => {
            setCache(prev => { const n = { ...prev }; delete n[activeSection]; return n; });
            setCurrentText("");
            fetchInterpretation(activeSection);
          }}
          className="mt-4 text-xs"
          style={{ color: "#9E96B8", background: "none", border: "none", cursor: "pointer" }}
        >
          Regenerate
        </button>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}