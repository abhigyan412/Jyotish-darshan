// ─── Astrology Core Types ───────────────────────────────────────────────────

export interface BirthDetails {
  name: string;
  dob: string;      // YYYY-MM-DD
  tob: string;      // HH:MM
  pob: string;      // city name
  lat: number;
  lon: number;
  timezone: number; // UTC offset in hours
}

export type PlanetKey =
  | "su" | "mo" | "ma" | "me" | "ju" | "ve" | "sa" | "ra" | "ke";

export type RashiName =
  | "Aries" | "Taurus" | "Gemini" | "Cancer"
  | "Leo" | "Virgo" | "Libra" | "Scorpio"
  | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export interface RashiPosition {
  rashi: RashiName;
  rashiIndex: number;  // 0–11
  symbol: string;
  degrees: number;     // degrees within rashi (0–29.99)
  totalDegrees: number; // full sidereal longitude
  nakshatra: string;
  nakshatraPada: number;
}

export interface PlanetInfo {
  key: PlanetKey;
  name: string;
  symbol: string;
  position: RashiPosition;
  house: number;       // 1–12 from Lagna
  isRetrograde: boolean;
  isCombust: boolean;
  isExalted: boolean;
  isDebilitated: boolean;
}

export interface KundliChart {
  lagna: RashiPosition;
  planets: PlanetInfo[];
  houses: HouseData[];
  dashas: DashaPeriod[];
  yogas: Yoga[];
}

export interface HouseData {
  number: number;        // 1–12
  rashiIndex: number;
  rashi: RashiName;
  lord: PlanetKey;
  planets: PlanetKey[];
}

export interface DashaPeriod {
  planet: PlanetKey;
  planetName: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  years: number;
  isActive: boolean;
  antardasha?: AnterDasha[];
}

export interface AnterDasha {
  planet: PlanetKey;
  planetName: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Yoga {
  name: string;
  description: string;
  planets: PlanetKey[];
  strength: "weak" | "moderate" | "strong";
  isBenefic: boolean;
}

// ─── AI Interpretation Types ─────────────────────────────────────────────────

export interface InterpretationRequest {
  birthDetails: BirthDetails;
  chart: KundliChart;
  section: InterpretationSection;
}

export type InterpretationSection =
  | "personality"
  | "career"
  | "relationships"
  | "health"
  | "spiritual"
  | "remedies"
  | "full";

export interface InterpretationResult {
  section: InterpretationSection;
  content: string;
  loading: boolean;
  error?: string;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type AppTab = "chart" | "interpretation" | "dasha" | "remedies";

export interface AppState {
  step: "form" | "chart";
  activeTab: AppTab;
  birthDetails: BirthDetails | null;
  chart: KundliChart | null;
  interpretations: Partial<Record<InterpretationSection, InterpretationResult>>;
  isCalculating: boolean;
  error: string | null;
}
