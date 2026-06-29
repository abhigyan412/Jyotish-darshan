"use client";
import type { KundliChart, PlanetKey } from "@/types";
import { RASHIS } from "@/lib/astro";

interface Props {
  chart: KundliChart;
}

const SIZE = 520;
const C    = SIZE / 4;

const PLANET_SHORT: Record<PlanetKey, string> = {
  su: "Sun", mo: "Mon", ma: "Mar", me: "Mer",
  ju: "Jup", ve: "Ven", sa: "Sat", ra: "Rah", ke: "Ket",
};

const PLANET_COLOR: Record<PlanetKey, string> = {
  su: "#F4C66A", mo: "#B8D4F8", ma: "#F47C6A", me: "#8AE0A0",
  ju: "#F4E89A", ve: "#F4A8D0", sa: "#C8A8E8", ra: "#C8B888", ke: "#98C8D8",
};

const OUTER_CELLS = [
  { row: 0, col: 0, house: 12 },
  { row: 0, col: 1, house: 1  },
  { row: 0, col: 2, house: 2  },
  { row: 0, col: 3, house: 3  },
  { row: 1, col: 3, house: 4  },
  { row: 2, col: 3, house: 5  },
  { row: 3, col: 3, house: 6  },
  { row: 3, col: 2, house: 7  },
  { row: 3, col: 1, house: 8  },
  { row: 3, col: 0, house: 9  },
  { row: 2, col: 0, house: 10 },
  { row: 1, col: 0, house: 11 },
];

function OuterCell({ row, col, house, chart }: {
  row: number; col: number; house: number; chart: KundliChart;
}) {
  const x         = col * C;
  const y         = row * C;
  const isLagna   = house === 1;
  const houseData = chart.houses[house - 1];
  const rashiIdx  = houseData.rashiIndex;
  const planets   = houseData.planets as PlanetKey[];

  const pSize    = 11;
  const lh       = 15;
  const totalH   = planets.length * lh;
  const startY   = y + C / 2 - totalH / 2 + lh / 2;

  return (
    <g>
      {/* Cell background */}
      <rect
        x={x + 1} y={y + 1}
        width={C - 2} height={C - 2}
        fill={isLagna ? "rgba(201,168,76,0.07)" : "rgba(13,11,30,0.95)"}
        stroke={isLagna ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.2)"}
        strokeWidth={isLagna ? 1.5 : 0.5}
        rx="2"
      />

      {/* House number — top left corner */}
      <text
        x={x + 8} y={y + 16}
        fontSize="11"
        fill={isLagna ? "rgba(201,168,76,0.9)" : "rgba(201,168,76,0.45)"}
        fontFamily="Cinzel, serif"
        fontWeight={isLagna ? "600" : "400"}
      >
        {house}
      </text>

      {/* Rashi abbreviation — top right */}
      <text
        x={x + C - 7} y={y + 16}
        fontSize="9.5"
        fill="rgba(201,168,76,0.35)"
        textAnchor="end"
        fontFamily="Cinzel, serif"
      >
        {RASHIS[rashiIdx]?.substring(0, 3)}
      </text>

      {/* Planets stacked in center */}
      {planets.slice(0, 5).map((pk: PlanetKey, i: number) => {
        const planetData = chart.planets.find(p => p.key === pk);
        const isRetro = planetData?.isRetrograde;
        return (
          <g key={pk}>
            <text
              x={x + C / 2}
              y={startY + i * lh}
              fontSize={pSize}
              fill={PLANET_COLOR[pk]}
              textAnchor="middle"
              fontFamily="Cinzel, serif"
              fontWeight="500"
            >
              {PLANET_SHORT[pk]}
            </text>
            {isRetro && (
              <text
                x={x + C / 2 + 18}
                y={startY + i * lh - 3}
                fontSize="8"
                fill={PLANET_COLOR[pk]}
                textAnchor="middle"
                opacity={0.9}
              >
                ®
              </text>
            )}
          </g>
        );
      })}

      {/* LAG label — bottom center */}
      {isLagna && (
        <text
          x={x + C / 2} y={y + C - 8}
          fontSize="9"
          fill="rgba(201,168,76,0.8)"
          textAnchor="middle"
          fontFamily="Cinzel, serif"
          letterSpacing="2"
        >
          LAG
        </text>
      )}
    </g>
  );
}

// Center triangle houses (2 = top-right, 4 = right, 6 = bottom-right, 8 = bottom-left, 10 = left, 12 = top-left)
function CenterTriangle({ points, house, chart }: {
  points: string; house: number; chart: KundliChart; cx: number; cy: number;
}) {
  return (
    <polygon
      points={points}
      fill="rgba(13,11,30,0.9)"
      stroke="rgba(201,168,76,0.2)"
      strokeWidth="0.5"
    />
  );
}

export default function KundliChartSVG({ chart }: Props) {
  const cx  = SIZE / 2;
  const cy  = SIZE / 2;
  const top = { x: cx,    y: C      };
  const rt  = { x: C * 3, y: cy     };
  const bot = { x: cx,    y: C * 3  };
  const lt  = { x: C,     y: cy     };
  const tl  = { x: C,     y: C      };
  const tr  = { x: C * 3, y: C      };
  const br  = { x: C * 3, y: C * 3  };
  const bl  = { x: C,     y: C * 3  };

  const pts = (points: { x: number; y: number }[]) =>
    points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

      {/* Legend */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "6px 16px",
        justifyContent: "center", maxWidth: SIZE,
      }}>
        {(Object.entries(PLANET_SHORT) as [PlanetKey, string][]).map(([key, name]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: PLANET_COLOR[key], display: "inline-block", flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: PLANET_COLOR[key], fontFamily: "Cinzel, serif" }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: "100%", display: "block" }}
      >
        {/* Subtle glow background */}
        <defs>
          <radialGradient id="chartGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#chartGlow)" />

        {/* Outer border — double line effect */}
        <rect x={2} y={2} width={SIZE-4} height={SIZE-4}
          fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="4" rx="4" />
        <rect x={1} y={1} width={SIZE-2} height={SIZE-2}
          fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.8" rx="4" />

        {/* 12 outer house cells */}
        {OUTER_CELLS.map(({ row, col, house }) => (
          <OuterCell key={house} row={row} col={col} house={house} chart={chart} />
        ))}

        {/* Center 4 triangles */}
        <polygon points={pts([tl, tr, top])} fill="rgba(10,8,22,0.95)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([tr, br, rt])}  fill="rgba(10,8,22,0.95)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([br, bl, bot])} fill="rgba(10,8,22,0.95)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([bl, tl, lt])}  fill="rgba(10,8,22,0.95)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />

        {/* Diamond outline */}
        <polygon
          points={pts([top, rt, bot, lt])}
          fill="none"
          stroke="rgba(201,168,76,0.45)"
          strokeWidth="1"
        />

        {/* Inner grid lines */}
        <line x1={C} y1={C} x2={C*3} y2={C}    stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <line x1={C} y1={C*3} x2={C*3} y2={C*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <line x1={C} y1={C} x2={C} y2={C*3}    stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <line x1={C*3} y1={C} x2={C*3} y2={C*3} stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />

        {/* Diagonal cross lines */}
        <line x1={tl.x} y1={tl.y} x2={br.x} y2={br.y} stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
        <line x1={tr.x} y1={tr.y} x2={bl.x} y2={bl.y} stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />

        {/* Center mandala ornament */}
        <circle cx={cx} cy={cy} r={28} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={20} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={12} fill="rgba(201,168,76,0.05)" stroke="rgba(201,168,76,0.35)" strokeWidth="0.8" />
        <text x={cx} y={cy + 5} fontSize="13" fill="rgba(201,168,76,0.6)" textAnchor="middle">✦</text>

        {/* Corner ornaments */}
        {[[4,4],[SIZE-4,4],[4,SIZE-4],[SIZE-4,SIZE-4]].map(([ox,oy], i) => (
          <text key={i} x={ox} y={oy+8} fontSize="8" fill="rgba(201,168,76,0.2)" textAnchor="middle">✦</text>
        ))}
      </svg>

      {/* Lagna info below chart */}
      <div style={{
        display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap",
        marginTop: 4,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 10, color: "rgba(201,168,76,0.5)", letterSpacing: 2, marginBottom: 3 }}>LAGNA</div>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "var(--gold)" }}>
            {chart.lagna.symbol} {chart.lagna.rashi}
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(201,168,76,0.15)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 10, color: "rgba(201,168,76,0.5)", letterSpacing: 2, marginBottom: 3 }}>MOON</div>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "var(--gold)" }}>
            {chart.planets.find(p => p.key === "mo")?.position.rashi}
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(201,168,76,0.15)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 10, color: "rgba(201,168,76,0.5)", letterSpacing: 2, marginBottom: 3 }}>NAKSHATRA</div>
          <div style={{ fontFamily: "Cinzel, serif", fontSize: 13, color: "var(--gold)" }}>
            {chart.planets.find(p => p.key === "mo")?.position.nakshatra}
          </div>
        </div>
      </div>
    </div>
  );
}