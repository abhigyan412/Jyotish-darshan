"use client";
import type { KundliChart } from "@/types";

interface Props { chart: KundliChart; }

export default function PlanetTable({ chart }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "0.5px solid rgba(201,168,76,0.25)" }}>
            {["Planet","Sign","Deg","House","Nakshatra","Status"].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs tracking-widest"
                style={{ color: "var(--gold)", fontFamily: "Cinzel Decorative, serif" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.planets.map(p => {
            const flags: string[] = [];
            if (p.isRetrograde) flags.push("(R)");
            if (p.isExalted) flags.push("Exalted");
            if (p.isDebilitated) flags.push("Debil.");
            if (p.isCombust) flags.push("Combust");
            return (
              <tr key={p.key} style={{ borderBottom: "0.5px solid rgba(201,168,76,0.08)" }}
                className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2 px-3">
                  <span className="text-lg mr-2">{p.symbol}</span>
                  <span style={{ color: "var(--text)", fontSize: 15 }}>{p.name}</span>
                </td>
                <td className="py-2 px-3" style={{ color: "#E8C96A" }}>
                  {p.position.symbol} {p.position.rashi}
                </td>
                <td className="py-2 px-3" style={{ color: "var(--muted)", fontSize: 14 }}>
                  {p.position.degrees.toFixed(2)}°
                </td>
                <td className="py-2 px-3" style={{ color: "var(--text)" }}>
                  H{p.house}
                </td>
                <td className="py-2 px-3" style={{ color: "var(--dim)", fontSize: 13, fontStyle: "italic" }}>
                  {p.position.nakshatra} P{p.position.nakshatraPada}
                </td>
                <td className="py-2 px-3 text-xs" style={{ color: flags.includes("Exalted") ? "#C9A84C" : flags.includes("Debil.") ? "#E24B4A" : "var(--dim)" }}>
                  {flags.join(" ") || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
