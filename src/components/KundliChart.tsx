"use client";
import type { KundliChart, PlanetKey } from "@/types";
import { PLANET_META, RASHI_SYMBOLS, RASHIS } from "@/lib/astro";

interface Props {
  chart: KundliChart;
}

// North Indian chart: fixed house positions in a 4x4 grid
// Houses are fixed; Rashis rotate based on Lagna
const CELL_MAP = [
  { pos: [0,0], house: 12 }, { pos: [0,1], house: 1  }, { pos: [0,2], house: 2  }, { pos: [0,3], house: 3  },
  { pos: [1,0], house: 11 }, { pos: [1,1], house: null }, { pos: [1,2], house: null }, { pos: [1,3], house: 4  },
  { pos: [2,0], house: 10 }, { pos: [2,1], house: null }, { pos: [2,2], house: null }, { pos: [2,3], house: 5  },
  { pos: [3,0], house: 9  }, { pos: [3,1], house: 8  }, { pos: [3,2], house: 7  }, { pos: [3,3], house: 6  },
];

const SIZE = 320;
const CELL = SIZE / 4;

function Cell({ row, col, house, chart }: {
  row: number; col: number; house: number | null; chart: KundliChart;
}) {
  const x = col * CELL;
  const y = row * CELL;
  const isLagna = house === 1;
  const isVoid = house === null;

  if (isVoid) {
    return (
      <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2}
        fill="#0A0820" stroke="transparent" />
    );
  }

  const houseData = chart.houses[house - 1];
  const rashiIdx = houseData.rashiIndex;
  const planets = houseData.planets;

  return (
    <g>
      <rect
        x={x+1} y={y+1} width={CELL-2} height={CELL-2}
        fill={isLagna ? "#1C1838" : "#181530"}
        stroke={isLagna ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)"}
        strokeWidth={isLagna ? 1 : 0.5}
        rx="2"
      />
      {/* House number */}
      <text x={x+7} y={y+14} fontSize="9" fill="rgba(201,168,76,0.6)"
        fontFamily="Cinzel Decorative, serif">{house}</text>
      {/* Rashi symbol */}
      <text x={x+CELL-8} y={y+14} fontSize="10" fill="rgba(201,168,76,0.5)"
        textAnchor="middle">{RASHI_SYMBOLS[rashiIdx]}</text>
      {/* Rashi name */}
      <text x={x+CELL/2} y={y+CELL/2-6} fontSize="8" fill="#7B7499"
        textAnchor="middle" fontStyle="italic">
        {RASHIS[rashiIdx].substring(0,3)}
      </text>
      {/* Planets */}
      {planets.slice(0, 4).map((pk: PlanetKey, i: number) => {
        const col2 = i % 2;
        const row2 = Math.floor(i / 2);
        return (
          <text
            key={pk}
            x={x + 16 + col2 * 22}
            y={y + CELL/2 + 10 + row2 * 14}
            fontSize="14"
            fill="#E8C96A"
            textAnchor="middle"
          >
            {PLANET_META[pk].symbol}
          </text>
        );
      })}
      {isLagna && (
        <text x={x+CELL/2} y={y+CELL-8} fontSize="8" fill="#C9A84C"
          textAnchor="middle" fontFamily="Cinzel Decorative, serif">
          LAG
        </text>
      )}
    </g>
  );
}

export default function KundliChartSVG({ chart }: Props) {
  return (
    <div className="flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: "100%" }}
      >
        {/* Diagonal lines for North Indian style */}
        <line x1={CELL} y1={CELL} x2={CELL*3} y2={CELL*3}
          stroke="rgba(201,168,76,0.1)" strokeWidth="0.5"/>
        <line x1={CELL*3} y1={CELL} x2={CELL} y2={CELL*3}
          stroke="rgba(201,168,76,0.1)" strokeWidth="0.5"/>

        {CELL_MAP.map(({ pos: [row, col], house }) => (
          <Cell key={`${row}-${col}`} row={row} col={col} house={house} chart={chart} />
        ))}
      </svg>
    </div>
  );
}
