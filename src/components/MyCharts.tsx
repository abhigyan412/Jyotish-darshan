"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface SavedChart {
  id: string;
  name: string;
  dob: string;
  tob: string;
  pob: string;
  created_at: string;
  chart_data?: any;
}

interface Props {
  onLoad: (chart: SavedChart) => void;
}

const RASHI_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const PLANET_SYMBOLS = ["☉", "☽", "♂", "♃", "♀", "♄", "☿"];

function getSymbol(chart: SavedChart): string {
  // Use lagna lord planet symbol based on rashi
  const lagnaLords: Record<number, number> = {
    0: 2,  // Aries → Mars ♂
    1: 4,  // Taurus → Venus ♀
    2: 6,  // Gemini → Mercury ☿
    3: 1,  // Cancer → Moon ☽
    4: 0,  // Leo → Sun ☉
    5: 6,  // Virgo → Mercury ☿
    6: 4,  // Libra → Venus ♀
    7: 2,  // Scorpio → Mars ♂
    8: 3,  // Sagittarius → Jupiter ♃
    9: 5,  // Capricorn → Saturn ♄
    10: 5, // Aquarius → Saturn ♄
    11: 3, // Pisces → Jupiter ♃
  };
  const rashiIndex = chart.chart_data?.lagna?.rashiIndex;
  if (rashiIndex !== undefined) {
    return PLANET_SYMBOLS[lagnaLords[rashiIndex % 12] ?? 0];
  }
  // fallback to name
  return PLANET_SYMBOLS[chart.name ? chart.name.charCodeAt(0) % PLANET_SYMBOLS.length : 0];
}

function getRashi(chart: SavedChart): string {
  const rashiIndex = chart.chart_data?.lagna?.rashiIndex;
  if (rashiIndex !== undefined) return RASHI_SYMBOLS[rashiIndex % 12];
  const idx = chart.dob ? (parseInt(chart.dob.split("-")[1] || "1") - 1) % 12 : 0;
  return RASHI_SYMBOLS[idx];
}

function formatDate(dob: string): string {
  if (!dob) return "";
  const [y, m, d] = dob.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[parseInt(m)-1]} ${y}`;
}

export default function MyCharts({ onLoad }: Props) {
  const [charts, setCharts]       = useState<SavedChart[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isOpen, setIsOpen]       = useState(false);
  const [loggedIn, setLoggedIn]   = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setLoggedIn(true);
      const res = await fetch("/api/charts");
      if (res.ok) {
        const json = await res.json();
        setCharts(json.charts ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (!loggedIn || loading || charts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes chartFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chart-item-hover {
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .chart-item-hover:hover {
          background: rgba(201,168,76,0.07) !important;
          border-color: rgba(201,168,76,0.35) !important;
          transform: translateX(2px);
        }
      `}</style>

      <div style={{ marginBottom: "1.5rem" }}>

        {/* Header button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            width: "100%",
            padding: "0.9rem 1.25rem",
            background: isOpen ? "rgba(201,168,76,0.06)" : "var(--surface)",
            border: `0.5px solid ${isOpen ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.2)"}`,
            borderRadius: isOpen ? "14px 14px 0 0" : "14px",
            color: "var(--gold)",
            fontFamily: "Cinzel, serif",
            fontSize: 11,
            letterSpacing: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, opacity: 0.8 }}>{"☽"}</span>
            <span>MY SAVED CHARTS</span>
            <span style={{
              background: "rgba(201,168,76,0.15)",
              border: "0.5px solid rgba(201,168,76,0.3)",
              borderRadius: 20, padding: "1px 8px",
              fontSize: 10, color: "var(--gold-light)",
            }}>
              {charts.length}
            </span>
          </div>
          <span style={{
            transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: 12, opacity: 0.6,
          }}>{"▾"}</span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div style={{
            background: "var(--surface)",
            border: "0.5px solid rgba(201,168,76,0.25)",
            borderTop: "none",
            borderRadius: "0 0 14px 14px",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          }}>
            {/* Decorative top strip */}
            <div style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)",
            }} />

            <div style={{ padding: "0.5rem" }}>
              {charts.map((c, i) => (
                <div
                  key={c.id}
                  className="chart-item-hover"
                  onClick={() => { onLoad(c); setIsOpen(false); }}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: "0.85rem 1rem",
                    cursor: "pointer",
                    borderRadius: 10,
                    border: "0.5px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    animation: `chartFadeIn 0.3s cubic-bezier(0.16,1,0.3,1) both`,
                    animationDelay: `${i * 0.05}s`,
                    marginBottom: i < charts.length - 1 ? 2 : 0,
                  }}
                >
                  {/* Planet symbol avatar with real lagna rashi badge */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: hoveredId === c.id
                      ? "rgba(201,168,76,0.15)"
                      : "rgba(201,168,76,0.06)",
                    border: `0.5px solid ${hoveredId === c.id ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                    transition: "all 0.2s",
                    position: "relative",
                  }}>
                    {getSymbol(c)}
                    {/* Real lagna rashi badge */}
                    <span style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "var(--surface2)",
                      border: "0.5px solid rgba(201,168,76,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9,
                    }}>
                      {getRashi(c)}
                    </span>
                  </div>

                  {/* Chart info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 13,
                      color: hoveredId === c.id ? "var(--gold-light)" : "var(--gold)",
                      marginBottom: 3,
                      transition: "color 0.2s",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.name || "Unnamed Chart"}
                    </div>
                    <div style={{
                      fontSize: 11, color: "#9E96B8",
                      display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                    }}>
                      <span>{"☉"} {formatDate(c.dob)}</span>
                      <span style={{ opacity: 0.4 }}>{"·"}</span>
                      <span>{"☽"} {c.tob}</span>
                      <span style={{ opacity: 0.4 }}>{"·"}</span>
                      <span>{c.pob}</span>
                    </div>
                    {/* Show lagna if available */}
                    {c.chart_data?.lagna?.rashi && (
                      <div style={{ fontSize: 10, color: "rgba(201,168,76,0.5)", marginTop: 2 }}>
                        {getRashi(c)} {c.chart_data.lagna.rashi} Lagna
                      </div>
                    )}
                  </div>

                  {/* Load arrow */}
                  <div style={{
                    fontSize: 11,
                    color: hoveredId === c.id ? "var(--gold)" : "#5A5470",
                    fontFamily: "Cinzel, serif", letterSpacing: 1,
                    transition: "all 0.2s",
                    transform: hoveredId === c.id ? "translateX(2px)" : "translateX(0)",
                    display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                  }}>
                    {hoveredId === c.id ? "OPEN" : "→"}
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative footer with zodiac symbols */}
            <div style={{
              padding: "0.6rem 1.25rem",
              borderTop: "0.5px solid rgba(201,168,76,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {RASHI_SYMBOLS.slice(0, 6).map((s, i) => (
                <span key={i} style={{ fontSize: 10, color: "rgba(201,168,76,0.2)" }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}