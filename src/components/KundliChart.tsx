"use client";
import type { KundliChart, PlanetKey } from "@/types";
import { RASHI_SYMBOLS, RASHIS } from "@/lib/astro";

interface Props {
  chart: KundliChart;
}

const SIZE = 340;
const C    = SIZE / 4; // cell = 85

// Short names — clear and readable
const PLANET_SHORT: Record<PlanetKey, string> = {
  su: "Sun",
  mo: "Mon",
  ma: "Mar",
  me: "Mer",
  ju: "Jup",
  ve: "Ven",
  sa: "Sat",
  ra: "Rah",
  ke: "Ket",
};

// Color by nature
const PLANET_COLOR: Record<PlanetKey, string> = {
  su: "#F4C66A",  // Sun — warm gold
  mo: "#B8D4F8",  // Moon — pale blue
  ma: "#F47C6A",  // Mars — red-orange
  me: "#8AE0A0",  // Mercury — green
  ju: "#F4E89A",  // Jupiter — light yellow
  ve: "#F4A8D0",  // Venus — pink
  sa: "#A898C8",  // Saturn — purple-grey
  ra: "#C8A878",  // Rahu — tan
  ke: "#98B8C8",  // Ketu — slate
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
  const x        = col * C;
  const y        = row * C;
  const isLagna  = house === 1;
  const houseData = chart.houses[house - 1];
  const rashiIdx  = houseData.rashiIndex;
  const planets   = houseData.planets;

  // Planet name layout — stack vertically in center of cell
  // Up to 5 planets fit cleanly at font-size 8.5
  const planetFontSize = 8.5;
  const lineHeight     = 11;
  const totalH         = planets.length * lineHeight;
  const startY         = y + C / 2 - totalH / 2 + lineHeight / 2 + 4;

  return (
    <g>
      {/* Cell background */}
      <rect
        x={x + 1} y={y + 1}
        width={C - 2} height={C - 2}
        fill={isLagna ? "#1C1840" : "#130F2A"}
        stroke={isLagna ? "rgba(201,168,76,0.75)" : "rgba(201,168,76,0.18)"}
        strokeWidth={isLagna ? 1.2 : 0.5}
        rx="3"
      />

      {/* House number — top left */}
      <text
        x={x + 6} y={y + 13}
        fontSize="8.5"
        fill="rgba(201,168,76,0.5)"
        fontFamily="Cinzel Decorative, serif"
      >
        {house}
      </text>

      {/* Rashi short name — top right */}
      <text
        x={x + C - 5} y={y + 13}
        fontSize="7.5"
        fill="rgba(201,168,76,0.38)"
        textAnchor="end"
        fontStyle="normal"
      >
        {RASHIS[rashiIdx].substring(0, 3)}
      </text>

      {/* Planet short names stacked vertically */}
      {planets.slice(0, 5).map((pk: PlanetKey, i: number) => (
        <text
          key={pk}
          x={x + C / 2}
          y={startY + i * lineHeight}
          fontSize={planetFontSize}
          fill={PLANET_COLOR[pk]}
          textAnchor="middle"
          fontFamily="inherit"
          fontWeight="500"
        >
          {PLANET_SHORT[pk]}
        </text>
      ))}

      {/* LAG label — bottom center of house 1 */}
      {isLagna && (
        <text
          x={x + C / 2} y={y + C - 6}
          fontSize="7"
          fill="rgba(201,168,76,0.75)"
          textAnchor="middle"
          fontFamily="Cinzel Decorative, serif"
          letterSpacing="1.5"
        >
          LAG
        </text>
      )}
    </g>
  );
}

export default function KundliChartSVG({ chart }: Props) {
  const cx  = SIZE / 2;
  const cy  = SIZE / 2;
  const top = { x: cx,    y: C    };
  const rt  = { x: C * 3, y: cy   };
  const bot = { x: cx,    y: C * 3 };
  const lt  = { x: C,     y: cy   };
  const tl  = { x: C,     y: C    };
  const tr  = { x: C * 3, y: C    };
  const br  = { x: C * 3, y: C * 3 };
  const bl  = { x: C,     y: C * 3 };

  const pts = (points: { x: number; y: number }[]) =>
    points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: "100%", display: "block" }}
      >
        {/* Outer border */}
        <rect
          x={1} y={1} width={SIZE - 2} height={SIZE - 2}
          fill="none"
          stroke="rgba(201,168,76,0.25)"
          strokeWidth="0.8"
          rx="4"
        />

        {/* 12 outer house cells */}
        {OUTER_CELLS.map(({ row, col, house }) => (
          <OuterCell
            key={house}
            row={row} col={col}
            house={house}
            chart={chart}
          />
        ))}

        {/* Center diamond — 4 triangles */}
        <polygon points={pts([tl, tr, top])} fill="#0D0B1E" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([tr, br, rt])}  fill="#0D0B1E" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([br, bl, bot])} fill="#0D0B1E" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <polygon points={pts([bl, tl, lt])}  fill="#0D0B1E" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />

        {/* Diamond outline */}
        <polygon
          points={pts([top, rt, bot, lt])}
          fill="none"
          stroke="rgba(201,168,76,0.35)"
          strokeWidth="0.8"
        />

        {/* Cross lines */}
        <line x1={tl.x} y1={tl.y} x2={br.x} y2={br.y} stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />
        <line x1={tr.x} y1={tr.y} x2={bl.x} y2={bl.y} stroke="rgba(201,168,76,0.12)" strokeWidth="0.5" />

        {/* Center ornament */}
        <circle cx={cx} cy={cy} r={16} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={8}  fill="rgba(201,168,76,0.07)" stroke="rgba(201,168,76,0.3)" strokeWidth="0.5" />
        <text x={cx} y={cy + 3.5} fontSize="9" fill="rgba(201,168,76,0.5)" textAnchor="middle">✦</text>

        {/* Inner grid lines */}
        <line x1={C} y1={C} x2={C*3} y2={C}   stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" />
        <line x1={C} y1={C*3} x2={C*3} y2={C*3} stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" />
        <line x1={C} y1={C} x2={C} y2={C*3}   stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" />
        <line x1={C*3} y1={C} x2={C*3} y2={C*3} stroke="rgba(201,168,76,0.1)" strokeWidth="0.4" />
      </svg>
    </div>
  );
}