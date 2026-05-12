// ============================================================
// salienceEngine.ts
// The core pre-processing layer between raw chart data and AI.
// This runs BEFORE any AI call. Its output — ChartSignature —
// is what gets injected into prompts, NOT the raw chart.
//
// Pipeline:
//   ChartCalculation → salienceEngine → ChartSignature → AI
//
// Key principle: specificity in DATA ≠ specificity in OUTPUT.
// This engine converts data into ranked, high-signal observations.
// ============================================================

import type { PlanetKey, PlanetInfo, KundliChart, BirthDetails } from "@/types";
import { RASHI_LORDS, PLANET_META, RASHIS } from "@/lib/astro";
import { CONTRADICTION_PATTERNS } from "./contradictions";

// ============================================================
// TYPES
// ============================================================

export interface DominantObservation {
  observation: string;       // Plain behavioral language — never astrological jargon
  indicators: string[];      // Internal: which chart factors produced this
  confidenceScore: number;   // 0–1 based on number of converging independent factors
  rarity: number;            // 0–1 how uncommon this combination is
  category: ObservationCategory;
}

export type ObservationCategory =
  | "identity"
  | "emotional"
  | "relationship"
  | "career"
  | "timing"
  | "spiritual"
  | "contradiction";

export interface PlanetaryPressureEntry {
  planet: PlanetKey;
  planetName: string;
  pressureScore: number;
  currentlyActiveMD: boolean;
  currentlyActiveAD: boolean;
  isCurrentlyTransited: boolean;
  keyTheme: string;          // Plain language — what this planet's pressure creates
  shadowTheme: string;       // What goes wrong when unintegrated
}

export interface ActiveHouseEntry {
  house: number;
  activationScore: number;
  theme: string;             // Plain language — what this house activation means right now
  activationSources: string[]; // Transit / Dasha / Natal — which layers are firing
}

export interface TimingConfluence {
  type: TimingTheme;
  confidence: number;        // Only stored if > 0.6
  window: string;            // e.g. "next 8–14 months" — never a specific year
  layers: string[];          // Which dasha + transit layers confirm this
  quality: string;           // What the timing window FEELS like — its texture
}

export type TimingTheme =
  | "marriage"
  | "career_shift"
  | "relocation"
  | "financial_gain"
  | "financial_loss"
  | "health_pressure"
  | "spiritual_opening"
  | "family_change"
  | "public_recognition"
  | "isolation_retreat";

export interface BehavioralContradiction {
  drive1: string;            // First competing drive
  drive2: string;            // Second competing drive
  behavioralResult: string;  // What happens in real life when these collide
  indicators: string[];      // Which chart factors produce each drive
  confidenceScore: number;
  patternId: string;         // From contradictions.ts
}

export interface PartnerSignature {
  layer1_wound: string;        // 7th lord nakshatra core wound
  layer1_gift: string;         // 7th lord nakshatra integrated gift
  layer1_keywords: string;     // 7th lord nakshatra behavioral keywords
  layer2_coloring: string;     // Nakshatra lord of 7th lord — second personality layer
  darakaraka_archetype: string;// Jaimini darakaraka — soul-level partner
  venus_pattern: string;       // How this person experiences love
  recurring_dynamic: string;   // From 7th house aspects — the repeating pattern
  most_specific_observation: string; // Single sharpest observation from all 7 layers
}

export interface ChartSignature {
  // The pre-processed, ranked signal — this replaces raw chart injection
  dominantAxis: DominantObservation[];       // Top 3–5, ordered by confidence × rarity
  planetaryPressure: PlanetaryPressureEntry[]; // All planets, ranked by pressure score
  activeHouses: ActiveHouseEntry[];          // Houses with activation score > threshold
  timingConfluence: TimingConfluence[];      // Only entries with confidence > 0.6
  contradictions: BehavioralContradiction[]; // Pre-computed behavioral tensions
  partnerSignature: PartnerSignature;        // Pre-computed 7-layer spouse profile
  computedAt: string;
  engineVersion: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const ENGINE_VERSION = "1.0.0";

// Rarity scores for specific combinations
// Lower number = rarer = higher salience weight
const RARITY: Record<string, number> = {
  gandanta:                0.05,
  paramochcha:             0.03,  // Exact exaltation within 1°
  moolatrikona_combust:    0.02,
  triple_conjunction:      0.04,
  maha_parivartana:        0.08,
  neechabhanga_raja_yoga:  0.06,
  double_transit:          0.10,
  sade_sati_peak:          0.08,
  yogakaraka_activated:    0.07,
  mutual_aspect_malefic:   0.09,
  debilitated_lagna_lord:  0.06,
  exalted_in_dusthana:     0.05,
  retrograde_atmakaraka:   0.07,
};

// Nakshatra data — keywords and themes for salience
// (subset used for scoring — full data stays in promptEngine)
const NK_LORDS: PlanetKey[] = [
  "ke","ve","su","mo","ma","ra","ju","sa","me",
  "ke","ve","su","mo","ma","ra","ju","sa","me",
  "ke","ve","su","mo","ma","ra","ju","sa","me",
];
const NK_NAMES = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
  "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
  "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha",
  "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
];

const NATURAL_BENEFIC: PlanetKey[] = ["ju", "ve", "mo", "me"];
const NATURAL_MALEFIC: PlanetKey[] = ["sa", "ma", "su", "ra", "ke"];
const DUSTHANA = [6, 8, 12];
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isBenefic(key: PlanetKey): boolean {
  return NATURAL_BENEFIC.includes(key);
}

function getPlanetAspects(key: PlanetKey, fromHouse: number): number[] {
  const a = (o: number) => ((fromHouse - 1 + o) % 12) + 1;
  const aspects = [a(6)];
  if (key === "ma") aspects.push(a(3), a(7));
  if (key === "ju") aspects.push(a(4), a(8));
  if (key === "sa") aspects.push(a(2), a(9));
  if (key === "ra" || key === "ke") aspects.push(a(4), a(8));
  return aspects;
}

function getNakshatraLord(nakshatra: string): PlanetKey | null {
  const idx = NK_NAMES.indexOf(nakshatra);
  return idx >= 0 ? NK_LORDS[idx] : null;
}

function isGandanta(rashiIndex: number, degrees: number): boolean {
  const junctions = [
    { water: 11, fire: 0 },
    { water: 3,  fire: 4 },
    { water: 7,  fire: 8 },
  ];
  return junctions.some(j =>
    (rashiIndex === j.water && degrees >= 28.5) ||
    (rashiIndex === j.fire  && degrees <= 1.5)
  );
}

function isParamochcha(key: PlanetKey, rashiIndex: number, degrees: number): boolean {
  const EXALTATION: Partial<Record<PlanetKey, { rashi: number; deepDeg: number }>> = {
    su: { rashi: 0,  deepDeg: 10 },
    mo: { rashi: 1,  deepDeg: 3  },
    ma: { rashi: 9,  deepDeg: 28 },
    me: { rashi: 5,  deepDeg: 15 },
    ju: { rashi: 3,  deepDeg: 5  },
    ve: { rashi: 11, deepDeg: 27 },
    sa: { rashi: 6,  deepDeg: 20 },
  };
  const ex = EXALTATION[key];
  return !!(ex && ex.rashi === rashiIndex && Math.abs(degrees - ex.deepDeg) <= 1);
}

function ruledHouses(planetKey: PlanetKey, lagnaRashiIndex: number): number[] {
  return [1,2,3,4,5,6,7,8,9,10,11,12].filter(
    h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12] === planetKey
  );
}

function getCurrentDashaKey(chart: KundliChart): PlanetKey | null {
  const active = chart.dashas.find(d => d.isActive);
  return active ? (active.planet as PlanetKey) : null;
}

function getCurrentAntarKey(chart: KundliChart): PlanetKey | null {
  const active = chart.dashas.find(d => d.isActive);
  const antar = active?.antardasha?.find(a => a.isActive);
  return antar ? (antar.planet as PlanetKey) : null;
}

function getDashaDuration(chart: KundliChart): { mdEnd: Date; adEnd: Date | null } {
  const active = chart.dashas.find(d => d.isActive);
  const antar = active?.antardasha?.find(a => a.isActive);
  return {
    mdEnd: new Date(active?.endDate ?? Date.now()),
    adEnd: antar ? new Date(antar.endDate) : null,
  };
}

function monthsUntil(date: Date): number {
  const now = new Date();
  return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

// ============================================================
// CORE SCORING: PLANETARY PRESSURE
// ============================================================

/**
 * Computes a composite pressure score for each planet.
 * High pressure = this planet is unusually significant right now.
 * Pressure can be positive (exaltation + dasha) or challenging
 * (debilitation + malefic aspect + transit) — both are high pressure.
 *
 * Score components:
 *   Dignity state:         0.5–2.5
 *   Dasha activation:      0–5.0
 *   Transit pressure:      0–3.0
 *   Aspect pressure:       0–2.0
 *   House placement:       0–1.5
 *   Special conditions:    0–2.5
 */
export function computePlanetaryPressure(
  planet: PlanetInfo,
  chart: KundliChart,
  lagnaRashiIndex: number,
  transitPlanets?: TransitPlanetInput[]
): number {
  let score = 0;
  const mdKey = getCurrentDashaKey(chart);
  const adKey = getCurrentAntarKey(chart);

  // ── Dignity state ──────────────────────────────
  if (planet.isExalted) score += 2.0;
  if (planet.isDebilitated) score += 2.5;      // Debilitation = HIGH pressure, not zero
  if (planet.isCombust) score += 2.0;          // Combustion distorts significations strongly
  if (planet.isRetrograde && !["ra","ke"].includes(planet.key)) score += 1.2;

  // Moolatrikona / Own sign
  const ownSigns: Partial<Record<PlanetKey, number[]>> = {
    su:[4], mo:[3], ma:[0,7], me:[2,5], ju:[8,11], ve:[1,6], sa:[9,10],
  };
  const moolatrikona: Partial<Record<PlanetKey, { rashi: number }>> = {
    su:{rashi:4}, mo:{rashi:1}, ma:{rashi:0}, me:{rashi:5},
    ju:{rashi:8}, ve:{rashi:6}, sa:{rashi:10},
  };
  if (ownSigns[planet.key]?.includes(planet.position.rashiIndex)) score += 1.5;
  if (moolatrikona[planet.key]?.rashi === planet.position.rashiIndex) score += 1.8;

  // ── Special conditions ─────────────────────────
  if (isGandanta(planet.position.rashiIndex, planet.position.degrees)) score += 2.5;
  if (isParamochcha(planet.key, planet.position.rashiIndex, planet.position.degrees)) score += 2.0;

  // Sandhi (rashi junction — weakened)
  if (planet.position.degrees <= 1 || planet.position.degrees >= 29) score += 1.0;

  // ── Dasha activation ───────────────────────────
  if (planet.key === mdKey) score += 4.0;      // Most important — this planet IS the period
  if (planet.key === adKey) score += 2.5;      // Antardasha lord — shaping the current sub-period

  // ── Transit pressure ───────────────────────────
  if (transitPlanets) {
    for (const tp of transitPlanets) {
      // Transit directly over this natal planet
      if (tp.rashiIndex === planet.position.rashiIndex) {
        const orb = Math.abs(tp.degrees - planet.position.degrees);
        if (orb <= 3)  score += 3.0;           // Exact transit — maximum pressure
        else if (orb <= 8) score += 1.8;       // Close
        else score += 0.8;                      // Wide — same sign
      }
      // Slow planet aspecting natal planet's house
      if (["sa","ju","ra","ke"].includes(tp.key)) {
        const transitHouse = ((tp.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        const aspects = getPlanetAspects(tp.key as PlanetKey, transitHouse);
        if (aspects.includes(planet.house)) score += 1.2;
      }
    }
  }

  // ── Aspect pressure on this natal planet ───────
  for (const other of chart.planets) {
    if (other.key === planet.key) continue;
    const aspects = getPlanetAspects(other.key, other.house);
    if (aspects.includes(planet.house)) {
      if (!isBenefic(other.key)) score += 1.0;  // Malefic aspect = pressure
      else score += 0.4;                          // Benefic aspect = moderate positive pressure
    }
  }

  // ── House placement significance ───────────────
  if (DUSTHANA.includes(planet.house)) score += 1.0;
  if (KENDRA.includes(planet.house))   score += 0.8;
  if (TRIKONA.includes(planet.house))  score += 0.6;

  // ── Lagna lord gets extra weight ───────────────
  if (planet.key === RASHI_LORDS[lagnaRashiIndex]) score += 1.5;

  return Math.round(score * 100) / 100;
}

// ============================================================
// CORE SCORING: HOUSE ACTIVATION
// ============================================================

/**
 * Computes how "activated" each house is right now.
 * Combines natal weight + current dasha + current transits.
 * Houses with activation > 4.0 are surfaced as active.
 */
export function computeHouseActivation(
  house: number,
  chart: KundliChart,
  lagnaRashiIndex: number,
  transitPlanets?: TransitPlanetInput[]
): { score: number; sources: string[] } {
  let score = 0;
  const sources: string[] = [];
  const mdKey = getCurrentDashaKey(chart);
  const adKey = getCurrentAntarKey(chart);

  // ── Natal: planets occupying this house ────────
  const natalOccupants = chart.planets.filter(p => p.house === house);
  for (const p of natalOccupants) {
    score += isBenefic(p.key) ? 1.5 : 2.0;    // Malefics make houses more pressured
    sources.push(`natal ${p.name} occupies H${house}`);
  }

  // ── Natal: lord placement ──────────────────────
  const houseLordKey = RASHI_LORDS[(lagnaRashiIndex + house - 1) % 12];
  const houseLord = chart.planets.find(p => p.key === houseLordKey);
  if (houseLord) {
    if (DUSTHANA.includes(houseLord.house)) {
      score += 1.5;
      sources.push(`lord ${houseLord.name} in dusthana H${houseLord.house}`);
    } else if (KENDRA.includes(houseLord.house) || TRIKONA.includes(houseLord.house)) {
      score += 1.0;
      sources.push(`lord ${houseLord.name} in kendra/trikona H${houseLord.house}`);
    }
    if (houseLord.isDebilitated) {
      score += 1.5;
      sources.push(`lord ${houseLord.name} debilitated`);
    }
  }

  // ── Dasha: does MD/AD lord rule or occupy this house? ─
  if (mdKey) {
    const mdLord = chart.planets.find(p => p.key === mdKey);
    const mdRuled = ruledHouses(mdKey, lagnaRashiIndex);
    if (mdRuled.includes(house)) {
      score += 3.0;
      sources.push(`MD lord ${PLANET_META[mdKey].name} rules H${house}`);
    }
    if (mdLord?.house === house) {
      score += 2.5;
      sources.push(`MD lord ${PLANET_META[mdKey].name} sits in H${house}`);
    }
  }

  if (adKey) {
    const adLord = chart.planets.find(p => p.key === adKey);
    const adRuled = ruledHouses(adKey, lagnaRashiIndex);
    if (adRuled.includes(house)) {
      score += 2.0;
      sources.push(`AD lord ${PLANET_META[adKey].name} rules H${house}`);
    }
    if (adLord?.house === house) {
      score += 1.5;
      sources.push(`AD lord ${PLANET_META[adKey].name} sits in H${house}`);
    }
  }

  // ── Transits ───────────────────────────────────
  if (transitPlanets) {
    for (const tp of transitPlanets) {
      const transitHouse = ((tp.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
      if (transitHouse === house) {
        const weight = ["sa","ju"].includes(tp.key) ? 3.0 :
                       ["ra","ke"].includes(tp.key) ? 2.0 : 1.0;
        score += weight;
        sources.push(`transit ${tp.name} in H${house}`);
      }
      // Aspect from transiting planet
      const aspects = getPlanetAspects(tp.key as PlanetKey, transitHouse);
      if (aspects.includes(house) && transitHouse !== house) {
        const weight = ["sa","ju"].includes(tp.key) ? 1.5 : 0.8;
        score += weight;
        sources.push(`transit ${tp.name} aspecting H${house}`);
      }
    }
  }

  return { score: Math.round(score * 100) / 100, sources };
}

// ============================================================
// TIMING CONFLUENCE DETECTION
// ============================================================

/**
 * Detects whether multiple independent layers are pointing
 * toward the same life event type.
 *
 * Rule: 3+ independent indicators → confidence > 0.6 → surface it
 * Independent = from different systems (dasha vs transit vs natal vs divisional)
 */
export function detectTimingConfluence(
  theme: TimingTheme,
  chart: KundliChart,
  lagnaRashiIndex: number,
  transitPlanets?: TransitPlanetInput[]
): TimingConfluence | null {
  const indicators: string[] = [];
  let avBinduBonus = 0;

  const mdKey  = getCurrentDashaKey(chart);
  const adKey  = getCurrentAntarKey(chart);
  const moon   = chart.planets.find(p => p.key === "mo");
  const moonRI = moon?.position.rashiIndex ?? lagnaRashiIndex;

  const get = (k: PlanetKey) => chart.planets.find(p => p.key === k);

  // ── Marriage confluence ────────────────────────
  if (theme === "marriage") {
    const h7LordKey = RASHI_LORDS[(lagnaRashiIndex + 6) % 12];
    const h7Lord    = get(h7LordKey);
    const venus     = get("ve");
    const jupiter   = get("ju");

    // Indicator 1: Does MD lord activate marriage houses?
    if (mdKey) {
      const mdRuled = ruledHouses(mdKey, lagnaRashiIndex);
      if ([2,7,11].some(h => mdRuled.includes(h))) {
        indicators.push(`MD lord (${PLANET_META[mdKey].name}) rules marriage-relevant houses`);
      }
      if (mdKey === h7LordKey) {
        indicators.push(`MD lord IS the 7th lord — marriage directly activated`);
      }
      if (mdKey === "ve" || mdKey === "ju") {
        indicators.push(`MD lord (${PLANET_META[mdKey].name}) is natural karaka for marriage`);
      }
    }

    // Indicator 2: AD lord activates marriage
    if (adKey) {
      const adRuled = ruledHouses(adKey, lagnaRashiIndex);
      if ([2,7,11].some(h => adRuled.includes(h))) {
        indicators.push(`AD lord (${PLANET_META[adKey].name}) rules marriage-relevant houses`);
      }
      if (adKey === h7LordKey) indicators.push(`AD lord IS the 7th lord`);
      if (adKey === "ve") indicators.push(`AD lord is Venus — marriage significator active`);
    }

    // Indicator 3: Transit Jupiter over 7th or natal Venus/7th lord
    if (transitPlanets) {
      const juTr = transitPlanets.find(p => p.key === "ju");
      if (juTr) {
        const juHouseL = ((juTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        const juHouseM = ((juTr.rashiIndex - moonRI + 12) % 12) + 1;
        if (juHouseL === 7 || juHouseL === 2 || juHouseL === 11) {
          indicators.push(`Transit Jupiter in H${juHouseL} from Lagna — marriage-positive`);
        }
        if (juHouseM === 7) {
          indicators.push(`Transit Jupiter in 7th from natal Moon — classical marriage indicator`);
        }
        if (venus && juTr.rashiIndex === venus.position.rashiIndex) {
          indicators.push(`Transit Jupiter over natal Venus — peak attraction/marriage activation`);
        }
        if (h7Lord && juTr.rashiIndex === h7Lord.position.rashiIndex) {
          indicators.push(`Transit Jupiter over natal 7th lord`);
        }
      }

      // Indicator 4: Saturn activating 7th/2nd/11th
      const saTr = transitPlanets.find(p => p.key === "sa");
      if (saTr) {
        const saHouseL = ((saTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        if ([7, 2, 11].includes(saHouseL)) {
          indicators.push(`Transit Saturn in H${saHouseL} — commitment and permanence energy`);
        }
      }

      // Indicator 5: Double transit check
      if (juTr && saTr) {
        const juHL = ((juTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        const saHL = ((saTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        const juHM = ((juTr.rashiIndex - moonRI + 12) % 12) + 1;
        const saHM = ((saTr.rashiIndex - moonRI + 12) % 12) + 1;
        if (juHL === saHL && [7, 2, 11].includes(juHL)) {
          indicators.push(`DOUBLE TRANSIT: Jupiter+Saturn both in H${juHL} — maximum marriage timing trigger`);
          avBinduBonus += 0.15;
        }
        if (juHM === saHM && [7, 2, 11].includes(juHM)) {
          indicators.push(`Double transit from natal Moon — classical marriage confirmation`);
        }
      }
    }

    // Indicator 6: Natal 7th house strength
    const planetsIn7 = chart.planets.filter(p => p.house === 7);
    if (planetsIn7.some(p => isBenefic(p.key))) {
      indicators.push(`Benefic planets in 7th house — natal marriage strength`);
    }
    if (h7Lord?.isExalted) indicators.push(`7th lord exalted — strong marriage yoga`);
    if (venus?.isExalted) indicators.push(`Venus exalted — powerful attraction and relationship capacity`);
  }

  // ── Career shift confluence ────────────────────
  if (theme === "career_shift") {
    const h10LordKey = RASHI_LORDS[(lagnaRashiIndex + 9) % 12];

    if (mdKey) {
      const mdRuled = ruledHouses(mdKey, lagnaRashiIndex);
      if ([1, 9, 10].some(h => mdRuled.includes(h))) {
        indicators.push(`MD lord rules career/dharma/identity houses`);
      }
      if (mdKey === h10LordKey) indicators.push(`MD lord IS the 10th lord — career directly activated`);
      if (mdKey === "su") indicators.push(`Sun MD — authority, public status, career at center`);
    }

    if (adKey) {
      const adRuled = ruledHouses(adKey, lagnaRashiIndex);
      if ([1, 10].some(h => adRuled.includes(h))) {
        indicators.push(`AD lord activates career axis`);
      }
    }

    if (transitPlanets) {
      const saTr = transitPlanets.find(p => p.key === "sa");
      const juTr = transitPlanets.find(p => p.key === "ju");
      if (saTr) {
        const saHL = ((saTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        if (saHL === 10) indicators.push(`Transit Saturn in 10th — career restructuring, long-term authority building`);
        if (saHL === 1)  indicators.push(`Transit Saturn on Lagna — identity restructuring affecting career direction`);
      }
      if (juTr) {
        const juHL = ((juTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        if (juHL === 10) indicators.push(`Transit Jupiter in 10th — career expansion, recognition`);
        if (juHL === 9)  indicators.push(`Transit Jupiter in 9th — fortune opening for career advancement`);
      }
    }

    const h10Lord = chart.planets.find(p => p.key === h10LordKey);
    if (h10Lord?.isExalted) indicators.push(`10th lord exalted — high career achievement potential`);
    const planetsIn10 = chart.planets.filter(p => p.house === 10);
    if (planetsIn10.length >= 2) indicators.push(`Multiple planets in 10th — career is a major life theme`);
  }

  // ── Financial gain confluence ──────────────────
  if (theme === "financial_gain") {
    const h2LordKey  = RASHI_LORDS[(lagnaRashiIndex + 1) % 12];
    const h11LordKey = RASHI_LORDS[(lagnaRashiIndex + 10) % 12];

    if (mdKey) {
      const mdRuled = ruledHouses(mdKey, lagnaRashiIndex);
      if ([2, 11].some(h => mdRuled.includes(h))) {
        indicators.push(`MD lord rules wealth houses (H2/H11)`);
      }
      if (mdKey === "ju") indicators.push(`Jupiter MD — natural period of expansion and abundance`);
      if (mdKey === "ve") indicators.push(`Venus MD — wealth, luxury, financial flow period`);
    }

    if (adKey) {
      const adRuled = ruledHouses(adKey, lagnaRashiIndex);
      if ([2, 11].some(h => adRuled.includes(h))) {
        indicators.push(`AD lord activates wealth houses`);
      }
    }

    if (transitPlanets) {
      const juTr = transitPlanets.find(p => p.key === "ju");
      if (juTr) {
        const juHL = ((juTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        if (juHL === 11) indicators.push(`Transit Jupiter in 11th — maximum gains transit`);
        if (juHL === 2)  indicators.push(`Transit Jupiter in 2nd — wealth accumulation transit`);
      }
    }

    const h11Lord = chart.planets.find(p => p.key === h11LordKey);
    const h2Lord  = chart.planets.find(p => p.key === h2LordKey);
    if (h11Lord?.isExalted) indicators.push(`11th lord exalted — gains come naturally`);
    if (h2Lord?.house === 11 || h11Lord?.house === 2) {
      indicators.push(`Wealth lords in mutual activation — 2nd and 11th lords connected`);
    }
  }

  // ── Spiritual opening confluence ───────────────
  if (theme === "spiritual_opening") {
    const ketu = chart.planets.find(p => p.key === "ke");

    if (mdKey === "ke") indicators.push(`Ketu MD — deep spiritual detachment and inner awakening period`);
    if (mdKey === "ju") indicators.push(`Jupiter MD — dharmic expansion, guru connection, wisdom deepens`);

    if (adKey === "ke") indicators.push(`Ketu AD — spiritual acceleration within current period`);

    if (ketu) {
      if ([4, 8, 12].includes(ketu.house)) {
        indicators.push(`Natal Ketu in moksha/occult house — spiritual potential always active`);
      }
    }

    if (transitPlanets) {
      const keTr = transitPlanets.find(p => p.key === "ke");
      if (keTr) {
        const keHL = ((keTr.rashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        if (keHL === 12) indicators.push(`Transit Ketu in 12th — moksha pressure, spiritual retreat calling`);
        if (keHL === 8)  indicators.push(`Transit Ketu in 8th — occult awakening, hidden knowledge surfaces`);
      }
    }
  }

  // ── Health pressure confluence ─────────────────
  if (theme === "health_pressure") {
    const h6LordKey  = RASHI_LORDS[(lagnaRashiIndex + 5) % 12];
    const h8LordKey  = RASHI_LORDS[(lagnaRashiIndex + 7) % 12];
    const lagnaLord  = chart.planets.find(p => p.key === RASHI_LORDS[lagnaRashiIndex]);

    if (mdKey) {
      if (mdKey === h6LordKey) indicators.push(`MD lord is 6th lord — health and obstacles at center`);
      if (mdKey === h8LordKey) indicators.push(`MD lord is 8th lord — longevity and transformation period`);
    }

    if (lagnaLord?.isDebilitated || lagnaLord?.isCombust) {
      indicators.push(`Lagna lord weakened — constitution under pressure`);
    }

    if (transitPlanets) {
      const saTr = transitPlanets.find(p => p.key === "sa");
      const moonRI_ = chart.planets.find(p => p.key === "mo")?.position.rashiIndex ?? lagnaRashiIndex;
      if (saTr) {
        const saM = ((saTr.rashiIndex - moonRI_ + 12) % 12) + 1;
        if ([12, 1, 2].includes(saM)) {
          indicators.push(`Sade Sati active — Saturn transiting natal Moon — energy and health require attention`);
        }
      }
    }

    const mars = get("ma");
    if (mars?.isDebilitated) indicators.push(`Mars debilitated — energy and vitality under chronic pressure`);
  }

  // ── Confidence calculation ─────────────────────
  // Independent layers used (each system = 1 independent indicator):
  // natal, dasha-md, dasha-ad, transit-jupiter, transit-saturn, transit-nodes, double-transit
  const uniqueLayers = new Set(indicators.map(ind => {
    if (ind.includes("MD lord")) return "dasha-md";
    if (ind.includes("AD lord")) return "dasha-ad";
    if (ind.includes("Transit Jupiter")) return "transit-jupiter";
    if (ind.includes("Transit Saturn")) return "transit-saturn";
    if (ind.includes("Transit Ketu") || ind.includes("Transit Rahu")) return "transit-nodes";
    if (ind.includes("DOUBLE TRANSIT") || ind.includes("Double transit")) return "double-transit";
    if (ind.includes("Sade Sati")) return "transit-saturn";
    return "natal";
  }));

  const maxPossibleLayers = 7;
  const confidence = Math.min(
    (uniqueLayers.size / maxPossibleLayers) * 1.4 + avBinduBonus,
    1.0
  );

  // Only return if confidence exceeds threshold
  if (confidence < 0.45 || indicators.length < 2) return null;

  // Build timing window from dasha duration
  const { mdEnd, adEnd } = getDashaDuration(chart);
  const monthsMD = monthsUntil(mdEnd);
  const monthsAD = adEnd ? monthsUntil(adEnd) : null;

  let window = "";
  let quality = "";

  if (theme === "marriage") {
    if (confidence >= 0.8) {
      window = monthsAD ? `next ${Math.min(monthsAD, 18)}–${Math.min(monthsAD + 8, 30)} months` : "next 12–24 months";
      quality = "The conditions are structurally present. What forms in this window tends to be chosen — not stumbled into.";
    } else if (confidence >= 0.6) {
      window = "next 18–36 months";
      quality = "A meaningful possibility. The window is open but requires the person to be available for it.";
    } else {
      window = "next 2–4 years";
      quality = "Directional, not imminent. The chart is moving toward partnership conditions.";
    }
  } else if (theme === "career_shift") {
    window = monthsMD > 0 ? `within the next ${Math.min(monthsMD, 24)} months` : "currently active";
    quality = "Career momentum is building or restructuring. The direction of effort matters more than the outcome right now.";
  } else if (theme === "financial_gain") {
    window = monthsAD ? `next ${Math.min(monthsAD, 12)} months` : "next 12 months";
    quality = "Financial channels are open. The gains tend to arrive through the houses being activated, not through luck.";
  } else if (theme === "spiritual_opening") {
    window = "currently active and deepening";
    quality = "Something internal is being clarified. The outer world may feel less urgent than usual.";
  } else if (theme === "health_pressure") {
    window = "currently active — requires attention";
    quality = "Not prediction of illness — but a period where the body is more sensitive and less forgiving of neglect.";
  } else {
    window = "next 12–24 months";
    quality = "Conditions are forming.";
  }

  return {
    type: theme,
    confidence: Math.round(confidence * 100) / 100,
    window,
    layers: indicators,
    quality,
  };
}

// ============================================================
// RARITY SCORING
// ============================================================

/**
 * Higher rarity = this observation is more unique to THIS chart.
 * Used to weight observations in the final ranking.
 * A 2% combination scores higher than a 40% one.
 */
export function computeRarityScore(chart: KundliChart, lagnaRashiIndex: number): number {
  let rarity = 0.5; // Baseline — average chart

  for (const p of chart.planets) {
    if (isGandanta(p.position.rashiIndex, p.position.degrees)) {
      rarity += RARITY.gandanta;
    }
    if (isParamochcha(p.key, p.position.rashiIndex, p.position.degrees)) {
      rarity += RARITY.paramochcha;
    }
    if (p.isCombust) {
      const mt: Partial<Record<PlanetKey, { rashi: number }>> = {
        su:{rashi:4},mo:{rashi:1},ma:{rashi:0},me:{rashi:5},
        ju:{rashi:8},ve:{rashi:6},sa:{rashi:10},
      };
      if (mt[p.key]?.rashi === p.position.rashiIndex) {
        rarity += RARITY.moolatrikona_combust;
      }
    }
    if (p.isExalted && DUSTHANA.includes(p.house)) {
      rarity += RARITY.exalted_in_dusthana;
    }
    if (p.isRetrograde && !["ra","ke"].includes(p.key)) {
      const ck = chart.planets.filter(x => !["ra","ke"].includes(x.key));
      const sorted = [...ck].sort((a,b) => b.position.degrees - a.position.degrees);
      if (sorted[0]?.key === p.key) rarity += RARITY.retrograde_atmakaraka;
    }
  }

  // Triple conjunction (3 planets in same house within 10°)
  for (let h = 1; h <= 12; h++) {
    const inHouse = chart.planets.filter(p => p.house === h);
    if (inHouse.length >= 3) {
      const degrees = inHouse.map(p => p.position.totalDegrees);
      const range = Math.max(...degrees) - Math.min(...degrees);
      if (range <= 10) rarity += RARITY.triple_conjunction;
    }
  }

  // Maha parivartana
  for (let i = 0; i < chart.planets.length; i++) {
    for (let j = i+1; j < chart.planets.length; j++) {
      const pi = chart.planets[i], pj = chart.planets[j];
      const ownSigns: Partial<Record<PlanetKey, number[]>> = {
        su:[4],mo:[3],ma:[0,7],me:[2,5],ju:[8,11],ve:[1,6],sa:[9,10],
      };
      if (
        (ownSigns[pi.key]??[]).includes(pj.position.rashiIndex) &&
        (ownSigns[pj.key]??[]).includes(pi.position.rashiIndex)
      ) {
        if (TRIKONA.includes(pi.house) && TRIKONA.includes(pj.house)) rarity += RARITY.maha_parivartana;
        if (KENDRA.includes(pi.house)  && KENDRA.includes(pj.house))  rarity += RARITY.maha_parivartana;
        if (
          (KENDRA.includes(pi.house) && TRIKONA.includes(pj.house)) ||
          (TRIKONA.includes(pi.house) && KENDRA.includes(pj.house))
        ) rarity += RARITY.maha_parivartana;
      }
    }
  }

  return Math.min(Math.round(rarity * 1000) / 1000, 1.0);
}

// ============================================================
// PARTNER SIGNATURE (7-Layer Pre-computation)
// ============================================================

/**
 * Pre-computes the 7-layer spouse/partner analysis.
 * This replaces the inline partner analysis in promptEngine.ts.
 * Each layer produces one behavioral observation in plain language.
 */
export function computePartnerSignature(
  chart: KundliChart,
  lagnaRashiIndex: number,
  nakshatraData: Record<string, { keywords: string; shadowTheme: string; coreWound: string; giftWhenIntegrated: string }>
): PartnerSignature {
  const h7LordKey  = RASHI_LORDS[(lagnaRashiIndex + 6) % 12];
  const h7Lord     = chart.planets.find(p => p.key === h7LordKey);
  const venus      = chart.planets.find(p => p.key === "ve");
  const moon       = chart.planets.find(p => p.key === "mo");
  const planetsIn7 = chart.planets.filter(p => p.house === 7);
  const aspectsOn7 = chart.planets.filter(p =>
    p.key !== h7LordKey && getPlanetAspects(p.key, p.house).includes(7)
  );
  const h7fromMoon = moon ? ((moon.house - 1 + 6) % 12) + 1 : 7;

  // Layer 1: 7th lord nakshatra
  const nk7 = h7Lord ? nakshatraData[h7Lord.position.nakshatra] : null;
  const layer1_wound    = nk7?.coreWound ?? "integration of opposing drives in intimate relationship";
  const layer1_gift     = nk7?.giftWhenIntegrated ?? "genuine depth and reliability in partnership";
  const layer1_keywords = nk7?.keywords ?? "relational themes active";

  // Layer 2: Nakshatra lord of 7th lord
  const nk7LordIdx = h7Lord ? NK_NAMES.indexOf(h7Lord.position.nakshatra) : -1;
  const nk7LordLordKey = nk7LordIdx >= 0 ? NK_LORDS[nk7LordIdx] : null;
  const nk7LordLord = nk7LordLordKey ? chart.planets.find(p => p.key === nk7LordLordKey) : null;
  const nk7LL = nk7LordLord ? nakshatraData[nk7LordLord.position.nakshatra] : null;
  const layer2_coloring = nk7LL
    ? `Spouse's second personality layer: ${nk7LL.keywords}. Their deeper pattern: ${nk7LL.shadowTheme}`
    : "Second personality layer unavailable";

  // Layer 3: Planets in 7th — these ARE the spouse's traits
  const layer3_traits = planetsIn7.map(p => {
    const nk = nakshatraData[p.position.nakshatra];
    return `${p.name} in 7th: brings ${nk?.keywords ?? "complex energy"} into the relationship — recurring shadow: ${nk?.shadowTheme ?? "complexity"}`;
  }).join(". ") || "No planets in 7th — spouse character expressed through 7th lord alone";

  // Layer 4: Aspects on 7th — the recurring dynamic
  const recurring_dynamic = aspectsOn7.map(p => {
    const nk = nakshatraData[p.position.nakshatra];
    const quality = !isBenefic(p.key) ? "tests and pressures" : "expands and blesses";
    return `${p.name} (${nk?.keywords ?? ""}) ${quality} the relationship repeatedly`;
  }).join("; ") || "Relationship domain relatively free of external pressures";

  // Layer 5: Darakaraka — soul-level archetype
  const ckEligible = chart.planets
    .filter(p => !["ra","ke"].includes(p.key))
    .sort((a,b) => b.position.degrees - a.position.degrees);
  const darakaraka = ckEligible[7];
  const dkNk = darakaraka ? nakshatraData[darakaraka.position.nakshatra] : null;
  const darakaraka_archetype = dkNk
    ? `Soul came here to meet someone embodying: ${dkNk.keywords}. The karmic purpose: confronting ${dkNk.coreWound}`
    : "Darakaraka archetype — deep partnership karmic pattern";

  // Layer 6: Venus — how they experience love
  const venusNk = venus ? nakshatraData[venus.position.nakshatra] : null;
  const venus_pattern = venusNk
    ? `Love enters through H${venus?.house} themes. Attraction pattern: ${venusNk.keywords}. Risk: ${venusNk.shadowTheme}`
    : "Venus pattern — love and attraction signature";

  // Most specific observation — from whichever layer is sharpest
  const observations = [
    nk7 ? `The partner's core struggle: ${nk7.coreWound}` : null,
    dkNk ? `The soul chose someone carrying: ${dkNk.keywords}` : null,
    aspectsOn7.length ? `The repeating relationship dynamic: ${nakshatraData[aspectsOn7[0].position.nakshatra]?.shadowTheme}` : null,
    venusNk ? `Love feels like: ${venusNk.keywords}` : null,
  ].filter(Boolean) as string[];

  const most_specific_observation = observations[0] ?? "Multiple chart layers indicate a rich and specific partner archetype";

  return {
    layer1_wound,
    layer1_gift,
    layer1_keywords,
    layer2_coloring,
    darakaraka_archetype,
    venus_pattern,
    recurring_dynamic,
    most_specific_observation,
  };
}

// ============================================================
// DOMINANT AXIS EXTRACTION
// ============================================================

/**
 * Extracts the 3–5 most important observations from the chart.
 * These become the backbone of every reading.
 * Each observation is validated against 3+ independent indicators.
 */
export function extractDominantAxis(
  chart: KundliChart,
  lagnaRashiIndex: number,
  nakshatraData: Record<string, any>,
  transitPlanets?: TransitPlanetInput[]
): DominantObservation[] {
  const observations: DominantObservation[] = [];
  const lagnaLordKey = RASHI_LORDS[lagnaRashiIndex];
  const lagnaLord    = chart.planets.find(p => p.key === lagnaLordKey);
  const moon         = chart.planets.find(p => p.key === "mo");
  const rahu         = chart.planets.find(p => p.key === "ra");
  const ketu         = chart.planets.find(p => p.key === "ke");
  const nkLagna      = nakshatraData[chart.lagna.nakshatra];
  const nkMoon       = moon ? nakshatraData[moon.position.nakshatra] : null;

  // ── Observation 1: Core identity axis ─────────
  {
    const indicators: string[] = [];
    let observation = "";

    if (lagnaLord) {
      const nkLL = nakshatraData[lagnaLord.position.nakshatra];
      indicators.push(`Lagna lord (${lagnaLord.name}) in H${lagnaLord.house} (${lagnaLord.position.nakshatra})`);
      indicators.push(`Lagna nakshatra: ${chart.lagna.nakshatra} — ${nkLagna?.keywords}`);

      if (lagnaLord.isDebilitated) {
        observation = `The core identity is built through difficulty — there is a structural pattern of establishing competence under conditions that others don't face. This creates genuine capability but also a tendency to overwork as proof of worthiness.`;
        indicators.push(`Lagna lord debilitated — identity forged through friction`);
      } else if (lagnaLord.isExalted) {
        observation = `Natural confidence and self-expression — but an exalted identity can miss its own blind spots. There is a quiet assumption of authority that works until it meets genuine resistance.`;
        indicators.push(`Lagna lord exalted — natural authority`);
      } else if (DUSTHANA.includes(lagnaLord.house)) {
        observation = `The identity is partly hidden — this person carries more than they show. What they present publicly is real but incomplete. The deeper layer only emerges in situations of genuine trust or genuine pressure.`;
        indicators.push(`Lagna lord in dusthana — concealed depth`);
      } else {
        observation = `${nkLagna?.keywords ?? "The identity"} — the shadow underneath is ${nkLagna?.shadowTheme ?? "complex"}, and the integrated gift is ${nkLagna?.giftWhenIntegrated ?? "significant"}.`;
      }
    }

    if (observation && indicators.length >= 2) {
      observations.push({
        observation,
        indicators,
        confidenceScore: Math.min(indicators.length / 5, 1.0),
        rarity: 0.4,
        category: "identity",
      });
    }
  }

  // ── Observation 2: Emotional pattern ──────────
  {
    if (moon && nkMoon) {
      const indicators: string[] = [
        `Moon in H${moon.house} (${moon.position.rashi}, ${moon.position.nakshatra})`,
        `Moon nakshatra: ${nkMoon.keywords}`,
      ];
      let observation = "";

      const aspectsOnMoon = chart.planets.filter(p =>
        p.key !== "mo" && getPlanetAspects(p.key, p.house).includes(moon.house)
      );

      if (moon.isDebilitated) {
        observation = `Emotional life is intense and private — feelings run deep but surface slowly and only in trusted conditions. There is a pattern of carrying emotional weight alone before it becomes visible.`;
        indicators.push(`Moon debilitated — emotional vulnerability internalized`);
      } else if (aspectsOnMoon.some(p => p.key === "sa")) {
        observation = `Emotional warmth is real but delivered through structure — care expressed through reliability, practical support, showing up consistently. Direct emotional expression is harder; being seen as dependable is easier than being seen as vulnerable.`;
        indicators.push(`Saturn aspects Moon — emotional restraint, care through action`);
      } else if (aspectsOnMoon.some(p => p.key === "ma")) {
        observation = `Emotional life has a sharp edge — reactive in the moment, but the reaction passes and the underlying feeling is deeper and more considered than the surface suggests. Others experience the reaction first and the depth only later.`;
        indicators.push(`Mars aspects Moon — emotional reactivity with underlying depth`);
      } else if (moon.isExalted) {
        observation = `Strong emotional intelligence — genuinely attuned to what others feel, sometimes before they know it themselves. The challenge is that this attunement can absorb others' states as their own.`;
        indicators.push(`Moon exalted — deep emotional receptivity`);
      } else {
        observation = `${nkMoon.keywords} — emotional shadow: ${nkMoon.shadowTheme}`;
      }

      if (observation) {
        observations.push({
          observation,
          indicators,
          confidenceScore: Math.min(indicators.length / 4, 1.0),
          rarity: 0.45,
          category: "emotional",
        });
      }
    }
  }

  // ── Observation 3: Nodal axis — life direction ─
  {
    if (rahu && ketu) {
      const indicators: string[] = [
        `Rahu in H${rahu.house} (${rahu.position.rashi}, ${rahu.position.nakshatra})`,
        `Ketu in H${ketu.house} (${ketu.position.rashi}, ${ketu.position.nakshatra})`,
      ];
      const nkRahu = nakshatraData[rahu.position.nakshatra];
      const nkKetu = nakshatraData[ketu.position.nakshatra];

      const observation = `There is a strong pull toward ${nkRahu?.keywords ?? "expansion in " + RASHIS[rahu.position.rashiIndex]} — this is the direction life keeps insisting on. At the same time, ${nkKetu?.keywords ?? "the " + RASHIS[ketu.position.rashiIndex] + " domain"} is the place of release — skills and patterns that came naturally in a previous chapter but are now being asked to let go of. The friction between these two creates the life's defining tension.`;

      observations.push({
        observation,
        indicators,
        confidenceScore: 0.75,
        rarity: 0.5,
        category: "identity",
      });
    }
  }

  // ── Observation 4: Timing — what's active NOW ──
  {
    const mdKey = getCurrentDashaKey(chart);
    const adKey = getCurrentAntarKey(chart);
    if (mdKey) {
      const mdLord = chart.planets.find(p => p.key === mdKey);
      const nkMD   = mdLord ? nakshatraData[mdLord.position.nakshatra] : null;
      const mdDuration = getDashaDuration(chart);
      const yearsLeft  = Math.round(monthsUntil(mdDuration.mdEnd) / 12 * 10) / 10;
      const mdRuled    = ruledHouses(mdKey, lagnaRashiIndex);

      const indicators = [
        `MD lord (${PLANET_META[mdKey].name}) in H${mdLord?.house} (${mdLord?.position.nakshatra})`,
        `Rules H${mdRuled.join("/")}`,
        `${yearsLeft > 0 ? yearsLeft + " years remaining" : "period completing"}`,
      ];

      if (adKey) {
        const adLord  = chart.planets.find(p => p.key === adKey);
        const adRuled = ruledHouses(adKey, lagnaRashiIndex);
        indicators.push(`AD lord (${PLANET_META[adKey].name}) rules H${adRuled.join("/")}`);
      }

      const isMaleficMD = NATURAL_MALEFIC.includes(mdKey);
      const activatedThemes = mdRuled.map(h => {
        const themes: Record<number, string> = {
          1:"identity", 2:"wealth and family", 3:"courage and effort",
          4:"home and inner life", 5:"children and creativity", 6:"obstacles and service",
          7:"partnership", 8:"transformation", 9:"dharma and fortune",
          10:"career", 11:"gains", 12:"dissolution and foreign connections",
        };
        return themes[h] ?? `H${h}`;
      });

      const observation = isMaleficMD
        ? `This is a testing period — not punishing, but demanding. The themes of ${activatedThemes.join(", ")} are being stripped of what's false and rebuilt on what's real. What gets built in the next ${yearsLeft > 0 ? Math.floor(yearsLeft) + " years" : "period"} lasts precisely because it had to prove itself. ${nkMD?.shadowTheme ? `The shadow being tested: ${nkMD.shadowTheme}.` : ""}`
        : `This is a period of expansion — the themes of ${activatedThemes.join(", ")} are open and moving. ${nkMD?.keywords ? `The quality of this period: ${nkMD.keywords}.` : ""} What gets seeded now has real staying power.`;

      observations.push({
        observation,
        indicators,
        confidenceScore: 0.85,
        rarity: 0.6,
        category: "timing",
      });
    }
  }

  // ── Sort by (confidenceScore × (1 - rarity)) ──
  // High confidence + high rarity = top of list
  observations.sort((a,b) =>
    (b.confidenceScore * (1 - b.rarity + 0.5)) -
    (a.confidenceScore * (1 - a.rarity + 0.5))
  );

  return observations.slice(0, 5); // Top 5 maximum
}

// ============================================================
// TRANSIT INPUT TYPE
// ============================================================

export interface TransitPlanetInput {
  key: PlanetKey;
  name: string;
  rashiIndex: number;
  rashi: string;
  degrees: number;
  nakshatra: string;
  nakshatraPada: number;
  isRetrograde: boolean;
}

// ============================================================
// MAIN ENGINE: computeChartSignature
// ============================================================

/**
 * The single entry point for the salience engine.
 * Call this ONCE after chart calculation and store the result in chart_salience.
 * The returned ChartSignature is what gets injected into AI prompts.
 *
 * Usage:
 *   const signature = await computeChartSignature(chart, lagnaRashiIndex, nakshatraData, transitPlanets);
 *   // Store in Supabase chart_salience table
 *   // Inject into AI context instead of raw chart data
 *
 * @param chart             — full KundliChart from chart_calculations
 * @param lagnaRashiIndex   — lagna rashi index (0–11)
 * @param nakshatraData     — full nakshatra data record (from promptEngine or separate file)
 * @param transitPlanets    — today's transit positions (from transit_snapshots)
 */
export function computeChartSignature(
  chart: KundliChart,
  lagnaRashiIndex: number,
  nakshatraData: Record<string, any>,
  transitPlanets?: TransitPlanetInput[]
): ChartSignature {

  // ── 1. Planetary pressure for all 9 planets ───
  const planetaryPressure: PlanetaryPressureEntry[] = chart.planets
    .map(p => {
      const score = computePlanetaryPressure(p, chart, lagnaRashiIndex, transitPlanets);
      const nk    = nakshatraData[p.position.nakshatra];
      const mdKey = getCurrentDashaKey(chart);
      const adKey = getCurrentAntarKey(chart);

      // Is this planet currently transited?
      const isTransited = transitPlanets
        ? transitPlanets.some(tp =>
            tp.rashiIndex === p.position.rashiIndex &&
            Math.abs(tp.degrees - p.position.degrees) <= 8
          )
        : false;

      return {
        planet: p.key,
        planetName: p.name,
        pressureScore: score,
        currentlyActiveMD: p.key === mdKey,
        currentlyActiveAD: p.key === adKey,
        isCurrentlyTransited: isTransited,
        keyTheme: nk?.keywords ?? `${p.name} themes`,
        shadowTheme: nk?.shadowTheme ?? "",
      };
    })
    .sort((a,b) => b.pressureScore - a.pressureScore);

  // ── 2. Active houses (score > 4.0) ────────────
  const activeHouses: ActiveHouseEntry[] = [];
  const HOUSE_THEMES: Record<number, string> = {
    1: "identity, body, life direction — the self is under examination",
    2: "wealth, family, speech — resources and accumulation are active",
    3: "courage, communication, effort — action and initiative are called for",
    4: "home, mother, inner life — foundations are shifting or solidifying",
    5: "children, creativity, past-life merit — creative and speculative energy peaks",
    6: "obstacles, health, enemies — challenges must be met directly",
    7: "partnership, marriage, desire — relationship domain is alive",
    8: "transformation, longevity, hidden matters — depth and change are present",
    9: "dharma, fortune, guru — the path of meaning is opening or testing",
    10: "career, public life, authority — professional identity is in motion",
    11: "gains, income, fulfillment — what was worked for is arriving or clarifying",
    12: "dissolution, foreign connection, moksha — something is ending to make room",
  };

  for (let h = 1; h <= 12; h++) {
    const { score, sources } = computeHouseActivation(h, chart, lagnaRashiIndex, transitPlanets);
    if (score >= 4.0) {
      activeHouses.push({
        house: h,
        activationScore: score,
        theme: HOUSE_THEMES[h] ?? `H${h} activated`,
        activationSources: sources,
      });
    }
  }
  activeHouses.sort((a,b) => b.activationScore - a.activationScore);

  // ── 3. Timing confluence for all themes ───────
  const timingThemes: TimingTheme[] = [
    "marriage", "career_shift", "financial_gain", "financial_loss",
    "health_pressure", "spiritual_opening", "public_recognition",
    "isolation_retreat", "family_change", "relocation",
  ];

  const timingConfluence: TimingConfluence[] = timingThemes
    .map(theme => detectTimingConfluence(theme, chart, lagnaRashiIndex, transitPlanets))
    .filter((t): t is TimingConfluence => t !== null && t.confidence >= 0.45)
    .sort((a,b) => b.confidence - a.confidence);

  // ── 4. Behavioral contradictions ──────────────
  const contradictions: BehavioralContradiction[] = CONTRADICTION_PATTERNS
    .filter(pattern => pattern.condition(chart, lagnaRashiIndex))
    .map(pattern => ({
      drive1: pattern.drive1,
      drive2: pattern.drive2,
      behavioralResult: typeof pattern.behavioral === "function"
        ? pattern.behavioral(chart, lagnaRashiIndex, nakshatraData)
        : pattern.behavioral,
      indicators: pattern.indicators(chart, lagnaRashiIndex),
      confidenceScore: pattern.confidence(chart, lagnaRashiIndex),
      patternId: pattern.id,
    }))
    .filter(c => c.confidenceScore >= 0.55)
    .sort((a,b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5); // Top 5 contradictions maximum

  // ── 5. Partner signature ───────────────────────
  const partnerSignature = computePartnerSignature(chart, lagnaRashiIndex, nakshatraData);

  // ── 6. Dominant axis (top observations) ───────
  const dominantAxis = extractDominantAxis(chart, lagnaRashiIndex, nakshatraData, transitPlanets);

  return {
    dominantAxis,
    planetaryPressure,
    activeHouses,
    timingConfluence,
    contradictions,
    partnerSignature,
    computedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
  };
}

// ============================================================
// CONTEXT BUILDER
// Converts ChartSignature into the compressed prompt context.
// This is what replaces the full chart dump in promptEngine.ts.
// Max ~4000 tokens vs your current ~40000 tokens.
// ============================================================

/**
 * Builds the compressed AI context from a ChartSignature.
 * Call this in your API route before the AI call.
 * Inject the result as the system prompt context.
 *
 * @param signature     — from computeChartSignature or chart_salience table
 * @param queryClass    — from queryClassifier (determines which layers to include)
 * @param birthDetails  — name, dob, etc.
 */
export function buildSalienceContext(
  signature: ChartSignature,
  queryClass: string,
  birthDetails: { name?: string; dob?: string; pob?: string }
): string {

  const isRelationshipQuery = ["relationship_partner","relationship_compatibility","timing_marriage"].includes(queryClass);
  const isTimingQuery       = queryClass.startsWith("timing_") || queryClass === "yearly_prediction";
  const isIdentityQuery     = ["identity_core","identity_contradiction","fact_mode"].includes(queryClass);
  const isCareerQuery       = queryClass === "career_direction";

  const lines: string[] = [
    `=== CHART SIGNAL — ${(birthDetails.name ?? "NATIVE").toUpperCase()} ===`,
    `Born: ${birthDetails.dob ?? "?"} | ${birthDetails.pob ?? "?"}`,
    ``,
    `This is PRE-RANKED signal. Do not add astrology — translate this into behavior.`,
    `Do not mention planets, houses, nakshatras, or Sanskrit terms in output.`,
    `The test: could someone with zero astrology knowledge feel precisely seen?`,
    ``,
  ];

  // ── TIER 1: Always inject ──────────────────────
  lines.push(`── DOMINANT AXIS (highest confidence — lead from here) ──`);
  for (const obs of signature.dominantAxis.slice(0, 3)) {
    lines.push(`• [${obs.category.toUpperCase()} | confidence: ${Math.round(obs.confidenceScore * 100)}%]`);
    lines.push(`  ${obs.observation}`);
    lines.push(`  Internal sources: ${obs.indicators.join(" | ")}`);
    lines.push(``);
  }

  lines.push(`── TOP BEHAVIORAL CONTRADICTIONS ──`);
  if (signature.contradictions.length > 0) {
    for (const c of signature.contradictions.slice(0, 2)) {
      lines.push(`• DRIVE 1: ${c.drive1}`);
      lines.push(`  DRIVE 2: ${c.drive2}`);
      lines.push(`  IN REAL LIFE: ${c.behavioralResult}`);
      lines.push(`  Sources: ${c.indicators.join(" | ")}`);
      lines.push(``);
    }
  } else {
    lines.push(`• No strong behavioral contradictions detected — chart is relatively integrated`);
    lines.push(``);
  }

  // ── TIER 2: Inject based on query class ───────
  if (isTimingQuery || isIdentityQuery) {
    lines.push(`── CURRENT TIMING (active houses + dasha) ──`);
    for (const h of signature.activeHouses.slice(0, 4)) {
      lines.push(`• H${h.house} (score: ${h.activationScore}): ${h.theme}`);
      lines.push(`  Activated by: ${h.activationSources.slice(0, 3).join(" | ")}`);
    }
    lines.push(``);

    if (signature.timingConfluence.length > 0) {
      lines.push(`── TIMING CONFLUENCES (confirmed themes) ──`);
      for (const t of signature.timingConfluence.filter(t => t.confidence >= 0.5).slice(0, 3)) {
        lines.push(`• ${t.type.toUpperCase()} | confidence: ${Math.round(t.confidence * 100)}%`);
        lines.push(`  Window: ${t.window}`);
        lines.push(`  Quality: ${t.quality}`);
        lines.push(`  Confirmed by: ${t.layers.slice(0, 3).join(" | ")}`);
        lines.push(``);
      }
    }
  }

  if (isRelationshipQuery) {
    lines.push(`── PARTNER SIGNATURE (7 layers pre-computed) ──`);
    lines.push(`Layer 1 wound: ${signature.partnerSignature.layer1_wound}`);
    lines.push(`Layer 1 gift:  ${signature.partnerSignature.layer1_gift}`);
    lines.push(`Layer 1 keywords: ${signature.partnerSignature.layer1_keywords}`);
    lines.push(`Layer 2 (second personality): ${signature.partnerSignature.layer2_coloring}`);
    lines.push(`Darakaraka (soul archetype): ${signature.partnerSignature.darakaraka_archetype}`);
    lines.push(`Venus pattern (love experience): ${signature.partnerSignature.venus_pattern}`);
    lines.push(`Recurring dynamic (from aspects): ${signature.partnerSignature.recurring_dynamic}`);
    lines.push(`Sharpest observation: ${signature.partnerSignature.most_specific_observation}`);
    lines.push(``);

    // Also include marriage timing if relevant
    const marriageTiming = signature.timingConfluence.find(t => t.type === "marriage");
    if (marriageTiming) {
      lines.push(`Marriage timing window: ${marriageTiming.window} (confidence: ${Math.round(marriageTiming.confidence * 100)}%)`);
      lines.push(`Window quality: ${marriageTiming.quality}`);
      lines.push(``);
    }
  }

  if (isCareerQuery) {
    lines.push(`── CAREER SIGNAL ──`);
    const careerTiming = signature.timingConfluence.find(t => t.type === "career_shift");
    if (careerTiming) {
      lines.push(`Career shift window: ${careerTiming.window} | confidence: ${Math.round(careerTiming.confidence * 100)}%`);
      lines.push(`Quality: ${careerTiming.quality}`);
    }
    for (const h of signature.activeHouses.filter(h => [1,9,10,11].includes(h.house))) {
      lines.push(`H${h.house}: ${h.theme}`);
    }
    lines.push(``);
  }

  // ── TIER 3: Planetary pressure (always, compressed) ──
  lines.push(`── HIGHEST PRESSURE PLANETS ──`);
  for (const p of signature.planetaryPressure.slice(0, 4)) {
    const flags = [
      p.currentlyActiveMD && "ACTIVE MD",
      p.currentlyActiveAD && "ACTIVE AD",
      p.isCurrentlyTransited && "TRANSITED",
    ].filter(Boolean).join(" + ");
    lines.push(`• ${p.planetName} (score: ${p.pressureScore}) ${flags ? `[${flags}]` : ""}`);
    lines.push(`  Theme: ${p.keyTheme}`);
    lines.push(`  Shadow: ${p.shadowTheme}`);
  }

  lines.push(``);
  lines.push(`=== END SIGNAL ===`);
  lines.push(`Translate everything above into behavioral observation, emotional texture,`);
  lines.push(`and quality of time. Never speak astrology. Speak the person's life.`);

  return lines.join("\n");
}