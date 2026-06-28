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
}

interface Props {
  onLoad: (chart: SavedChart) => void;
}

export default function MyCharts({ onLoad }: Props) {
  const [charts, setCharts]     = useState<SavedChart[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isOpen, setIsOpen]     = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

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

  if (!loggedIn || loading) return null;
  if (charts.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem", position: "relative" }}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: "100%",
          padding: "0.75rem 1.25rem",
          background: "var(--surface)",
          border: "0.5px solid rgba(201,168,76,0.3)",
          borderRadius: 12,
          color: "var(--gold)",
          fontFamily: "Cinzel Decorative, serif",
          fontSize: 10,
          letterSpacing: 2,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
      >
        <span>{"✦"} MY SAVED CHARTS ({charts.length})</span>
        <span style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>

      {isOpen && (
        <div style={{
          marginTop: 4,
          background: "var(--surface)",
          border: "0.5px solid rgba(201,168,76,0.25)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {charts.map((c, i) => (
            <div
              key={c.id}
              onClick={() => { onLoad(c); setIsOpen(false); }}
              style={{
                padding: "0.85rem 1.25rem",
                cursor: "pointer",
                borderBottom: i < charts.length - 1 ? "0.5px solid rgba(201,168,76,0.08)" : "none",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 12,
                  color: "var(--gold)",
                  marginBottom: 2,
                }}>
                  {c.name || "Unnamed Chart"}
                </div>
                <div style={{ fontSize: 12, color: "#9E96B8" }}>
                  {c.dob} · {c.tob} · {c.pob}
                </div>
              </div>
              <div style={{
                fontSize: 10,
                color: "#C9A84C",
                fontFamily: "Cinzel, serif",
                letterSpacing: 1,
                opacity: 0.7,
              }}>
                LOAD →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}