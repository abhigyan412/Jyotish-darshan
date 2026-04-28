/**
 * Vedic Astrology Calculation Engine
 * Uses simplified VSOP87 + Lahiri Ayanamsa for sidereal positions
 */

import type {
  BirthDetails, KundliChart, PlanetInfo, PlanetKey,
  RashiPosition, RashiName, HouseData, DashaPeriod,
  AnterDasha, Yoga,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

export const RASHIS: RashiName[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const RASHI_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export const PLANET_META: Record<PlanetKey, { name: string; symbol: string }> = {
  su: { name: "Sun", symbol: "☉" },
  mo: { name: "Moon", symbol: "☽" },
  ma: { name: "Mars", symbol: "♂" },
  me: { name: "Mercury", symbol: "☿" },
  ju: { name: "Jupiter", symbol: "♃" },
  ve: { name: "Venus", symbol: "♀" },
  sa: { name: "Saturn", symbol: "♄" },
  ra: { name: "Rahu", symbol: "☊" },
  ke: { name: "Ketu", symbol: "☋" },
};

export const RASHI_LORDS: Record<number, PlanetKey> = {
  0: "ma", 1: "ve", 2: "me", 3: "mo", 4: "su", 5: "me",
  6: "ve", 7: "ma", 8: "ju", 9: "sa", 10: "sa", 11: "ju",
};

const EXALTATION: Partial<Record<PlanetKey, number>> = {
  su: 0, mo: 1, ma: 9, me: 5, ju: 3, ve: 11, sa: 6,
};
const DEBILITATION: Partial<Record<PlanetKey, number>> = {
  su: 6, mo: 7, ma: 3, me: 11, ju: 9, ve: 5, sa: 0,
};

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const NAKSHATRA_LORDS: PlanetKey[] = [
  "ke", "ve", "su", "mo", "ma", "ra", "ju", "sa", "me",
  "ke", "ve", "su", "mo", "ma", "ra", "ju", "sa", "me",
  "ke", "ve", "su", "mo", "ma", "ra", "ju", "sa", "me",
];

const DASHA_YEARS: Record<PlanetKey, number> = {
  ke: 7, ve: 20, su: 6, mo: 10, ma: 7, ra: 18, ju: 16, sa: 19, me: 17
};

const DASHA_ORDER: PlanetKey[] = ["ke", "ve", "su", "mo", "ma", "ra", "ju", "sa", "me"];

// ─── Julian Day ───────────────────────────────────────────────────────────────

export function toJulianDay(dob: string, tob: string, tzOffset: number): number {
  const [year, month, day] = dob.split("-").map(Number);
  const [hour, minute] = tob.split(":").map(Number);
  const utcHour = hour + minute / 60 - tzOffset;
  const utcMs = Date.UTC(year, month - 1, day) + utcHour * 3600000;

  console.log("JD DEBUG", {
    year, month, day, hour, minute, utcHour, utcMs,
    dateCheck: new Date(utcMs).toISOString()
  });

  return utcMs / 86400000 + 2440587.5;
}

// ─── Lahiri Ayanamsa ──────────────────────────────────────────────────────────

export function getLahiriAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  // Lahiri ayanamsa — more precise
  return 23.85472 + 1.3972 * T;
}
// ─── Tropical → Sidereal ──────────────────────────────────────────────────────

function sidereal(tropical: number, ayanamsa: number): number {
  return ((tropical - ayanamsa) % 360 + 360) % 360;
}

// ─── Planet Position (Tropical) ───────────────────────────────────────────────

// ─── Heliocentric XY helper ───────────────────────────────────────────────────

function helioXY(
  T: number, L0: number, L1: number,
  M0: number, M1: number,
  C1: number, C2: number, a: number
): { x: number; y: number } {
  const DEG = Math.PI / 180;
  const L = (((L0 + L1 * T) % 360) + 360) % 360 * DEG;
  const M = (((M0 + M1 * T) % 360) + 360) % 360 * DEG;
  const C = (C1 * Math.sin(M) + C2 * Math.sin(2 * M)) * DEG;
  return { x: a * Math.cos(L + C), y: a * Math.sin(L + C) };
}

// ─── Planet Position (Tropical) ───────────────────────────────────────────────

function tropicalLongitude(key: PlanetKey, d: number): number {
  const T = d / 36525.0;
  const DEG = Math.PI / 180;
  const mod = (x: number) => ((x % 360) + 360) % 360;

  // Earth heliocentric (needed for inner planet geocentric conversion)
  const earth = helioXY(T, 100.4664, 36000.7698, 357.5291, 35999.0503, 1.9146, 0.0200, 1.0000);

  // Geocentric from heliocentric XY
  const geo = (p: { x: number; y: number }) =>
    mod(Math.atan2(p.y - earth.y, p.x - earth.x) / DEG);

  // Outer planet direct geocentric formula
  const outer = (L0: number, L1: number, M0: number, M1: number, C1: number, C2: number) => {
    const L = L0 + L1 * T;
    const M = mod(M0 + M1 * T) * DEG;
    return mod(L + C1 * Math.sin(M) + C2 * Math.sin(2 * M));
  };

  switch (key) {
    case "su":
      return outer(280.46646, 36000.76983, 357.52911, 35999.05029, 1.914602, 0.019993);

    case "mo": {
      const M = (134.9634 + 477198.8676 * T) * DEG;
      const D = (297.8502 + 445267.1115 * T) * DEG;
      const F = (93.2721 + 483202.0175 * T) * DEG;
      return mod(
        218.3165 + 481267.8813 * T
        + 6.2888 * Math.sin(M)
        + 1.2740 * Math.sin(2 * D - M)
        + 0.6583 * Math.sin(2 * D)
        + 0.2136 * Math.sin(2 * M)
        - 0.1851 * Math.sin(D * 2)
        + 0.1144 * Math.sin(2 * F)
        - 0.0588 * Math.sin(2 * D - 2 * M)
        + 0.0533 * Math.sin(2 * D + M)
      );
    }

    case "me":
      return geo(helioXY(T, 252.2509, 149472.6746, 174.7948, 149472.6746, 23.4400, 2.9818, 0.3871));

    case "ve":
      return geo(helioXY(T, 181.9798, 58517.8156, 50.4161, 58517.8156, 0.7758, 0.0033, 0.7233));

    case "ma":
      return geo(helioXY(T, 355.4333, 19140.3027, 19.3730, 19140.3027, 10.6912, 0.6228, 1.5237));

    case "ju":
      return geo(helioXY(T, 34.3515, 3034.9057, 20.0202, 3034.9057, 5.5549, 0.1683, 5.2026));

    case "sa":
      return geo(helioXY(T, 50.0774, 1222.1138, 317.0207, 1222.1138, 6.3585, 0.2204, 9.5549));

    case "ra":
      return mod(125.0445 - 1934.1363 * T);

    case "ke":
      return mod(305.0445 - 1934.1363 * T);
  }
}

// ─── Ascendant (Lagna) ────────────────────────────────────────────────────────

function calcLagnaTropical(jd: number, lat: number, lon: number): number {
  const T = (jd - 2451545.0) / 36525.0;

  const GMST = (280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T) % 360;

  const LST = ((GMST + lon) % 360 + 360) % 360;
  const LSTR = LST * Math.PI / 180;

  const eps = (23.439291111 - 0.013004167 * T) * Math.PI / 180;
  const latR = lat * Math.PI / 180;

  const sinLST = Math.sin(LSTR);
  const cosLST = Math.cos(LSTR);
  let asc = Math.atan2(-cosLST, Math.sin(eps) * Math.tan(latR) + Math.cos(eps) * sinLST) / (Math.PI / 180);
  asc = ((asc + 180) % 360 + 360) % 360;
  asc = (asc + 360) % 360;

  return asc;
}
// ─── Retrograde Detection ─────────────────────────────────────────────────────

function isRetrograde(key: PlanetKey, d: number): boolean {
  if (key === "ra" || key === "ke") return true;  // always retrograde
  if (key === "su" || key === "mo") return false;  // never retrograde

  const T0 = (d - 1) / 36525.0;
  const T1 = (d + 1) / 36525.0;

  // Use d-based versions for consistency
  const pos0 = tropicalLongitude(key, d - 1);
  const pos1 = tropicalLongitude(key, d + 1);

  let diff = pos1 - pos0;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

// ─── Combust Detection ────────────────────────────────────────────────────────

const COMBUST_ORB: Partial<Record<PlanetKey, number>> = {
  mo: 12, ma: 17, me: 14, ju: 11, ve: 10, sa: 15,
};

function isCombust(key: PlanetKey, planetLon: number, sunLon: number): boolean {
  const orb = COMBUST_ORB[key];
  if (!orb) return false;
  let diff = Math.abs(planetLon - sunLon);
  if (diff > 180) diff = 360 - diff;
  return diff < orb;
}

// ─── Rashi Position Builder ───────────────────────────────────────────────────

function toRashiPosition(sidLon: number): RashiPosition {
  const totalDegrees = (sidLon + 360) % 360;
  const rashiIndex = Math.floor(totalDegrees / 30);
  const degrees = totalDegrees % 30;
  const nakshatraIndex = Math.floor(totalDegrees / (360 / 27));
  const pada = Math.floor((totalDegrees % (360 / 27)) / (360 / 27 / 4)) + 1;
  return {
    rashi: RASHIS[rashiIndex],
    rashiIndex,
    symbol: RASHI_SYMBOLS[rashiIndex],
    degrees: parseFloat(degrees.toFixed(2)),
    totalDegrees: parseFloat(totalDegrees.toFixed(4)),
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraPada: pada,
  };
}

// ─── Yoga Detection ───────────────────────────────────────────────────────────

function detectYogas(planets: PlanetInfo[], lagna: RashiPosition): Yoga[] {
  const yogas: Yoga[] = [];
  const get = (k: PlanetKey) => planets.find(p => p.key === k)!;
  const ju = get("ju"), sa = get("sa"), mo = get("mo"),
    su = get("su"), ve = get("ve"), ma = get("ma"), me = get("me"),
    ra = get("ra"), ke = get("ke");

  const kendras = [1, 4, 7, 10];
  const trikonas = [1, 5, 9];

  // ── Gajakesari Yoga: Jupiter in kendra from Moon ──────────────────────────
  const moJuDiff = ((ju.house - mo.house + 12) % 12) + 1;
  const moJuDiffRev = ((mo.house - ju.house + 12) % 12) + 1;
  if (kendras.includes(moJuDiff) || kendras.includes(moJuDiffRev) || ju.house === mo.house) {
    yogas.push({
      name: "Gajakesari Yoga",
      description: "Jupiter in angular house from Moon — bestows wisdom, fame, and prosperity.",
      planets: ["ju", "mo"],
      strength: "strong",
      isBenefic: true,
    });
  }

  // ── Budhaditya Yoga: Sun + Mercury in same house ──────────────────────────
  if (su.house === me.house) {
    yogas.push({
      name: "Budhaditya Yoga",
      description: "Sun and Mercury conjunct — sharp intellect, success in education and communication.",
      planets: ["su", "me"],
      strength: me.isCombust ? "weak" : "moderate",
      isBenefic: true,
    });
  }

  // ── Pancha Mahapurusha Yogas (relaxed: kendra + own/exalt/friendly sign) ─
  // Ruchaka: Mars in kendra in Aries, Scorpio, or Capricorn
  if (kendras.includes(ma.house) && [0, 7, 9].includes(ma.position.rashiIndex)) {
    yogas.push({ name: "Ruchaka Yoga", description: "Mars strong in angular house — courageous, disciplined, natural leader.", planets: ["ma"], strength: "strong", isBenefic: true });
  }
  // Bhadra: Mercury in kendra in Gemini or Virgo
  if (kendras.includes(me.house) && [2, 5].includes(me.position.rashiIndex)) {
    yogas.push({ name: "Bhadra Yoga", description: "Mercury in own/exaltation sign in kendra — exceptional intellect and communication.", planets: ["me"], strength: "strong", isBenefic: true });
  }
  // Hamsa: Jupiter in kendra in Sagittarius, Pisces, or Cancer
  if (kendras.includes(ju.house) && [8, 11, 3].includes(ju.position.rashiIndex)) {
    yogas.push({ name: "Hamsa Yoga", description: "Jupiter strong in kendra — spiritual wisdom, prosperity, righteous conduct.", planets: ["ju"], strength: "strong", isBenefic: true });
  }
  // Malavya: Venus in kendra in Taurus, Libra, or Pisces
  if (kendras.includes(ve.house) && [1, 6, 11].includes(ve.position.rashiIndex)) {
    yogas.push({ name: "Malavya Yoga", description: "Venus strong in kendra — beauty, luxury, artistic talent, good spouse.", planets: ["ve"], strength: "strong", isBenefic: true });
  }
  // Shasha: Saturn in kendra in Capricorn, Aquarius, or Libra
  if (kendras.includes(sa.house) && [9, 10, 6].includes(sa.position.rashiIndex)) {
    yogas.push({ name: "Shasha Yoga", description: "Saturn strong in kendra — authority, discipline, success through persistence.", planets: ["sa"], strength: "strong", isBenefic: true });
  }

  // ── Chandra-Mangala Yoga: Moon + Mars conjunct or 7th from each other ─────
  const moMaDiff = Math.abs(mo.house - ma.house);
  if (moMaDiff === 0 || moMaDiff === 6) {
    yogas.push({ name: "Chandra-Mangala Yoga", description: "Moon and Mars in strong relationship — financial acumen, bold and enterprising nature.", planets: ["mo", "ma"], strength: "moderate", isBenefic: true });
  }

  // ── Adhi Yoga: Mercury, Venus, Jupiter in 6th/7th/8th from Moon ──────────
  const fromMoon = (p: PlanetInfo) => ((p.house - mo.house + 12) % 12) + 1;
  const adhiHouses = [6, 7, 8];
  if (adhiHouses.includes(fromMoon(me)) && adhiHouses.includes(fromMoon(ve)) && adhiHouses.includes(fromMoon(ju))) {
    yogas.push({ name: "Adhi Yoga", description: "Benefic planets in 6/7/8 from Moon — leadership, ministerial qualities, defeat of enemies.", planets: ["me", "ve", "ju"], strength: "strong", isBenefic: true });
  }

  // ── Neecha Bhanga Raja Yoga: Debilitated planet gets cancellation ─────────
  const debilPlanets = planets.filter(p => p.isDebilitated && !["ra", "ke"].includes(p.key));
  for (const dp of debilPlanets) {
    const debilLord = RASHI_LORDS[DEBILITATION[dp.key]!];
    const lord = get(debilLord);
    if (kendras.includes(lord.house) || trikonas.includes(lord.house)) {
      yogas.push({ name: "Neecha Bhanga Raja Yoga", description: `${dp.name}'s debilitation is cancelled — struggles transform into strength and eventual success.`, planets: [dp.key, debilLord], strength: "moderate", isBenefic: true });
      break;
    }
  }

  // ── Kemadruma Yoga: Moon with no planets in 2nd or 12th ──────────────────
  const hasNeighbor = planets.some(p =>
    !["ra", "ke", "mo"].includes(p.key) &&
    (p.house === ((mo.house) % 12) + 1 || p.house === ((mo.house - 2 + 12) % 12) + 1)
  );
  if (!hasNeighbor) {
    yogas.push({ name: "Kemadruma Yoga", description: "Moon isolated from planets — emotional sensitivity, periods of self-reliance and introspection.", planets: ["mo"], strength: "weak", isBenefic: false });
  }

  // ── Dharma-Karmadhipati Yoga: 9th and 10th lords in conjunction ──────────
  const lord9key = RASHI_LORDS[(lagna.rashiIndex + 8) % 12];
  const lord10key = RASHI_LORDS[(lagna.rashiIndex + 9) % 12];
  const lord9 = get(lord9key), lord10 = get(lord10key);
  if (lord9.house === lord10.house && lord9key !== lord10key) {
    yogas.push({ name: "Dharma-Karmadhipati Yoga", description: "Lords of 9th and 10th conjunct — career aligned with dharma, professional excellence and recognition.", planets: [lord9key, lord10key], strength: "strong", isBenefic: true });
  }

  // ── Viparita Raja Yoga: 6th/8th/12th lords in each other's houses ────────
  const dusthana = [6, 8, 12];
  const dusthanaLords = dusthana.map(h => get(RASHI_LORDS[(lagna.rashiIndex + h - 1) % 12]));
  const allInDusthana = dusthanaLords.every(p => dusthana.includes(p.house));
  if (allInDusthana) {
    yogas.push({ name: "Viparita Raja Yoga", description: "Dusthana lords confined to dusthana houses — rise after adversity, unexpected success.", planets: dusthanaLords.map(p => p.key), strength: "moderate", isBenefic: true });
  }

  return yogas;
}
// ─── Vimshottari Dasha ────────────────────────────────────────────────────────

function calcDashas(birthDate: string, moonPos: RashiPosition): DashaPeriod[] {
  const nakshatraIndex = Math.floor(moonPos.totalDegrees / (360 / 27));
  const lordKey = NAKSHATRA_LORDS[nakshatraIndex];
  const startDashaIdx = DASHA_ORDER.indexOf(lordKey);

  // How far through current nakshatra is the moon?
  const nakshatraDeg = 360 / 27;
  const degInNakshatra = moonPos.totalDegrees % nakshatraDeg;
  const fractionElapsed = degInNakshatra / nakshatraDeg;
  const currentDashaYears = DASHA_YEARS[lordKey];
  const yearsElapsed = fractionElapsed * currentDashaYears;

  const birth = new Date(birthDate);
  // Start date adjusted backwards for elapsed portion
  const startDate = new Date(birth);
  startDate.setFullYear(startDate.getFullYear() - Math.floor(yearsElapsed));
  startDate.setMonth(startDate.getMonth() - Math.round((yearsElapsed % 1) * 12));

  const now = new Date();
  const dashas: DashaPeriod[] = [];
  let cursor = new Date(startDate);

  for (let i = 0; i < 9; i++) {
    const key = DASHA_ORDER[(startDashaIdx + i) % 9];
    const years = DASHA_YEARS[key];
    const end = new Date(cursor);
    end.setFullYear(end.getFullYear() + years);

    // Generate antardasha
    const antardasha: AnterDasha[] = [];
    let aCursor = new Date(cursor);
    for (let j = 0; j < 9; j++) {
      const aKey = DASHA_ORDER[(DASHA_ORDER.indexOf(key) + j) % 9];
      const aYears = (DASHA_YEARS[aKey] * years) / 120;
      const aEnd = new Date(aCursor);
      aEnd.setDate(aEnd.getDate() + Math.round(aYears * 365.25));
      antardasha.push({
        planet: aKey,
        planetName: PLANET_META[aKey].name,
        startDate: new Date(aCursor),
        endDate: new Date(aEnd),
        isActive: now >= aCursor && now < aEnd,
      });
      aCursor = new Date(aEnd);
    }

    dashas.push({
      planet: key,
      planetName: PLANET_META[key].name,
      symbol: PLANET_META[key].symbol,
      startDate: new Date(cursor),
      endDate: new Date(end),
      years,
      isActive: now >= cursor && now < end,
      antardasha,
    });

    cursor = new Date(end);
  }

  return dashas;
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export function calculateKundli(details: BirthDetails): KundliChart {
  const jd = toJulianDay(details.dob, details.tob, details.timezone);
  const d = jd - 2451545.0;
  const ayanamsa = getLahiriAyanamsa(jd);

  // Lagna
  const lagnaTropical = calcLagnaTropical(jd, details.lat, details.lon);
  const lagna = toRashiPosition(sidereal(lagnaTropical, ayanamsa));

  console.log("DEBUG", {
    jd,
    lagnaTropical: lagnaTropical.toFixed(2),
    ayanamsa: ayanamsa.toFixed(2),
    lagnaAfterAyanamsa: (((lagnaTropical - ayanamsa) % 360 + 360) % 360).toFixed(2),
    lat: details.lat,
    lon: details.lon,
    timezone: details.timezone,
  });

  // Sun position (needed for combust check)
  const sunTropical = tropicalLongitude("su", d);
  const sunSid = sidereal(sunTropical, ayanamsa);

  // All planets
  const planets: PlanetInfo[] = (Object.keys(PLANET_META) as PlanetKey[]).map(key => {
    const tropical = tropicalLongitude(key, d);
    const sid = sidereal(tropical, ayanamsa);
    const pos = toRashiPosition(sid);
    const house = ((pos.rashiIndex - lagna.rashiIndex + 12) % 12) + 1;
    const retro = isRetrograde(key, d);
    const combust = isCombust(key, sid, sunSid);
    const exalted = EXALTATION[key] === pos.rashiIndex;
    const debilitated = DEBILITATION[key] === pos.rashiIndex;
    return {
      key, name: PLANET_META[key].name, symbol: PLANET_META[key].symbol,
      position: pos, house, isRetrograde: retro,
      isCombust: combust, isExalted: exalted, isDebilitated: debilitated
    };
  });

  // Houses
  const houses: HouseData[] = Array.from({ length: 12 }, (_, i) => {
    const houseRashiIdx = (lagna.rashiIndex + i) % 12;
    const planetsInHouse = planets.filter(p => p.house === i + 1).map(p => p.key);
    return {
      number: i + 1,
      rashiIndex: houseRashiIdx,
      rashi: RASHIS[houseRashiIdx],
      lord: RASHI_LORDS[houseRashiIdx],
      planets: planetsInHouse,
    };
  });

  const moon = planets.find(p => p.key === "mo")!;
  const dashas = calcDashas(details.dob, moon.position);
  const yogas = detectYogas(planets, lagna);

  return { lagna, planets, houses, dashas, yogas };
}
