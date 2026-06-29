"use client";
import type { KundliChart } from "@/types";
import { PLANET_META } from "@/lib/astro";

interface Props { chart: KundliChart; }

export default function DashaTimeline({ chart }: Props) {
  const activeDasha = chart.dashas.find(d => d.isActive);

  return (
    <div className="space-y-3">
      <div className="text-xs mb-4" style={{ color: "#9E96B8" }}>
        Vimshottari Dasha — 120-year planetary cycle from Moon's nakshatra lord
      </div>

      {chart.dashas.map(d => {
        const isActive = d.isActive;
        const activeAntar = d.antardasha?.find(a => a.isActive);
        return (
          <div key={d.planet}
            className="rounded-lg px-4 py-3 transition-all"
            style={{
              background: isActive ? "rgba(201,168,76,0.08)" : "var(--surface2)",
              border: `0.5px solid ${isActive ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.12)"}`,
            }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{d.symbol}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 11, color: "var(--gold)", letterSpacing: 1 }}>
                    {d.planetName} Mahadasha
                  </span>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(201,168,76,0.2)", color: "var(--gold-light)", fontSize: 11 }}>
                      Active
                    </span>
                  )}
                </div>
                <div className="text-sm mt-0.5" style={{ color: "#9E96B8" }}>
                  {new Date(d.startDate).getFullYear()} - {new Date(d.endDate).getFullYear()} · {d.years} years
                </div>
                {isActive && activeAntar && (
                  <div className="text-sm mt-1" style={{ color: "#C4BEDD" }}>
                    Current Antardasha: {PLANET_META[activeAntar.planet].symbol} {activeAntar.planetName}
                    {" · ends "}
                    {new Date(activeAntar.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
              <div className="text-right text-xs" style={{ color: "#9E96B8" }}>
                {d.years}y
              </div>
            </div>

            {/* Progress bar for active dasha */}
            {isActive && (() => {
              const total = new Date(d.endDate).getTime() - new Date(d.startDate).getTime();
              const elapsed = Date.now() - new Date(d.startDate).getTime();
              const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
              return (
                <div className="mt-2 h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(201,168,76,0.1)" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #C9A84C, #E8C96A)" }} />
                </div>
              );
            })()}
          </div>
        );
      })}

      {activeDasha && (
        <div className="mt-4 p-4 rounded-lg" style={{ background: "#0A0820", border: "0.5px solid rgba(201,168,76,0.2)" }}>
          <div className="text-xs font-cinzel text-gold tracking-widest mb-3">ANTARDASHA BREAKDOWN</div>
          {activeDasha.antardasha?.map(a => (
            <div key={a.planet} className="flex items-center gap-2 py-1.5"
              style={{ borderBottom: "0.5px solid rgba(201,168,76,0.06)" }}>
              <span className="text-base">{PLANET_META[a.planet].symbol}</span>
              <span className="flex-1 text-sm" style={{ color: a.isActive ? "var(--gold-light)" : "var(--dim)" }}>
                {a.planetName}
              </span>
              <span className="text-xs" style={{ color: "#9E96B8" }}>
                {new Date(a.startDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
                {" – "}
                {new Date(a.endDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}
              </span>
              {a.isActive && <span style={{ color: "var(--gold)", fontSize: 10 }}>{"✦"}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}