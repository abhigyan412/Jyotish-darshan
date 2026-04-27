"use client";
import type { KundliChart } from "@/types";
import { PLANET_META } from "@/lib/astro";

interface Props { chart: KundliChart; }

export default function YogaCards({ chart }: Props) {
  if (chart.yogas.length === 0) {
    return (
      <div className="text-center py-8 italic" style={{ color: "var(--dim)" }}>
        No prominent yogas detected in this chart.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {chart.yogas.map(y => (
        <div key={y.name} className="rounded-lg p-4"
          style={{
            background: "var(--surface2)",
            border: `0.5px solid ${y.isBenefic ? "rgba(201,168,76,0.3)" : "rgba(226,75,74,0.3)"}`,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: y.isBenefic ? "var(--gold)" : "#E24B4A", fontSize: 16 }}>
              {y.isBenefic ? "✦" : "⚠"}
            </span>
            <span style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 11, color: y.isBenefic ? "var(--gold)" : "#E24B4A", letterSpacing: 1 }}>
              {y.name}
            </span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{
                background: y.strength === "strong" ? "rgba(201,168,76,0.15)" : "rgba(158,150,184,0.15)",
                color: y.strength === "strong" ? "var(--gold)" : "var(--muted)",
                fontSize: 10,
              }}>
              {y.strength}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {y.description}
          </p>
          <div className="mt-2 flex gap-1 flex-wrap">
            {y.planets.map(pk => (
              <span key={pk} className="text-xs px-2 py-0.5 rounded"
                style={{ background: "rgba(201,168,76,0.08)", color: "var(--dim)" }}>
                {PLANET_META[pk].symbol} {PLANET_META[pk].name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
