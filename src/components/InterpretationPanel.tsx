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
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export default function InterpretationPanel({ details, chart }: Props) {
  const [activeSection, setActiveSection] = useState<InterpretationSection>("full");
  const [cache, setCache] = useState<Partial<Record<InterpretationSection, string>>>({});
  const [streaming, setStreaming] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fetchInterpretation = useCallback(async (section: InterpretationSection) => {
    if (cache[section]) {
      setCurrentText(cache[section]!);
      return;
    }

    const apiKey = sessionStorage.getItem("__kak");
    const baseUrl = sessionStorage.getItem("__kbu") || undefined;
    if (!apiKey) { setError("API key not found. Please go back and re-enter."); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setCurrentText("");
    setError("");

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, baseUrl, details, chart, section }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
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

  return (
    <div>
      {/* Section tabs */}
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

      {/* Content */}
      <div className="min-h-[300px]">
        {error && (
          <div className="text-sm p-4 rounded-lg" style={{ background: "rgba(226,75,74,0.1)", border: "0.5px solid rgba(226,75,74,0.3)", color: "#E24B4A" }}>
            ⚠ {error}
          </div>
        )}

        {!error && !displayText && streaming && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="text-3xl animate-rotateSlow">✦</div>
            <div className="text-sm italic animate-pulse-slow" style={{ color: "var(--muted)" }}>
              The stars are speaking…
            </div>
          </div>
        )}

        {displayText && (
          <div
            className={`interpretation-prose ${streaming && !cache[activeSection] ? "streaming-cursor" : ""}`}
            dangerouslySetInnerHTML={{ __html: formatText(displayText) }}
          />
        )}
      </div>

      {!streaming && displayText && (
        <button
          onClick={() => {
            setCache(prev => { const n = { ...prev }; delete n[activeSection]; return n; });
            setCurrentText("");
            fetchInterpretation(activeSection);
          }}
          className="mt-4 text-xs italic"
          style={{ color: "var(--dim)", background: "none", border: "none", cursor: "pointer" }}
        >
          ↺ Regenerate
        </button>
      )}
    </div>
  );
}
