"use client";
import { useState, useEffect } from "react";
import type { BirthDetails, KundliChart } from "@/types";
import { } from "@/lib/astro";
import { calculateKundli, getTransitPlanets } from "@/lib/astro";
import BirthForm from "@/components/BirthForm";
import KundliChartSVG from "@/components/KundliChart";
import PlanetTable from "@/components/PlanetTable";
import DashaTimeline from "@/components/DashaTimeline";
import InterpretationPanel from "@/components/InterpretationPanel";
import YogaCards from "@/components/YogaCards";
import ChartChat from "@/components/ChartChat";
import UpgradeModal from "@/components/UpgradeModal";
import MyCharts from "@/components/MyCharts";
import AuthButton from "@/components/AuthButton";

type Tab = "chart" | "planets" | "yogas" | "dasha" | "interpretation" | "chat";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "chart",          label: "Chart",      icon: "⬡" },
  { key: "planets",        label: "Planets",    icon: "☽" },
  { key: "yogas",          label: "Yogas",      icon: "✦" },
  { key: "dasha",          label: "Dasha",      icon: "♄" },
  { key: "interpretation", label: "AI Reading", icon: "☉" },
  { key: "chat",           label: "Ask Chart",  icon: "💬" },
];

export default function AppPage() {
  const [step, setStep]           = useState<"form" | "result">("form");
  const [details, setDetails]     = useState<BirthDetails | null>(null);
  const [chart, setChart]         = useState<KundliChart | null>(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chart");
  const [chartId, setChartId]     = useState<string | null>(null);
  const [transitPlanets, setTransitPlanets] = useState<any[]>([]);
  const [upgradeModal, setUpgradeModal] = useState<{
    reason: string;
    limitType: "message" | "chart" | "feature";
  } | null>(null);
  const [mountedTabs, setMountedTabs]       = useState<Set<Tab>>(new Set(["chart"]));
  const [preloadedHistory, setPreloadedHistory] = useState<any[]>([]);

  // Auto-open upgrade modal if coming from pricing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("upgrade");
    if (plan === "weekly" || plan === "pro") {
      setUpgradeModal({
        reason: `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan to unlock full access.`,
        limitType: "feature",
      });
    }
  }, []);

  async function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setMountedTabs(prev => new Set([...prev, tab]));

    // Preload chat history in background when chat tab clicked
    if (tab === "chat" && chartId && preloadedHistory.length === 0) {
      try {
        const res = await fetch(`/api/conversations?chartId=${chartId}`);
        if (res.ok) {
          const { conversations } = await res.json();
          if (conversations?.length) {
            const msgRes = await fetch(`/api/conversations/${conversations[0].id}/messages`);
            if (msgRes.ok) {
              const { messages } = await msgRes.json();
              if (messages?.length) setPreloadedHistory(messages);
            }
          }
        }
      } catch { /* silent */ }
    }
  }

  async function handleGenerate(d: BirthDetails) {
    setLoading(true);
    setMountedTabs(new Set(["chart"]));
    setActiveTab("chart");
    setPreloadedHistory([]);

    try {
      const c = calculateKundli(d);
      const transits = getTransitPlanets();
      setTransitPlanets(transits);
      setDetails(d);
      setChart(c);
      setChartId(null);
      setStep("result");

      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase");
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await fetch("/api/charts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name:       d.name || "My Chart",
              dob:        d.dob,
              tob:        d.tob,
              pob:        d.pob,
              latitude:   d.lat,
              longitude:  d.lon,
              timezone:   String(d.timezone),
              chart_data: c,
              is_primary: false,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            setChartId(json.chart?.id ?? null);
          } else {
            const err = await res.json();
            if (err.error?.includes("UPGRADE_REQUIRED")) {
              setUpgradeModal({
                reason: "You've reached your chart limit. Upgrade to save more charts.",
                limitType: "chart",
              });
            }
          }
        }
      } catch (err) {
        console.log("Chart save failed:", err);
      }

    } catch (e) {
      alert("Calculation error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Nav bar */}
      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center",
        marginBottom: "1.5rem", gap: "0.75rem",
      }}>
        <a href="/" style={{
          fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "2px",
          color: "#C4BEDD", textDecoration: "none", transition: "color 0.2s",
          padding: "6px 14px",
          border: "0.5px solid rgba(201,168,76,0.25)",
          borderRadius: "20px",
          display: "inline-flex", alignItems: "center", gap: "6px",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
          onMouseLeave={e => (e.currentTarget.style.color = "#C4BEDD")}
        >
          ← Home
        </a>
        <AuthButton />
      </div>

      <header className="text-center mb-8">
        <svg width="80" height="80" viewBox="0 0 100 100" className="mx-auto mb-4 animate-rotateSlow">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="8"  fill="rgba(201,168,76,0.4)" stroke="#C9A84C" strokeWidth="1" />
          <g stroke="#C9A84C" strokeWidth="0.6" opacity="0.8">
            <line x1="50" y1="5"  x2="50" y2="95" />
            <line x1="5"  y1="50" x2="95" y2="50" />
            <line x1="18" y1="18" x2="82" y2="82" />
            <line x1="82" y1="18" x2="18" y2="82" />
          </g>
          <polygon points="50,8 62,35 92,35 68,53 77,80 50,63 23,80 32,53 8,35 38,35"
            fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="0.8" />
          <g fill="#C9A84C" opacity="1">
            <circle cx="50" cy="8"  r="1.5" />
            <circle cx="92" cy="35" r="1.5" />
            <circle cx="77" cy="80" r="1.5" />
            <circle cx="23" cy="80" r="1.5" />
            <circle cx="8"  cy="35" r="1.5" />
          </g>
        </svg>
        <h1
          className="gold-text"
          style={{ fontFamily: "Cinzel Decorative, serif", fontSize: "clamp(22px,5vw,34px)", letterSpacing: 3, lineHeight: 1.3 }}
        >
          Jyotish Darshan
        </h1>
        <p className="mt-2" style={{ color: "#C4BEDD", fontSize: 17 }}>
          Vedic Kundli · AI Chart Interpretation
        </p>
        <span className="block mt-3" style={{ color: "var(--gold)", fontSize: 20, letterSpacing: 8 }}>✦ ✧ ✦</span>
      </header>

      {step === "form" ? (
        <>
          <MyCharts onLoad={(saved) => {
            fetch(`/api/charts`)
              .then(r => r.json())
              .then(json => {
                const full = json.charts?.find((c: any) => c.id === saved.id);
                if (full?.chart_data) {
                  setChart(full.chart_data);
                  setDetails({
                    name:     full.name,
                    dob:      full.dob,
                    tob:      full.tob,
                    pob:      full.pob,
                    lat:      full.latitude ?? 0,
                    lon:      full.longitude ?? 0,
                    timezone: parseFloat(full.timezone ?? "5.5"),
                  });
                  setChartId(full.id);
                  setPreloadedHistory([]);
                  setStep("result");
                }
              });
          }} />
          <BirthForm onSubmit={handleGenerate} loading={loading} />
        </>
      ) : (
        chart && details && (
          <div className="animate-fadeInUp space-y-5">

            {/* Chart identity bar */}
            <div className="mystic-card p-5 flex items-center justify-between">
              <div>
                <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 13, color: "var(--gold)", letterSpacing: 2 }}>
                  {details.name || "Native"}
                </div>
                <div className="text-sm mt-1" style={{ color: "#9E96B8" }}>
                  {details.dob} · {details.tob} · {details.pob}
                </div>
                <div className="text-sm mt-0.5" style={{ color: "#C4BEDD" }}>
                  Lagna:{" "}
                  <span style={{ color: "var(--gold-light)" }}>
                    {chart.lagna.symbol} {chart.lagna.rashi}
                  </span>
                  {" · "}
                  Moon:{" "}
                  <span style={{ color: "var(--gold-light)" }}>
                    {chart.planets.find(p => p.key === "mo")?.position.nakshatra} Nakshatra
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setStep("form"); setChartId(null); setPreloadedHistory([]); }}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  border: "0.5px solid rgba(201,168,76,0.3)",
                  color: "#9E96B8", background: "transparent", cursor: "pointer",
                }}
              >
                ← New Chart
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--surface2)" }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className="flex-1 py-2 px-2 rounded-lg text-center transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "Cinzel Decorative, serif",
                    fontSize: 11, letterSpacing: 0.5,
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

            {/* Tab panels */}
            <div className="mystic-card p-5">

              <div style={{ display: activeTab === "chart" ? "block" : "none" }}>
                <div className="text-xs font-cinzel text-gold tracking-widest mb-4">⬡ BIRTH CHART — NORTH INDIAN STYLE</div>
                <KundliChartSVG chart={chart} />
              </div>

              {mountedTabs.has("planets") && (
                <div style={{ display: activeTab === "planets" ? "block" : "none" }}>
                  <div className="text-xs font-cinzel text-gold tracking-widest mb-4">☽ PLANETARY POSITIONS</div>
                  <PlanetTable chart={chart} />
                </div>
              )}

              {mountedTabs.has("yogas") && (
                <div style={{ display: activeTab === "yogas" ? "block" : "none" }}>
                  <div className="text-xs font-cinzel text-gold tracking-widest mb-4">✦ PLANETARY YOGAS</div>
                  <YogaCards chart={chart} />
                </div>
              )}

              {mountedTabs.has("dasha") && (
                <div style={{ display: activeTab === "dasha" ? "block" : "none" }}>
                  <div className="text-xs font-cinzel text-gold tracking-widest mb-4">♄ VIMSHOTTARI DASHA</div>
                  <DashaTimeline chart={chart} />
                </div>
              )}

              {mountedTabs.has("interpretation") && (
                <div style={{ display: activeTab === "interpretation" ? "block" : "none" }}>
                  <div className="text-xs font-cinzel text-gold tracking-widest mb-4">☉ AI INTERPRETATION</div>
                  <InterpretationPanel details={details} chart={chart} />
                </div>
              )}

              {mountedTabs.has("chat") && (
                <div style={{ display: activeTab === "chat" ? "block" : "none" }}>
                  <div className="text-xs font-cinzel text-gold tracking-widest mb-4">💬 CHART CONSULTATION</div>
                  <ChartChat
                    details={details}
                    chart={chart}
                    chartId={chartId}
                    transitPlanets={transitPlanets}
                    preloadedHistory={preloadedHistory}
                    onUpgradeRequired={(reason, limitType) => setUpgradeModal({ reason, limitType })}
                  />
                </div>
              )}

            </div>
          </div>
        )
      )}

      {upgradeModal && (
        <UpgradeModal
          reason={upgradeModal.reason}
          limitType={upgradeModal.limitType}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      <footer className="text-center mt-12 text-xs" style={{ color: "#9E96B8" }}>
        Jyotish Darshan · Vedic Astrology
      </footer>
    </div>
  );
}