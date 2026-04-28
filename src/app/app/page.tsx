"use client";
import { useState } from "react";
import type { BirthDetails, KundliChart } from "@/types";
import { calculateKundli } from "@/lib/astro";
import BirthForm from "@/components/BirthForm";
import KundliChartSVG from "@/components/KundliChart";
import PlanetTable from "@/components/PlanetTable";
import DashaTimeline from "@/components/DashaTimeline";
import InterpretationPanel from "@/components/InterpretationPanel";
import YogaCards from "@/components/YogaCards";
import ChartChat from "@/components/ChartChat";

type Tab = "chart" | "planets" | "yogas" | "dasha" | "interpretation" | "chat";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "chart", label: "Chart", icon: "⬡" },
  { key: "planets", label: "Planets", icon: "☽" },
  { key: "yogas", label: "Yogas", icon: "✦" },
  { key: "dasha", label: "Dasha", icon: "♄" },
  { key: "interpretation", label: "AI Reading", icon: "☉" },
  { key: "chat", label: "Ask Chart", icon: "💬" },
];

export default function AppPage() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [details, setDetails] = useState<BirthDetails | null>(null);
  const [chart, setChart] = useState<KundliChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  function handleGenerate(d: BirthDetails) {
    setLoading(true);
    try {
      const c = calculateKundli(d);
      setDetails(d);
      setChart(c);
      setStep("result");
      setActiveTab("chart");
    } catch (e) {
      alert("Calculation error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <svg width="80" height="80" viewBox="0 0 100 100" className="mx-auto mb-4 animate-rotateSlow">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(201,168,76,0.25)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="8" fill="rgba(201,168,76,0.2)" stroke="#C9A84C" strokeWidth="0.5" />
          <g stroke="#C9A84C" strokeWidth="0.4" opacity="0.5">
            <line x1="50" y1="5" x2="50" y2="95" />
            <line x1="5" y1="50" x2="95" y2="50" />
            <line x1="18" y1="18" x2="82" y2="82" />
            <line x1="82" y1="18" x2="18" y2="82" />
          </g>
          <polygon points="50,8 62,35 92,35 68,53 77,80 50,63 23,80 32,53 8,35 38,35"
            fill="rgba(201,168,76,0.06)" stroke="#C9A84C" strokeWidth="0.5" />
          <g fill="#C9A84C" opacity="0.8">
            <circle cx="50" cy="8" r="1.5" />
            <circle cx="92" cy="35" r="1.5" />
            <circle cx="77" cy="80" r="1.5" />
            <circle cx="23" cy="80" r="1.5" />
            <circle cx="8" cy="35" r="1.5" />
          </g>
        </svg>

        <h1 className="gold-text" style={{ fontFamily: "Cinzel Decorative, serif", fontSize: "clamp(22px,5vw,34px)", letterSpacing: 3, lineHeight: 1.3 }}>
          Jyotish Darshan
        </h1>
        <p className="mt-2 italic" style={{ color: "var(--muted)", fontSize: 17 }}>
          Vedic Kundli · AI Chart Interpretation
        </p>
        <span className="block mt-3" style={{ color: "var(--gold)", fontSize: 20, letterSpacing: 8 }}>✦ ✧ ✦</span>
      </header>

      {step === "form" ? (
        <BirthForm onSubmit={handleGenerate} loading={loading} />
      ) : (
        chart && details && (
          <div className="animate-fadeInUp space-y-5">
            <div className="mystic-card p-5 flex items-center justify-between">
              <div>
                <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 13, color: "var(--gold)", letterSpacing: 2 }}>
                  {details.name || "Native"}
                </div>
                <div className="text-sm mt-1 italic" style={{ color: "var(--dim)" }}>
                  {details.dob} · {details.tob} · {details.pob}
                </div>
                <div className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  Lagna: <span style={{ color: "var(--gold-light)" }}>{chart.lagna.symbol} {chart.lagna.rashi}</span>
                  {" · "}Moon: <span style={{ color: "var(--gold-light)" }}>
                    {chart.planets.find(p => p.key === "mo")?.position.nakshatra} Nakshatra
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStep("form")}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ border: "0.5px solid rgba(201,168,76,0.3)", color: "var(--dim)", background: "transparent", cursor: "pointer" }}
              >
                ← New Chart
              </button>
            </div>

            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--surface2)" }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="flex-1 py-2 px-2 rounded-lg text-center transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "Cinzel Decorative, serif",
                    fontSize: 9,
                    letterSpacing: 0.5,
                    background: activeTab === t.key ? "rgba(201,168,76,0.15)" : "transparent",
                    border: `0.5px solid ${activeTab === t.key ? "rgba(201,168,76,0.4)" : "transparent"}`,
                    color: activeTab === t.key ? "var(--gold)" : "var(--dim)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mystic-card p-5">
              {activeTab === "chart" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">⬡ BIRTH CHART — NORTH INDIAN STYLE</div><KundliChartSVG chart={chart} /></>)}
              {activeTab === "planets" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">☽ PLANETARY POSITIONS</div><PlanetTable chart={chart} /></>)}
              {activeTab === "yogas" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">✦ PLANETARY YOGAS</div><YogaCards chart={chart} /></>)}
              {activeTab === "dasha" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">♄ VIMSHOTTARI DASHA</div><DashaTimeline chart={chart} /></>)}
              {activeTab === "interpretation" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">☉ AI INTERPRETATION</div><InterpretationPanel details={details} chart={chart} /></>)}
              {activeTab === "chat" && (<><div className="text-xs font-cinzel text-gold tracking-widest mb-4">💬 CHART CONSULTATION</div><ChartChat details={details} chart={chart} /></>)}
            </div>
          </div>
        )
      )}

      <footer className="text-center mt-12 text-xs italic" style={{ color: "var(--dim)" }}>
        Jyotish Darshan · Vedic Astrology
      </footer>
    </div>
  );
}