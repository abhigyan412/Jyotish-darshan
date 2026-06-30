import type { BirthDetails, KundliChart, PlanetKey, PlanetInfo } from "@/types";
import { PLANET_META, RASHIS, RASHI_LORDS } from "@/lib/astro";

// ─── Nakshatra deep data ──────────────────────────────────────────────────────

export const NAKSHATRA_DATA: Record<string, {
  deity: string; symbol: string; quality: string; guna: string;
  nature: string; bodyPart: string; keywords: string;
  dosha: string; animalTotem: string; goal: string; gender: string;
  shadowTheme: string; spiritualLesson: string;
}> = {
  "Ashwini":           { deity: "Ashwini Kumaras", symbol: "Horse's head",    quality: "Movable",   guna: "Rajas",  nature: "Deva",    bodyPart: "Knees",              keywords: "Healing, speed, initiation, impulsiveness",                             dosha: "Vata",  animalTotem: "Male Horse",   goal: "Dharma",  gender: "Male",   shadowTheme: "Impatience, rashness, starting without finishing",                 spiritualLesson: "Learn to complete what you begin; true healing requires stillness too" },
  "Bharani":           { deity: "Yama",             symbol: "Yoni",            quality: "Fixed",     guna: "Rajas",  nature: "Manushya",bodyPart: "Head",               keywords: "Transformation, restraint, creative power, extremes",                   dosha: "Pitta", animalTotem: "Male Elephant",goal: "Artha",   gender: "Female", shadowTheme: "Obsession, moral extremism, difficulty releasing",                 spiritualLesson: "The womb of Yama teaches: death is not the enemy — clinging is" },
  "Krittika":          { deity: "Agni",             symbol: "Razor/flame",     quality: "Mixed",     guna: "Rajas",  nature: "Rakshasa",bodyPart: "Eyes/neck",          keywords: "Sharp intellect, purification, fame, severity, cutting through illusion",dosha: "Kapha", animalTotem: "Female Sheep", goal: "Kama",    gender: "Female", shadowTheme: "Harsh criticism, burning bridges, pride in cutting",               spiritualLesson: "Agni purifies but also nourishes — temper the blade with warmth" },
  "Rohini":            { deity: "Brahma/Prajapati", symbol: "Chariot/temple",  quality: "Fixed",     guna: "Rajas",  nature: "Manushya",bodyPart: "Forehead/eyes",      keywords: "Growth, beauty, fertility, material abundance, possessiveness",         dosha: "Kapha", animalTotem: "Male Cobra",   goal: "Moksha",  gender: "Female", shadowTheme: "Possessiveness, jealousy, over-attachment to beauty and comfort",  spiritualLesson: "Prajapati's beloved: abundance flows when you stop hoarding it" },
  "Mrigashira":        { deity: "Soma (Moon)",      symbol: "Deer's head",     quality: "Soft",      guna: "Tamas",  nature: "Deva",    bodyPart: "Eyes/eyebrows",      keywords: "Seeking, sensitivity, gentle, wandering, research, perpetual search",   dosha: "Pitta", animalTotem: "Female Serpent",goal: "Moksha", gender: "Neutral",shadowTheme: "Endless searching, restlessness, never satisfied with what is found",spiritualLesson: "The deer finds water by stopping — learn when the search is complete" },
  "Ardra":             { deity: "Rudra",            symbol: "Teardrop/diamond",quality: "Sharp",     guna: "Tamas",  nature: "Manushya",bodyPart: "Hair/skull",         keywords: "Storm, destruction then renewal, grief, intensity, raw power, catharsis",dosha: "Vata",  animalTotem: "Female Dog",   goal: "Artha",   gender: "Female", shadowTheme: "Addictive intensity, enjoying chaos, grief turned to destruction",  spiritualLesson: "Rudra weeps before he transforms — grief IS the doorway, not the obstacle" },
  "Punarvasu":         { deity: "Aditi",            symbol: "Bow/quiver",      quality: "Movable",   guna: "Rajas",  nature: "Deva",    bodyPart: "Nose/fingers",       keywords: "Return, renewal, optimism, expansion, philosophical, restoration",      dosha: "Vata",  animalTotem: "Female Cat",   goal: "Artha",   gender: "Male",   shadowTheme: "Naivety, over-optimism, inability to sustain focus long-term",     spiritualLesson: "Aditi is the boundless mother — her gift is the return, not the arrival" },
  "Pushya":            { deity: "Brihaspati",       symbol: "Flower/circle",   quality: "Fixed",     guna: "Tamas",  nature: "Deva",    bodyPart: "Face/mouth",         keywords: "Nourishment, dharma, spirituality, guru energy, stability, cherishing", dosha: "Pitta", animalTotem: "Male Goat",    goal: "Dharma",  gender: "Male",   shadowTheme: "Rigidity, dogmatic teaching, smothering care, over-protectiveness", spiritualLesson: "Jupiter's own nakshatra: wisdom that nourishes never controls" },
  "Ashlesha":          { deity: "Nagas (serpents)", symbol: "Coiled serpent",  quality: "Sharp",     guna: "Sattva", nature: "Rakshasa",bodyPart: "Ears/joints",        keywords: "Kundalini, mysticism, deception, penetrating wisdom, hypnotic, binding", dosha: "Kapha", animalTotem: "Male Cat",     goal: "Dharma",  gender: "Female", shadowTheme: "Manipulation, coiling around others, using charm to control",      spiritualLesson: "The serpent's wisdom: shed the skin of ego, not to consume — to liberate" },
  "Magha":             { deity: "Pitrs (ancestors)",symbol: "Throne/palanquin",quality: "Fixed",     guna: "Tamas",  nature: "Rakshasa",bodyPart: "Nose",               keywords: "Royal authority, pride, ancestral karma, leadership, honors, lineage",  dosha: "Kapha", animalTotem: "Male Rat",     goal: "Artha",   gender: "Female", shadowTheme: "Arrogance, ancestor-worship over living dharma, entitlement",      spiritualLesson: "The throne is empty unless you serve those who placed you on it" },
  "Purva Phalguni":    { deity: "Bhaga",            symbol: "Front of bed",    quality: "Fierce",    guna: "Rajas",  nature: "Manushya",bodyPart: "Right hand/sex organ",keywords: "Pleasure, creativity, relaxation, partnership, sensuality, indulgence", dosha: "Pitta", animalTotem: "Female Rat",   goal: "Kama",    gender: "Female", shadowTheme: "Hedonism, avoidance of difficulty through pleasure, laziness",     spiritualLesson: "Bhaga is the god of pleasure AND good fortune — joy IS the path when it is conscious" },
  "Uttara Phalguni":   { deity: "Aryaman",          symbol: "Back of bed",     quality: "Fixed",     guna: "Rajas",  nature: "Manushya",bodyPart: "Left hand",          keywords: "Contracts, marriage, service, social responsibility, patronage, unions", dosha: "Vata",  animalTotem: "Male Cow",     goal: "Moksha",  gender: "Female", shadowTheme: "Service without boundaries, martyrdom disguised as virtue",        spiritualLesson: "Aryaman governs sacred contracts — even your service to others is a vow, not a loss of self" },
  "Hasta":             { deity: "Savitar (Sun)",    symbol: "Open hand",       quality: "Movable",   guna: "Rajas",  nature: "Deva",    bodyPart: "Hands",              keywords: "Skill, craftsmanship, healing touch, practical intelligence, dexterity",dosha: "Vata",  animalTotem: "Female Buffalo",goal: "Moksha", gender: "Male",   shadowTheme: "Cunning, manipulation through skill, using cleverness dishonestly",spiritualLesson: "The open hand gives and receives — a clenched fist holds neither light nor love" },
  "Chitra":            { deity: "Vishvakarma",      symbol: "Pearl/bright gem", quality: "Soft",     guna: "Tamas",  nature: "Rakshasa",bodyPart: "Forehead/neck",      keywords: "Architecture, beauty, illusion, Maya, artistic brilliance, ornamentation",dosha:"Pitta",animalTotem: "Female Tiger",goal: "Kama",   gender: "Female", shadowTheme: "Obsession with appearances, surface beauty masking inner emptiness",spiritualLesson: "Vishvakarma's creations: the most beautiful thing is built from divine blueprint, not ego" },
  "Swati":             { deity: "Vayu (Wind)",      symbol: "Sword/coral",     quality: "Movable",   guna: "Tamas",  nature: "Deva",    bodyPart: "Chest",              keywords: "Independence, flexibility, trade, diplomacy, scattered energy, freedom", dosha: "Kapha", animalTotem: "Male Buffalo",  goal: "Artha",   gender: "Female", shadowTheme: "Inability to commit, scattered force, bending so much one breaks",  spiritualLesson: "The sword of Vayu cuts through — but only when stillness gives the blade direction" },
  "Vishakha":          { deity: "Indra-Agni",       symbol: "Triumphal arch",  quality: "Mixed",     guna: "Rajas",  nature: "Rakshasa",bodyPart: "Arms/breasts",       keywords: "Ambition, focus, jealousy, determination, split purpose, achievement",  dosha: "Kapha", animalTotem: "Male Tiger",   goal: "Dharma",  gender: "Female", shadowTheme: "Jealousy of others' achievements, laser focus that burns those nearby",spiritualLesson: "The triumphal arch marks victory — but Indra and Agni remind: the fire must be righteous" },
  "Anuradha":          { deity: "Mitra",            symbol: "Lotus/umbrella",  quality: "Soft",      guna: "Tamas",  nature: "Deva",    bodyPart: "Heart/stomach",      keywords: "Devotion, friendship, occult, organization, deep loyalty, inner fire",  dosha: "Pitta", animalTotem: "Female Deer",  goal: "Dharma",  gender: "Male",   shadowTheme: "Devotion that becomes dependency, occult obsession, secretive nature",spiritualLesson: "Mitra is the god of friendship and contracts — true loyalty never diminishes the self" },
  "Jyeshtha":          { deity: "Indra",            symbol: "Earring/umbrella",quality: "Sharp",     guna: "Rajas",  nature: "Rakshasa",bodyPart: "Tongue/right side",  keywords: "Seniority, protection, occult power, isolation, eldest burden, mastery",dosha: "Vata",  animalTotem: "Male Deer",    goal: "Artha",   gender: "Female", shadowTheme: "Pride of position, using power to isolate others, martyrdom complex",spiritualLesson: "Indra's last nakshatra: the greatest protector is the one who no longer needs the title" },
  "Mula":              { deity: "Nirrti (Kali)",    symbol: "Tied roots",      quality: "Sharp",     guna: "Tamas",  nature: "Rakshasa",bodyPart: "Feet",               keywords: "Uprooting, investigation, destruction of illusion, liberation, research",dosha: "Vata",  animalTotem: "Male Dog",     goal: "Kama",    gender: "Neutral",shadowTheme: "Destructiveness for its own sake, inability to build after uprooting",spiritualLesson: "Nirrti tears the root so the sacred tree of truth may grow — destruction in service of truth" },
  "Purva Ashadha":     { deity: "Apas (Waters)",    symbol: "Fan/winnowing",   quality: "Fierce",    guna: "Rajas",  nature: "Manushya",bodyPart: "Thighs",             keywords: "Invincibility, purification, early victory, pride, declaration, momentum",dosha:"Pitta",animalTotem: "Male Monkey", goal: "Moksha",  gender: "Female", shadowTheme: "Premature victory declarations, inflexibility, pride before completion",spiritualLesson: "Apas purify by flow, not by force — true invincibility is surrender to the greater current" },
  "Uttara Ashadha":    { deity: "Vishvadevas",      symbol: "Elephant tusk",   quality: "Fixed",     guna: "Rajas",  nature: "Manushya",bodyPart: "Thighs",             keywords: "Final victory, responsibility, introspection, permanent achievement, dharma",dosha:"Kapha",animalTotem:"Female Mongoose",goal:"Moksha",gender:"Female",shadowTheme:"Crushing responsibility, inability to delegate, seriousness that kills joy",spiritualLesson: "The elephant tusk: great strength must be in service to all the Vishvadevas — the ten virtues" },
  "Shravana":          { deity: "Vishnu",           symbol: "Ear/three steps", quality: "Movable",   guna: "Rajas",  nature: "Deva",    bodyPart: "Ears",               keywords: "Listening, learning, pilgrimage, connection, fame through knowledge, Vishnu",dosha:"Kapha",animalTotem:"Female Monkey",goal:"Artha",gender:"Male",shadowTheme: "Gossip, spreading what is heard carelessly, learning without wisdom",  spiritualLesson: "Vishnu's three steps traverse all worlds — true listening is not just with the ears but the soul" },
  "Dhanishtha":        { deity: "Ashta Vasus",      symbol: "Drum/flute",      quality: "Movable",   guna: "Tamas",  nature: "Rakshasa",bodyPart: "Back/anus",          keywords: "Wealth, music, emptiness, marital discord, speed, ambition, rhythm",    dosha: "Pitta", animalTotem: "Female Lion",  goal: "Dharma",  gender: "Female", shadowTheme: "Marital coldness, emptiness beneath material success, over-ambition", spiritualLesson: "The drum of the eight Vasus: abundance without rhythm creates noise — find the beat of dharma" },
  "Shatabhisha":       { deity: "Varuna",           symbol: "Empty circle",    quality: "Movable",   guna: "Tamas",  nature: "Rakshasa",bodyPart: "Lower jaw/right thigh",keywords:"Healing, secrecy, mysticism, solitude, cosmic law, 100 physicians",     dosha: "Vata",  animalTotem: "Female Horse", goal: "Dharma",  gender: "Neutral",shadowTheme: "Radical isolation, emotional withdrawal, healer who cannot heal himself",spiritualLesson: "Varuna's empty circle: the void contains all law — the healing of 100 is found in the one who witnesses" },
  "Purva Bhadrapada":  { deity: "Aja Ekapada",      symbol: "Front of funeral bed",quality:"Fierce", guna: "Tamas",  nature: "Manushya",bodyPart: "Sides/left thigh",   keywords: "Fierce transformation, two-faced, spirituality through suffering, fire serpent",dosha:"Vata",animalTotem:"Male Lion",  goal: "Artha",   gender: "Male",   shadowTheme: "Extremism in beliefs, self-flagellation disguised as spirituality",  spiritualLesson: "The one-footed goat crosses all three worlds — suffering is not the path, it is the fuel" },
  "Uttara Bhadrapada": { deity: "Ahir Budhnya",     symbol: "Back of funeral bed",quality:"Fixed",   guna: "Tamas",  nature: "Manushya",bodyPart: "Shins",              keywords: "Depth, moksha, serpent wisdom, rain, patience, hidden power, cosmic sleep",dosha:"Pitta",animalTotem:"Female Cow",  goal: "Kama",    gender: "Male",   shadowTheme: "Excessive withdrawal, hoarding wisdom, sleeping through life's dharmic calls",spiritualLesson: "Ahir Budhnya sleeps in the cosmic deep — but the serpent of depths knows: every depth must surface" },
  "Revati":            { deity: "Pushan",           symbol: "Fish/drum",       quality: "Soft",      guna: "Sattva", nature: "Deva",    bodyPart: "Feet/abdomen",       keywords: "Journey's end, nourishment, protection, cycles completing, the beyond",  dosha: "Kapha", animalTotem: "Female Elephant",goal: "Moksha",gender: "Female",shadowTheme: "Dwelling in endings, difficulty beginning new cycles, excessive compassion",spiritualLesson: "Pushan guides the departed — to complete a journey is not to end but to become the guide for others" },
};

const PADA_NAVAMSA: Record<number, string> = {
  1: "Aries navamsa (Dharma trikona resonance) — Martian initiative, independence, pioneering energy, self-assertion is activated",
  2: "Taurus navamsa (Artha trikona resonance) — Venusian stability, material focus, sensory pleasure, resource-building emphasized",
  3: "Gemini navamsa (Kama trikona resonance) — Mercurial intellect, duality expressed, communication and desire activated",
  4: "Cancer navamsa (Moksha trikona resonance) — Lunar emotional depth, home, nurturing; the pada on moksha axis gives spiritual sensitivity and inner world emphasis",
};

const EXALTATION: Partial<Record<PlanetKey, { rashi: number; deepDeg: number }>> = {
  su: { rashi: 0,  deepDeg: 10 },
  mo: { rashi: 1,  deepDeg: 3  },
  ma: { rashi: 9,  deepDeg: 28 },
  me: { rashi: 5,  deepDeg: 15 },
  ju: { rashi: 3,  deepDeg: 5  },
  ve: { rashi: 11, deepDeg: 27 },
  sa: { rashi: 6,  deepDeg: 20 },
  ra: { rashi: 1,  deepDeg: 20 },
  ke: { rashi: 7,  deepDeg: 20 },
};

const DEBILITATION: Partial<Record<PlanetKey, number>> = {
  su: 6, mo: 7, ma: 3, me: 11, ju: 9, ve: 5, sa: 0, ra: 7, ke: 1,
};

const MOOLATRIKONA: Partial<Record<PlanetKey, { rashi: number; degStart: number; degEnd: number }>> = {
  su: { rashi: 4,  degStart: 0,  degEnd: 20 },
  mo: { rashi: 1,  degStart: 4,  degEnd: 30 },
  ma: { rashi: 0,  degStart: 0,  degEnd: 12 },
  me: { rashi: 5,  degStart: 15, degEnd: 20 },
  ju: { rashi: 8,  degStart: 0,  degEnd: 10 },
  ve: { rashi: 6,  degStart: 0,  degEnd: 15 },
  sa: { rashi: 10, degStart: 0,  degEnd: 20 },
};

const OWN_SIGN: Record<PlanetKey, number[]> = {
  su: [4], mo: [3], ma: [0, 7], me: [2, 5], ju: [8, 11], ve: [1, 6], sa: [9, 10], ra: [], ke: [],
};

const DIG_BALA: Partial<Record<PlanetKey, number>> = {
  su: 10, ma: 10, ju: 1, me: 1, mo: 4, ve: 4, sa: 7,
};

function getDignity(key: PlanetKey, rashiIndex: number, degrees: number): string {
  const mt = MOOLATRIKONA[key];
  if (mt && mt.rashi === rashiIndex && degrees >= mt.degStart && degrees <= mt.degEnd) return "Moolatrikona";
  if (OWN_SIGN[key]?.includes(rashiIndex)) return "Own Sign";
  return "";
}

function getDeepExaltation(key: PlanetKey, rashiIndex: number, degrees: number): boolean {
  const ex = EXALTATION[key];
  if (!ex) return false;
  return ex.rashi === rashiIndex && Math.abs(degrees - ex.deepDeg) <= 1;
}

function getDigBala(key: PlanetKey, house: number): string {
  if (DIG_BALA[key] === house) return "Dig Bala (directional strength, maximum power in this house)";
  if (DIG_BALA[key] !== undefined && ((DIG_BALA[key]! + 5) % 12 + 1) === house) return "Dig Bala Weakness (opposite of strength house)";
  return "";
}

function getSandhiStatus(degrees: number): string {
  if (degrees <= 1) return "SANDHI — rashi junction entry (0-1 deg): planet is weakened, between worlds, karmic transition energy";
  if (degrees >= 29) return "SANDHI — rashi junction exit (29-30 deg): planet completing its dharma in this sign, release energy";
  return "";
}

function getGandantaStatus(key: PlanetKey, rashiIndex: number, degrees: number): string {
  const waterFireJunctions = [
    { water: 11, fire: 0 },
    { water: 3,  fire: 4 },
    { water: 7,  fire: 8 },
  ];
  for (const junc of waterFireJunctions) {
    if (rashiIndex === junc.water && degrees >= 28.5) return `GANDANTA — Final degrees of ${RASHIS[junc.water]}: profoundly karmic, dissolution before rebirth.`;
    if (rashiIndex === junc.fire && degrees <= 1.5) return `GANDANTA — Opening degrees of ${RASHIS[junc.fire]}: rebirth after dissolution. Early life challenges transmute into extraordinary strength by middle age.`;
  }
  return "";
}

function getDecanate(degrees: number, rashiName: string): string {
  const DECAN_LORDS: Record<string, [string, string, string]> = {
    "Aries":       ["Mars", "Sun", "Jupiter"],
    "Taurus":      ["Venus", "Mercury", "Saturn"],
    "Gemini":      ["Mercury", "Venus", "Uranus/Saturn"],
    "Cancer":      ["Moon", "Mars", "Jupiter"],
    "Leo":         ["Sun", "Jupiter", "Mars"],
    "Virgo":       ["Mercury", "Saturn", "Venus"],
    "Libra":       ["Venus", "Uranus/Saturn", "Mercury"],
    "Scorpio":     ["Mars/Pluto", "Jupiter", "Moon"],
    "Sagittarius": ["Jupiter", "Mars", "Sun"],
    "Capricorn":   ["Saturn", "Venus", "Mercury"],
    "Aquarius":    ["Uranus/Saturn", "Mercury", "Venus"],
    "Pisces":      ["Jupiter", "Moon", "Mars"],
  };
  const d = Math.floor(degrees / 10);
  const lords = DECAN_LORDS[rashiName];
  if (!lords) return "";
  const decanNames = ["1st decanate (0-10 deg)", "2nd decanate (10-20 deg)", "3rd decanate (20-30 deg)"];
  return `${decanNames[d]} — sub-ruled by ${lords[d]}`;
}

function getPlanetaryAspects(key: PlanetKey, fromHouse: number): number[] {
  const aspect = (offset: number) => ((fromHouse - 1 + offset) % 12) + 1;
  const aspects = [aspect(6)];
  if (key === "ma") aspects.push(aspect(3), aspect(7));
  if (key === "ju") aspects.push(aspect(4), aspect(8));
  if (key === "sa") aspects.push(aspect(2), aspect(9));
  if (key === "ra" || key === "ke") aspects.push(aspect(4), aspect(8));
  return aspects;
}

function getAspectQuality(aspectingKey: PlanetKey, aspectedKey: PlanetKey): string {
  const benefics: PlanetKey[] = ["ju", "ve", "mo", "me"];
  const malefics: PlanetKey[] = ["sa", "ma", "su", "ra", "ke"];
  if (benefics.includes(aspectingKey)) return "benefic aspect (blesses, expands, protects)";
  if (malefics.includes(aspectingKey)) return "malefic aspect (pressures, tests, restricts or intensifies)";
  return "neutral aspect";
}

const HOUSE_SIGNIFICATIONS: Record<number, string> = {
  1:  "Self, body, personality, vitality, fame, appearance, the head, overall life direction, Atma",
  2:  "Wealth, family lineage, speech, food, face, accumulated assets, right eye, early education, Kula",
  3:  "Courage (Parakrama), younger siblings, short travel, communication, skills, hands, ears, efforts, Sahaja",
  4:  "Mother, home, vehicles, core education, happiness, inner peace, land/real estate, heart, Bandhu",
  5:  "Intelligence (Buddhi), children, past-life merit (Purva Punya), speculation, creativity, mantras, romance, stomach, Putra",
  6:  "Enemies (Shatru), debts, disease, service, litigation, maternal uncle, daily work, digestive health, obstacles that must be overcome, Ari",
  7:  "Marriage, life partner, partnerships, business dealings, public dealings, foreign travel, desire (Kama), Yuvati",
  8:  "Longevity (Ayu), transformation, occult sciences, inheritance, in-laws, sudden events, research, death, genitals, Randhra",
  9:  "Dharma, father, guru, fortune (Bhagya), long-distance travel, higher wisdom, temples, divine grace, hips, Dharma",
  10: "Career (Karma), profession, authority, government, public status, knees, father (also), Rajya",
  11: "Gains (Labha), income, elder siblings, social networks, left ear, fulfillment of desires, Aya",
  12: "Moksha, losses, foreign lands, hospitals, hidden enemies, expenses, isolation, sleep, the left eye, Vyaya",
};

const NATURAL_BENEFIC: PlanetKey[] = ["ju", "ve", "mo", "me"];
const NATURAL_MALEFIC: PlanetKey[] = ["sa", "ma", "su", "ra", "ke"];
function isBenefic(key: PlanetKey) { return NATURAL_BENEFIC.includes(key); }

function getYogakaraka(lagnaRashiIndex: number): PlanetKey | null {
  const kendraLords = [1, 4, 7, 10].map(h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12]);
  const trikonaLords = [1, 5, 9].map(h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12]);
  for (const k of kendraLords) {
    if (trikonaLords.includes(k) && k !== kendraLords[0]) return k;
  }
  return null;
}

function getBadhaka(lagnaRashiIndex: number): { house: number; description: string } {
  const movable = [0, 3, 6, 9];
  const fixed = [1, 4, 7, 10];
  if (movable.includes(lagnaRashiIndex)) return { house: 11, description: "11th lord is Badhaka (obstruction lord) for this Chara lagna" };
  if (fixed.includes(lagnaRashiIndex)) return { house: 9, description: "9th lord is Badhaka for this Sthira lagna — tests dharma, father, and fortune" };
  return { house: 7, description: "7th lord is Badhaka for this Dwiswabhava lagna — partnerships can carry hidden obstacles" };
}

function getMarakas(lagnaRashiIndex: number): string {
  const maraka2 = RASHI_LORDS[(lagnaRashiIndex + 1) % 12];
  const maraka7 = RASHI_LORDS[(lagnaRashiIndex + 6) % 12];
  return `Primary Marakas: L2 (${PLANET_META[maraka2].name}) and L7 (${PLANET_META[maraka7].name}). These lords carry maraka energy — in their Mahadasha/Antardasha (especially when Saturn also participates), they can precipitate health crises or metaphorical deaths (endings of phases). Classical rule: marakas harm only when ayu (lifespan) is exhausted — until then, their periods may bring intense transformation.`;
}

function getBhavatBhavam(house: number): { bhavatBhavam: number; meaning: string } {
  const result = ((house - 1) * 2) % 12 + 1;
  const meanings: Record<number, string> = {
    1: "1st from 1st: reinforces the native's identity, constitution, and longevity",
    2: "2nd from 2nd: secondary wealth accumulation, deeper family karma",
    3: "3rd from 3rd: courage behind courage, very deep skill reservoir",
    4: "4th from 4th: home of the home — ancestral property, deep emotional roots",
    5: "5th from 5th: grandchildren, deep intelligence, ancient meritorious acts",
    6: "6th from 6th: enmity behind enmity, deeply entrenched diseases, karmic debts",
    7: "7th from 7th: partner of the partner, longevity of marriage itself",
    8: "8th from 8th: longevity behind longevity — deeply karmically protected life force",
    9: "9th from 9th: dharma of dharma — deepest spiritual purpose, grand-teacher",
    10: "10th from 10th: career achievement peak, legacy beyond this lifetime",
    11: "11th from 11th: gains of gains — compounding abundance",
    12: "12th from 12th: moksha of moksha — deepest liberation, spiritual dissolution",
  };
  return { bhavatBhavam: result, meaning: meanings[result] ?? "" };
}

function getCharaKarakas(planets: PlanetInfo[]): string[] {
  const eligible = planets.filter(p => !["ra", "ke"].includes(p.key));
  const sorted = [...eligible].sort((a, b) => b.position.degrees - a.position.degrees);
  const karakaNames = ["Atmakaraka (AK)", "Amatyakaraka (AmK)", "Bhratrikaraka (BK)", "Matrikaraka (MK)", "Pitrikaraka (PK)", "Putrakaraka (PuK)", "Gnatikaraka (GK)", "Darakaraka (DK)"];
  return sorted.map((p, i) => `${karakaNames[i] ?? `Karaka-${i+1}`}: ${p.name} at ${p.position.degrees.toFixed(2)}° in ${p.position.rashi}`);
}

function getConjunctions(planets: PlanetInfo[]): string[] {
  const conjunctions: string[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (planets[i].house === planets[j].house) {
        let diff = Math.abs(planets[i].position.totalDegrees - planets[j].position.totalDegrees);
        if (diff > 180) diff = 360 - diff;
        const orb = diff < 5 ? `TIGHT (${diff.toFixed(1)}°) — extremely potent fusion` : diff < 10 ? `close (${diff.toFixed(1)}°)` : `wide (${diff.toFixed(1)}°) — thematic blending only`;
        const nature = `${isBenefic(planets[i].key) && isBenefic(planets[j].key) ? "DOUBLE BENEFIC conjunction — highly auspicious" : !isBenefic(planets[i].key) && !isBenefic(planets[j].key) ? "DOUBLE MALEFIC conjunction — intense karmic pressure" : "Mixed conjunction — benefic-malefic tension, complex manifestation"}`;
        conjunctions.push(`${planets[i].name} + ${planets[j].name} in H${planets[i].house} (${planets[i].position.rashi}) — ${orb} | ${nature}`);
      }
    }
  }
  return conjunctions;
}

function getAspectAnalysis(planets: PlanetInfo[]): string[] {
  const lines: string[] = [];
  for (const p of planets) {
    const aspectedHouses = getPlanetaryAspects(p.key, p.house);
    for (const ah of aspectedHouses) {
      const planetsInAspectedHouse = planets.filter(x => x.house === ah && x.key !== p.key);
      const isSpecialAspect = (p.key === "ma" && [4, 8].includes(((ah - p.house + 12) % 12) + 1)) ||
                               (p.key === "ju" && [5, 9].includes(((ah - p.house + 12) % 12) + 1)) ||
                               (p.key === "sa" && [3, 10].includes(((ah - p.house + 12) % 12) + 1));
      const aspectTag = isSpecialAspect ? "[SPECIAL ASPECT]" : "[7th aspect]";
      if (planetsInAspectedHouse.length > 0) {
        lines.push(`${p.name} (H${p.house}) ${aspectTag} -> H${ah}: directly aspecting ${planetsInAspectedHouse.map(x => x.name).join(", ")} — ${getAspectQuality(p.key, planetsInAspectedHouse[0].key)}`);
      } else {
        lines.push(`${p.name} (H${p.house}) ${aspectTag} -> H${ah} — aspects the house itself (no planets there)`);
      }
    }
  }
  return lines;
}

function getHouseLordAnalysis(planets: PlanetInfo[], lagnaRashiIndex: number): string[] {
  const lines: string[] = [];
  for (let h = 1; h <= 12; h++) {
    const rashiOfHouse = (lagnaRashiIndex + h - 1) % 12;
    const lordKey = RASHI_LORDS[rashiOfHouse];
    const lordPlanet = planets.find(p => p.key === lordKey);
    if (!lordPlanet) continue;
    const lordHouse = lordPlanet.house;
    const dignity = getDignity(lordKey, lordPlanet.position.rashiIndex, lordPlanet.position.degrees);
    const digBala = getDigBala(lordKey, lordHouse);
    const deepEx = getDeepExaltation(lordKey, lordPlanet.position.rashiIndex, lordPlanet.position.degrees);
    const retro = lordPlanet.isRetrograde ? " [Retrograde — energy turned inward, past karma reprocessing, unusual results]" : "";
    const flags = [
      dignity,
      deepEx && "EXACT EXALTATION (Paramochcha) — maximum strength",
      lordPlanet.isExalted && !deepEx && "Exalted",
      lordPlanet.isDebilitated && "Debilitated — Neecha (consider neechabhanga conditions)",
      lordPlanet.isCombust && "Combust — Sun absorbs lord's significations",
      digBala,
    ].filter(Boolean).join(" | ");
    const aspectingPlanets = planets.filter(p => {
      if (p.key === lordKey) return false;
      return getPlanetaryAspects(p.key, p.house).includes(lordHouse);
    });
    const houseRelationship = getHouseRelationship(h, lordHouse);
    lines.push(`L${h} (${PLANET_META[lordKey].name}): H${lordHouse} | ${lordPlanet.position.rashi} ${lordPlanet.position.degrees.toFixed(1)}° | ${lordPlanet.position.nakshatra} P${lordPlanet.position.nakshatraPada}${retro}\n     -> ${flags || "Neutral placement"}\n     -> Lord-house relationship: ${houseRelationship}\n     -> ${aspectingPlanets.length ? `Aspected by: ${aspectingPlanets.map(x => x.name).join(", ")}` : "No aspects on this lord"}`);
  }
  return lines;
}

function getHouseRelationship(ownedHouse: number, occupiedHouse: number): string {
  const diff = ((occupiedHouse - ownedHouse + 12) % 12) + 1;
  const relationships: Record<number, string> = {
    1:  "in own house (strongest possible placement for house matters)",
    2:  "2nd from own house — wealth-building for own-house matters",
    3:  "3rd from own house — efforts and courage fuel the house's themes",
    4:  "4th from own house — emotional and inner-life connection",
    5:  "5th from own house (trikona from it) — auspicious, creates good fortune for house",
    6:  "6th from own house — lord in dusthana from its own house — challenges, health, conflict for house",
    7:  "7th from own house — lord in maraka position relative to own house",
    8:  "8th from own house — hidden, transformative, delays, obstructed house",
    9:  "9th from own house (trikona) — fortune and blessings flow to house matters",
    10: "10th from own house — action and career-energy amplifies house matters",
    11: "11th from own house — gains and fulfillment from house matters",
    12: "12th from own house — loss, dissolution, expenses drain house matters; spiritual dimension activated",
  };
  return relationships[diff] ?? "complex relationship";
}

function getNakshatraLordChain(planets: PlanetInfo[]): string[] {
  const NAKSHATRA_LORDS: PlanetKey[] = [
    "ke","ve","su","mo","ma","ra","ju","sa","me",
    "ke","ve","su","mo","ma","ra","ju","sa","me",
    "ke","ve","su","mo","ma","ra","ju","sa","me",
  ];
  const NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
  ];
  return planets.map(p => {
    const nkIdx = NAKSHATRAS.indexOf(p.position.nakshatra);
    const nkLordKey = nkIdx >= 0 ? NAKSHATRA_LORDS[nkIdx] : null;
    const nkLord = nkLordKey ? planets.find(x => x.key === nkLordKey) : null;
    const nkData = NAKSHATRA_DATA[p.position.nakshatra];
    const pada = p.position.nakshatraPada;
    const padaMeaning = PADA_NAVAMSA[pada] ?? "";
    const sandhi = getSandhiStatus(p.position.degrees);
    const gandanta = getGandantaStatus(p.key, p.position.rashiIndex, p.position.degrees);
    const decanate = getDecanate(p.position.degrees, p.position.rashi);
    const chain = nkLord
      ? `Nakshatra lord ${nkLord.name} sits in H${nkLord.house} (${nkLord.position.rashi}, ${nkLord.position.nakshatra}) — Chain: ${p.name} -> ${nkData?.deity ?? "?"} -> ${nkLord.name} in H${nkLord.house}`
      : `Nakshatra lord: ${nkLordKey ?? "?"} (position unknown)`;
    return [
      `${p.name} in ${p.position.nakshatra} P${pada}`,
      `  Deity: ${nkData?.deity ?? "?"} | Symbol: ${nkData?.symbol ?? "?"}`,
      `  Nature: ${nkData?.nature ?? "?"} | Guna: ${nkData?.guna ?? "?"} | Dosha: ${nkData?.dosha ?? "?"}`,
      `  Animal Totem: ${nkData?.animalTotem ?? "?"} | Goal (Purushartha): ${nkData?.goal ?? "?"}`,
      `  Keywords: ${nkData?.keywords ?? "?"}`,
      `  Shadow: ${nkData?.shadowTheme ?? "?"}`,
      `  Spiritual lesson: ${nkData?.spiritualLesson ?? "?"}`,
      `  Pada ${pada}: ${padaMeaning}`,
      `  Decanate: ${decanate}`,
      `  ${chain}`,
      sandhi ? `  WARNING: ${sandhi}` : "",
      gandanta ? `  WARNING: ${gandanta}` : "",
    ].filter(Boolean).join("\n");
  });
}

function getParivartanas(planets: PlanetInfo[], lagnaRashiIndex: number): string[] {
  const exchanges: string[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const pi = planets[i], pj = planets[j];
      const piOwns = OWN_SIGN[pi.key] ?? [];
      const pjOwns = OWN_SIGN[pj.key] ?? [];
      if (piOwns.includes(pj.position.rashiIndex) && pjOwns.includes(pi.position.rashiIndex)) {
        const trikonas = [1, 5, 9];
        const kendras = [1, 4, 7, 10];
        const dusthanas = [6, 8, 12];
        const hiH = pi.house, hjH = pj.house;
        let type = "Dainya Parivartana (one dusthana involved — weakening exchange)";
        if (trikonas.includes(hiH) && trikonas.includes(hjH)) type = "MAHA PARIVARTANA (both trikona lords) — extraordinary fortune, dharmic life purpose amplified";
        else if (kendras.includes(hiH) && kendras.includes(hjH)) type = "MAHA PARIVARTANA (both kendra lords) — powerful material achievement, destiny-altering";
        else if ((kendras.includes(hiH) && trikonas.includes(hjH)) || (trikonas.includes(hiH) && kendras.includes(hjH))) type = "MAHA PARIVARTANA (kendra-trikona exchange) — classical Rajayoga configuration";
        else if (dusthanas.includes(hiH) || dusthanas.includes(hjH)) type = "DAINYA PARIVARTANA — one or both planets in dusthana";
        exchanges.push(`PARIVARTANA YOGA: ${pi.name} (H${pi.house}) <-> ${pj.name} (H${pj.house})\n  Type: ${type}\n  Effect: H${pi.house} and H${pj.house} are energetically fused. During either planet's dasha, both house themes activate simultaneously.`);
      }
    }
  }
  return exchanges;
}

function getNeechabhanga(planets: PlanetInfo[], lagnaRashiIndex: number): string[] {
  const results: string[] = [];
  for (const p of planets) {
    if (!p.isDebilitated) continue;
    const debRashi = DEBILITATION[p.key];
    if (debRashi === undefined) continue;
    const debSignLord = RASHI_LORDS[debRashi];
    const debSignLordPlanet = planets.find(x => x.key === debSignLord);
    const exRashi = EXALTATION[p.key]?.rashi;
    const exSignLord = exRashi !== undefined ? RASHI_LORDS[exRashi] : null;
    const exSignLordPlanet = exSignLord ? planets.find(x => x.key === exSignLord) : null;
    const kendras = [1, 4, 7, 10];
    const conditions: string[] = [];
    if (debSignLordPlanet && kendras.includes(debSignLordPlanet.house)) conditions.push(`Lord of debilitation sign (${PLANET_META[debSignLord].name}) is in kendra (H${debSignLordPlanet.house})`);
    if (exSignLordPlanet && kendras.includes(exSignLordPlanet.house)) conditions.push(`Lord of exaltation sign (${PLANET_META[exSignLord!].name}) is in kendra (H${exSignLordPlanet.house})`);
    const aspectingPlanets = planets.filter(x => x.key !== p.key && getPlanetaryAspects(x.key, x.house).includes(p.house));
    if (aspectingPlanets.some(x => x.key === exSignLord)) conditions.push(`Aspected by exaltation lord ${PLANET_META[exSignLord!].name}`);
    if (aspectingPlanets.some(x => x.key === debSignLord)) conditions.push(`Aspected by debilitation-sign lord ${PLANET_META[debSignLord].name}`);
    if (conditions.length > 0) {
      results.push(`NEECHABHANGA RAJA YOGA — ${p.name} is debilitated BUT cancellation conditions present:\n  Conditions met: ${conditions.join("; ")}\n  Classical interpretation: The debilitation is cancelled; the planet gains unusual strength through struggle. The dasha of this planet, especially after age 35, can deliver remarkable outcomes.`);
    }
  }
  return results;
}

function getDashaDepth(chart: KundliChart, planets: PlanetInfo[], lagnaRashiIndex: number): string {
  const activeDasha = chart.dashas.find(d => d.isActive);
  const activeAntar = activeDasha?.antardasha?.find(a => a.isActive);
  if (!activeDasha) return "No active dasha found.";
  const dashaLord = planets.find(p => p.key === activeDasha.planet);
  const antarLord = activeAntar ? planets.find(p => p.key === activeAntar.planet) : null;
  const dashaLordAspects = dashaLord ? getPlanetaryAspects(dashaLord.key, dashaLord.house) : [];
  const antarLordAspects = antarLord ? getPlanetaryAspects(antarLord.key, antarLord.house) : [];
  const nkData = dashaLord ? NAKSHATRA_DATA[dashaLord.position.nakshatra] : null;
  const antarNkData = antarLord ? NAKSHATRA_DATA[antarLord.position.nakshatra] : null;
  const dashaLordRuledHouses = dashaLord ? [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12] === dashaLord.key) : [];
  const antarLordRuledHouses = antarLord ? [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12] === antarLord.key) : [];
  return `
MAHADASHA: ${activeDasha.planetName} (${new Date(activeDasha.startDate).getFullYear()}–${new Date(activeDasha.endDate).getFullYear()})
  -> Dasha lord sits in H${dashaLord?.house} (${dashaLord?.position.rashi} ${dashaLord?.position.degrees.toFixed(1)}°, ${dashaLord?.position.nakshatra} P${dashaLord?.position.nakshatraPada})
  -> Houses RULED by dasha lord: H${dashaLordRuledHouses.join(", H") || "none"} — these houses are ALL activated during this MD
  -> Nakshatra: ${dashaLord?.position.nakshatra} | Deity: ${nkData?.deity ?? "?"} | Keywords: ${nkData?.keywords ?? "?"}
  -> Nakshatra shadow theme: ${nkData?.shadowTheme ?? "?"}
  -> Dasha lord aspects: ${dashaLordAspects.map(h => `H${h}`).join(", ") || "7th only"}
  -> Dignity: ${[getDignity(activeDasha.planet as PlanetKey, dashaLord?.position.rashiIndex ?? 0, dashaLord?.position.degrees ?? 0), dashaLord?.isExalted && "Exalted", dashaLord?.isDebilitated && "Debilitated", dashaLord?.isRetrograde && "Retrograde"].filter(Boolean).join(", ") || "Neutral"}
  -> Natural nature: ${isBenefic(activeDasha.planet as PlanetKey) ? "Natural BENEFIC — period broadly supportive" : "Natural MALEFIC — period tests, refines, and strips what is false"}

ANTARDASHA: ${activeAntar ? PLANET_META[activeAntar.planet].name : "N/A"} (ends ${new Date(activeAntar?.endDate ?? Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })})
  -> Antardasha lord: H${antarLord?.house} (${antarLord?.position.rashi} ${antarLord?.position.degrees.toFixed(1)}°, ${antarLord?.position.nakshatra} P${antarLord?.position.nakshatraPada})
  -> Houses RULED by antardasha lord: H${antarLordRuledHouses.join(", H") || "none"}
  -> Nakshatra: ${antarLord?.position.nakshatra} | Keywords: ${antarNkData?.keywords ?? "?"}
  -> MD/AD lord relationship: H${dashaLord?.house} and H${antarLord?.house} — ${dashaLord?.house === antarLord?.house ? "CONJUNCT — extreme intensity" : `${Math.abs((dashaLord?.house ?? 1) - (antarLord?.house ?? 1))} houses apart`}
  -> Combined activation: MD activates H${dashaLordRuledHouses.join("/")} while AD activates H${antarLordRuledHouses.join("/")}

UPCOMING DASHAS (next 3):
${chart.dashas
  .filter(d => !d.isActive && new Date(d.startDate) > new Date())
  .slice(0, 3)
  .map(d => {
    const lord = planets.find(p => p.key === d.planet);
    const nk = lord ? NAKSHATRA_DATA[lord.position.nakshatra] : null;
    const ruledH = lord ? [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex + h - 1) % 12] === lord.key) : [];
    return `  -> ${d.planetName} MD (${new Date(d.startDate).getFullYear()}–${new Date(d.endDate).getFullYear()}) | H${lord?.house} ${lord?.position.rashi} ${lord?.position.nakshatra} | Rules H${ruledH.join("/")} | Theme: ${nk?.keywords ?? "?"}`;
  }).join("\n")}`.trim();
}

const TRANSIT_PLANETS: PlanetKey[] = ["sa", "ju", "ra", "ke", "ma"];

const TRANSIT_FROM_MOON: Record<PlanetKey, Record<number, string>> = {
  su: { 1:"unfavorable — health, vitality pressure", 2:"unfavorable — financial strain", 3:"favorable — courage, communication opens", 4:"unfavorable — domestic discord", 5:"unfavorable — creative blocks", 6:"favorable — victory over enemies", 7:"unfavorable — relationship friction", 8:"unfavorable — hidden fears surface", 9:"favorable — fortune, dharmic clarity", 10:"favorable — career peak", 11:"favorable — gains, income", 12:"unfavorable — expenses, isolation" },
  mo: { 1:"mixed — emotional heightening", 2:"favorable — financial flow, family warmth", 3:"favorable — courage, short journeys succeed", 4:"unfavorable — emotional turbulence", 5:"unfavorable — creative frustration", 6:"favorable — health improves", 7:"favorable — relationship harmony", 8:"unfavorable — fear, hidden obstacles", 9:"favorable — spiritual clarity", 10:"unfavorable — career pressures", 11:"favorable — gains, desires fulfilled", 12:"unfavorable — isolation, emotional drain" },
  ma: { 1:"unfavorable — accidents, aggression", 2:"unfavorable — financial disputes", 3:"favorable — energy, courage peaks", 4:"unfavorable — domestic conflicts", 5:"unfavorable — speculation losses", 6:"favorable — enemies defeated", 7:"unfavorable — marital tension", 8:"favorable — research energy", 9:"unfavorable — father issues", 10:"favorable — career drive, ambition succeeds", 11:"favorable — gains, income through effort", 12:"unfavorable — secret enemies, expenses" },
  me: { 1:"favorable — communication sharp", 2:"favorable — financial acumen", 3:"unfavorable — sibling friction", 4:"favorable — education, home comfort", 5:"favorable — creative intelligence", 6:"unfavorable — health issues through overwork", 7:"favorable — partnership communication", 8:"unfavorable — mental anxieties", 9:"favorable — higher learning", 10:"favorable — career communication", 11:"favorable — gains through intellect", 12:"unfavorable — mental isolation" },
  ju: { 1:"very favorable — health, wisdom, expansion", 2:"favorable — wealth increase, family harmony", 3:"unfavorable — sibling friction", 4:"favorable — home happiness", 5:"very favorable — children blessed, creative peak", 6:"unfavorable — health caution", 7:"very favorable — marriage prospects", 8:"unfavorable — longevity concerns", 9:"very favorable — dharmic peak, fortune", 10:"favorable — career expansion", 11:"very favorable — maximum gains, desires fulfilled", 12:"unfavorable — expenses, spiritual retreat" },
  ve: { 1:"favorable — beauty, relationships", 2:"very favorable — wealth, sensory pleasures", 3:"favorable — artistic communication", 4:"favorable — home beautification", 5:"favorable — romance, creativity", 6:"unfavorable — relationship service issues", 7:"very favorable — marriage, partnerships", 8:"favorable — hidden wealth surfaces", 9:"favorable — spiritual beauty", 10:"favorable — career through arts", 11:"very favorable — gains, social pleasures", 12:"favorable — spiritual retreat, foreign pleasures" },
  sa: { 1:"unfavorable — health pressure, restriction", 2:"unfavorable — financial constraints", 3:"favorable — hard work succeeds", 4:"unfavorable — home restrictions", 5:"unfavorable — creative blockage", 6:"very favorable — victory through discipline", 7:"unfavorable — relationship delays", 8:"unfavorable — longevity concerns", 9:"unfavorable — dharmic testing", 10:"favorable — career through sustained effort", 11:"favorable — gains through discipline", 12:"unfavorable — isolation, hidden losses" },
  ra: { 1:"intense — identity disruption", 2:"intense — unusual financial flows", 3:"positive — ambition, unconventional communication", 4:"disruptive — home instability", 5:"disruptive — past karma resurfaces", 6:"positive — obstacles cleared unconventionally", 7:"disruptive — unusual partnerships", 8:"very intense — hidden matters surface", 9:"disruptive — dharmic confusion", 10:"positive — unconventional career rise", 11:"positive — unusual gains", 12:"intense — foreign lands, isolation" },
  ke: { 1:"detaching — identity confusion, spiritual seeking", 2:"detaching — material detachment", 3:"disruptive — sibling separation", 4:"detaching — home dissatisfaction", 5:"disruptive — past-life karma surfaces", 6:"positive — diseases heal mysteriously", 7:"detaching — relationship dissatisfaction", 8:"very spiritual — occult awakening", 9:"detaching — dharmic questioning", 10:"disruptive — career dissatisfaction", 11:"mixed — spiritual gains", 12:"very favorable for moksha — isolation becomes peace" },
};

const ASHTAKAVARGA_BENEFIC_POSITIONS: Record<PlanetKey, Record<string, number[]>> = {
  su: { su:[1,2,4,7,8,9,10,11], mo:[3,6,10,11], ma:[1,2,4,7,8,9,10,11], me:[3,5,6,9,10,11,12], ju:[5,6,9,11], ve:[6,7,12], sa:[1,2,4,7,8,9,10,11], la:[3,4,6,10,11,12] },
  mo: { su:[3,6,7,8,10,11], mo:[1,3,6,7,10,11], ma:[2,3,5,6,9,10,11], me:[1,3,4,5,7,8,10,11], ju:[1,4,7,8,10,11,12], ve:[3,4,5,7,9,10,11], sa:[3,5,6,11], la:[3,6,10,11] },
  ma: { su:[3,5,6,10,11], mo:[3,6,11], ma:[1,2,4,7,8,10,11], me:[3,5,6,11], ju:[6,10,11,12], ve:[6,8,11,12], sa:[1,4,7,8,9,10,11], la:[1,3,6,10,11] },
  me: { su:[5,6,9,11,12], mo:[2,4,6,8,10,11], ma:[1,2,4,7,8,9,10,11], me:[1,3,5,6,9,10,11,12], ju:[6,8,11,12], ve:[1,2,3,4,5,8,9,11], sa:[1,2,4,7,8,9,10,11], la:[1,2,4,6,8,10,11] },
  ju: { su:[1,2,3,4,7,8,9,10,11], mo:[2,5,7,9,11], ma:[1,2,4,7,8,10,11], me:[1,2,4,5,6,9,10,11], ju:[1,2,3,4,7,8,10,11], ve:[2,5,6,9,10,11], sa:[3,5,6,12], la:[1,2,4,5,6,7,9,10,11] },
  ve: { su:[8,11,12], mo:[1,2,3,4,5,8,9,11,12], ma:[3,4,6,9,11,12], me:[3,5,6,9,11], ju:[5,8,9,10,11], ve:[1,2,3,4,5,8,9,10,11], sa:[3,4,5,8,9,10,11], la:[1,2,3,4,5,8,9,11] },
  sa: { su:[1,2,4,7,8,10,11], mo:[3,6,11], ma:[3,5,6,10,11,12], me:[6,8,9,10,11,12], ju:[5,6,11,12], ve:[6,11,12], sa:[3,5,6,11], la:[1,3,4,6,10,11] },
  ra: { su:[3,6,11], mo:[3,6,11], ma:[3,6,11], me:[3,6,11], ju:[3,6,11], ve:[3,6,11], sa:[3,6,11], la:[3,6,11] },
  ke: { su:[3,6,11], mo:[3,6,11], ma:[3,6,11], me:[3,6,11], ju:[3,6,11], ve:[3,6,11], sa:[3,6,11], la:[3,6,11] },
};

function computeAshtakavarga(natalPlanets: PlanetInfo[], lagnaRashiIndex: number): Record<number, { bindus: number; planetContributions: string[] }> {
  const result: Record<number, { bindus: number; planetContributions: string[] }> = {};
  for (let h = 1; h <= 12; h++) result[h] = { bindus: 0, planetContributions: [] };
  const referencePoints: { key: string; rashiIndex: number }[] = [
    ...natalPlanets.filter(p => ["su","mo","ma","me","ju","ve","sa"].includes(p.key)).map(p => ({ key: p.key, rashiIndex: p.position.rashiIndex })),
    { key: "la", rashiIndex: lagnaRashiIndex },
  ];
  for (const [planetKey, refTable] of Object.entries(ASHTAKAVARGA_BENEFIC_POSITIONS)) {
    for (const refPoint of referencePoints) {
      const beneficOffsets = refTable[refPoint.key] ?? [];
      for (const offset of beneficOffsets) {
        const targetRashiIndex = (refPoint.rashiIndex + offset - 1) % 12;
        const targetHouse = ((targetRashiIndex - lagnaRashiIndex + 12) % 12) + 1;
        result[targetHouse].bindus++;
        if (!result[targetHouse].planetContributions.includes(PLANET_META[planetKey as PlanetKey]?.name ?? planetKey)) {
          result[targetHouse].planetContributions.push(PLANET_META[planetKey as PlanetKey]?.name ?? planetKey);
        }
      }
    }
  }
  return result;
}

function interpretAshtakavargaBindus(house: number, bindus: number): string {
  if (bindus >= 7) return "EXCEPTIONAL strength (7-8 bindus) — transits here deliver outstanding results";
  if (bindus >= 5) return "Strong (5-6 bindus) — transits broadly supportive";
  if (bindus === 4) return "Neutral (4 bindus) — mixed results, effort required";
  if (bindus === 3) return "Weak (3 bindus) — transits here face friction";
  if (bindus <= 2) return "Very weak (0-2 bindus) — transits here are challenging";
  return "";
}

interface TransitPlanetInfo {
  key: PlanetKey;
  name: string;
  rashiIndex: number;
  rashi: string;
  degrees: number;
  nakshatra: string;
  nakshatraPada: number;
  isRetrograde: boolean;
}

function getTransitHouseFromMoon(transitRashiIndex: number, natalMoonRashiIndex: number): number {
  return ((transitRashiIndex - natalMoonRashiIndex + 12) % 12) + 1;
}

function getTransitHouseFromLagna(transitRashiIndex: number, lagnaRashiIndex: number): number {
  return ((transitRashiIndex - lagnaRashiIndex + 12) % 12) + 1;
}

function analyzeTransits(
  transitPlanets: TransitPlanetInfo[],
  natalPlanets: PlanetInfo[],
  lagnaRashiIndex: number,
  activeDashaKey: PlanetKey | null,
  activeAntarKey: PlanetKey | null,
  ashtakavarga: Record<number, { bindus: number; planetContributions: string[] }>
): string {
  const natalMoon = natalPlanets.find(p => p.key === "mo");
  const natalMoonRashi = natalMoon?.position.rashiIndex ?? lagnaRashiIndex;
  const lines: string[] = [];
  const juTransit = transitPlanets.find(p => p.key === "ju");
  const saTransit = transitPlanets.find(p => p.key === "sa");
  const raTransit = transitPlanets.find(p => p.key === "ra");
  const keTransit = transitPlanets.find(p => p.key === "ke");
  if (juTransit && saTransit) {
    const juHouseFromLagna = getTransitHouseFromLagna(juTransit.rashiIndex, lagnaRashiIndex);
    const saHouseFromLagna = getTransitHouseFromLagna(saTransit.rashiIndex, lagnaRashiIndex);
    const juHouseFromMoon = getTransitHouseFromMoon(juTransit.rashiIndex, natalMoonRashi);
    const saHouseFromMoon = getTransitHouseFromMoon(saTransit.rashiIndex, natalMoonRashi);
    if (juHouseFromLagna === saHouseFromLagna) lines.push(`DOUBLE TRANSIT (Jupiter + Saturn both in H${juHouseFromLagna} from Lagna): Maximum predictive trigger. Major life events related to H${juHouseFromLagna} are highly probable.`);
    if (juHouseFromMoon === saHouseFromMoon) lines.push(`DOUBLE TRANSIT FROM MOON (Jupiter + Saturn both in H${juHouseFromMoon} from natal Moon): Classical double transit confirmed.`);
  }
  if (raTransit && keTransit) {
    const raHouse = getTransitHouseFromLagna(raTransit.rashiIndex, lagnaRashiIndex);
    const keHouse = getTransitHouseFromLagna(keTransit.rashiIndex, lagnaRashiIndex);
    lines.push(`RAHU-KETU TRANSIT AXIS: Rahu in H${raHouse} (${raTransit.rashi}, ${raTransit.nakshatra}) — Ketu in H${keHouse} (${keTransit.rashi}, ${keTransit.nakshatra})`);
  }
  for (const tp of transitPlanets.filter(p => TRANSIT_PLANETS.includes(p.key))) {
    const houseFromLagna = getTransitHouseFromLagna(tp.rashiIndex, lagnaRashiIndex);
    const houseFromMoon = getTransitHouseFromMoon(tp.rashiIndex, natalMoonRashi);
    const gocharResult = TRANSIT_FROM_MOON[tp.key]?.[houseFromMoon] ?? "effect unknown";
    const avBindus = ashtakavarga[houseFromLagna];
    const avInterpretation = interpretAshtakavargaBindus(houseFromLagna, avBindus?.bindus ?? 4);
    const nkData = NAKSHATRA_DATA[tp.nakshatra];
    const retroTag = tp.isRetrograde ? " [RETROGRADE]" : "";
    const dashaLordNatal = activeDashaKey ? natalPlanets.find(p => p.key === activeDashaKey) : null;
    const antarLordNatal = activeAntarKey ? natalPlanets.find(p => p.key === activeAntarKey) : null;
    const transitOverDashaLord = activeDashaKey && tp.rashiIndex === dashaLordNatal?.position.rashiIndex;
    const transitOverAntarLord = activeAntarKey && tp.rashiIndex === antarLordNatal?.position.rashiIndex;
    const natalPlanetsInTransitHouse = natalPlanets.filter(p => p.house === houseFromLagna);
    lines.push(`
TRANSIT: ${tp.name}${retroTag}
  Position: ${tp.rashi} ${tp.degrees.toFixed(1)}° | ${tp.nakshatra} P${tp.nakshatraPada}
  Nakshatra deity: ${nkData?.deity ?? "?"} | Theme: ${nkData?.keywords ?? "?"}
  House from Lagna: H${houseFromLagna} | House from Moon: H${houseFromMoon}
  Classical Gochar (from natal Moon): ${gocharResult}
  Ashtakavarga: ${avBindus?.bindus ?? "?"} bindus — ${avInterpretation}
  ${natalPlanetsInTransitHouse.length ? `Transiting over natal: ${natalPlanetsInTransitHouse.map(p => `${p.name} (${p.position.nakshatra})`).join(", ")}` : "No natal planets in this house"}
  ${transitOverDashaLord ? `TRANSIT OVER NATAL DASHA LORD: most powerful timing trigger — dasha themes crystallizing now` : ""}
  ${transitOverAntarLord ? `TRANSIT OVER NATAL ANTARDASHA LORD: antardasha themes fully activated` : ""}`);
  }
  if (saTransit && natalMoon) {
    const saFromMoon = getTransitHouseFromMoon(saTransit.rashiIndex, natalMoonRashi);
    if ([12, 1, 2].includes(saFromMoon)) {
      const phase = saFromMoon === 12 ? "FIRST PHASE (rising)" : saFromMoon === 1 ? "PEAK PHASE (Saturn on natal Moon)" : "FINAL PHASE (setting)";
      lines.push(`\nSADE SATI ACTIVE — Saturn transiting H${saFromMoon} from natal Moon\n  Phase: ${phase}\n  7.5 years total. What is built during this period tends to last. What collapses needed to go.`);
    }
    if ([4, 7, 10].includes(saFromMoon)) lines.push(`\nKANTAKA SHANI (Saturn in H${saFromMoon} from Moon): Significant obstacles in H${saFromMoon} themes. Saturn demanding quality and commitment.`);
  }
  return lines.filter(Boolean).join("\n");
}

function getTransitOverSignificators(transitPlanets: TransitPlanetInfo[], natalPlanets: PlanetInfo[], lagnaRashiIndex: number, activeDashaKey: PlanetKey | null): string {
  const lines: string[] = [];
  const keySignificators: { key: PlanetKey; role: string }[] = [
    { key: "su", role: "authority, father, soul vitality" },
    { key: "mo", role: "mind, mother, emotional security" },
    { key: "ma", role: "energy, courage, siblings, property" },
    { key: "me", role: "intelligence, communication, commerce" },
    { key: "ju", role: "wisdom, children, fortune, dharma" },
    { key: "ve", role: "relationships, beauty, wealth, partnerships" },
    { key: "sa", role: "karma, discipline, longevity, service" },
  ];
  for (const sig of keySignificators) {
    const natalSig = natalPlanets.find(p => p.key === sig.key);
    if (!natalSig) continue;
    for (const tp of transitPlanets.filter(p => TRANSIT_PLANETS.includes(p.key))) {
      if (tp.rashiIndex === natalSig.position.rashiIndex) {
        const orb = Math.abs(tp.degrees - natalSig.position.degrees);
        const orbLabel = orb <= 3 ? `EXACT (${orb.toFixed(1)} deg)` : orb <= 8 ? `close (${orb.toFixed(1)} deg)` : `wide (${orb.toFixed(1)} deg)`;
        const isDashaLord = sig.key === activeDashaKey;
        lines.push(`${tp.name} transiting over natal ${natalSig.name} (${natalSig.position.rashi} ${natalSig.position.nakshatra}) — ${orbLabel}${isDashaLord ? " | THIS IS THE NATAL DASHA LORD — most important timing trigger" : ""}`);
        lines.push(`  -> Significations activated: ${sig.role}`);
        lines.push(`  -> Natal ${natalSig.name} in H${natalSig.house} — H${natalSig.house} themes directly triggered`);
      }
      const transitAspectedHouses = getPlanetaryAspects(tp.key, getTransitHouseFromLagna(tp.rashiIndex, lagnaRashiIndex));
      if (transitAspectedHouses.includes(natalSig.house) && tp.rashiIndex !== natalSig.position.rashiIndex) {
        lines.push(`${tp.name} casting aspect on natal ${natalSig.name} in H${natalSig.house} — ${sig.role} themes activated from a distance`);
      }
    }
  }
  return lines.length > 0 ? lines.join("\n") : "No major transit-over-significator activations currently";
}

// ─── VOICE PROMPT ─────────────────────────────────────────────────────────────

// ─── VOICE PROMPT ─────────────────────────────────────────────────────────────

export function buildVoicePrompt(): string {
  const todayStr = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  return `TODAY'S ACTUAL DATE IS: ${todayStr}. Use this as ground truth for all timing language — "currently," "this year," "recent months," "upcoming," etc. Never assume or guess the date from any other source.
You are one of the last great Jyotishis of the classical tradition — not a therapist, not a coach, not a wellness guide. You are an astrologer. A reader of charts. Your job is to look at a horoscope and tell the truth about what is written there, with the precision and confidence that comes from 40 years of watching how charts become lives.

You are not performing empathy. You are performing accuracy.

────────────────────────────────────────────
FUNDAMENTAL IDENTITY
────────────────────────────────────────────

You think like a Parashari master: every observation must trace a complete chain.
Planet → sign → lord of sign → nakshatra → nakshatra lord → pada → aspects → dasha timing.
You do not declare anything on one indicator alone. Three indicators confirm. Four make it axiomatic.

You are not a mirror for the person. You are a reader of their chart. These are different things.

A mirror says: "You seem to value independence."
A reader says: "Your lagna lord is in the 12th, which is why every time you reach peak social engagement something pulls you inward — not depression, just a constitutional need for solitude that reads as withdrawal to people around you."

That is the difference. Always be the reader.

────────────────────────────────────────────
VOICE AND TONE
────────────────────────────────────────────

Precise. Unhurried. Confident without arrogance. The tone of a scholar who has seen a thousand charts and still finds this one interesting.

You do not soften accurate things to make them comfortable. You do not dramatize uncomfortable things to seem profound. You state what the chart shows.

When something is hard — a difficult dasha, a debilitated planet, a challenging yoga — you name it directly and then explain what it actually means in a life. Not as catastrophe, not as a wound, but as a structural fact with specific implications.

When something is strong — a good placement, a rajayoga, a powerful dasha — you say so without the hedging that makes people distrust what you're telling them.

Your sentences are complete. Your observations land. You do not trail off into vagueness.

────────────────────────────────────────────
THE CORE DISCIPLINE: TRANSLATION
────────────────────────────────────────────

Astrological machinery operates entirely below the surface of your speech.

Internally you are working with: planetary dignity, nakshatra psychology, pada resonance, house lordship chains, dasha activation, aspects, conjunctions, parivartanas, neech.`; 
}

// ─── CHART CONTEXT ────────────────────────────────────────────────────────────

export function buildChartContext(details: BirthDetails, chart: KundliChart): string {
  const planets = chart.planets;
  const lagnaRashiIndex = chart.lagna.rashiIndex;
  const activeDasha = chart.dashas.find(d => d.isActive);
  const activeAntar = activeDasha?.antardasha?.find(a => a.isActive);

  const get = (k: PlanetKey) => planets.find(p => p.key === k)!;
  const mo = get("mo"), su = get("su"), ve = get("ve"), ma = get("ma");
  const ju = get("ju"), sa = get("sa"), me = get("me"), ra = get("ra"), ke = get("ke");

  const lagnaLordKey = RASHI_LORDS[lagnaRashiIndex];
  const lagnaLord = get(lagnaLordKey);
  const h5LordKey  = RASHI_LORDS[(lagnaRashiIndex + 4)  % 12];
  const h5Lord     = get(h5LordKey);
  const h7LordKey  = RASHI_LORDS[(lagnaRashiIndex + 6)  % 12];
  const h7Lord     = get(h7LordKey);
  const h9LordKey  = RASHI_LORDS[(lagnaRashiIndex + 8)  % 12];
  const h9Lord     = get(h9LordKey);
  const h10LordKey = RASHI_LORDS[(lagnaRashiIndex + 9)  % 12];
  const h10Lord    = get(h10LordKey);

  const nkLagna   = NAKSHATRA_DATA[chart.lagna.nakshatra];
  const nkMoon    = NAKSHATRA_DATA[mo.position.nakshatra];
  const nkSun     = NAKSHATRA_DATA[su.position.nakshatra];
  const nkVenus   = NAKSHATRA_DATA[ve.position.nakshatra];
  const nkMars    = NAKSHATRA_DATA[ma.position.nakshatra];
  const nkJupiter = NAKSHATRA_DATA[ju.position.nakshatra];
  const nkSaturn  = NAKSHATRA_DATA[sa.position.nakshatra];
  const nkRahu    = NAKSHATRA_DATA[ra.position.nakshatra];
  const nkKetu    = NAKSHATRA_DATA[ke.position.nakshatra];
  const nk7Lord   = NAKSHATRA_DATA[h7Lord?.position.nakshatra];

  const yogakaraka   = getYogakaraka(lagnaRashiIndex);
  const charaKarakas = getCharaKarakas(planets);
  const atmakaraka   = charaKarakas[0] ?? "";
  const darakaraka   = charaKarakas[7] ?? "";

  const NAKSHATRA_LORDS_LIST: PlanetKey[] = ["ke","ve","su","mo","ma","ra","ju","sa","me","ke","ve","su","mo","ma","ra","ju","sa","me","ke","ve","su","mo","ma","ra","ju","sa","me"];
  const NAKSHATRAS_LIST = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const nk7LordIdx = NAKSHATRAS_LIST.indexOf(h7Lord?.position.nakshatra ?? "");
  const nk7LordLordKey = nk7LordIdx >= 0 ? NAKSHATRA_LORDS_LIST[nk7LordIdx] : null;
  const nk7LordLord = nk7LordLordKey ? get(nk7LordLordKey) : null;
  const nk7LordLordNk = nk7LordLord ? NAKSHATRA_DATA[nk7LordLord.position.nakshatra] : null;

  const conjunctions: string[] = [];
  planets.forEach((p1, i) => planets.slice(i + 1).forEach(p2 => {
    if (p1.house === p2.house) conjunctions.push(`${p1.name} + ${p2.name} in house ${p1.house} (${p1.position.rashi}): permanently fused — ${NAKSHATRA_DATA[p1.position.nakshatra]?.keywords ?? "?"} meets ${NAKSHATRA_DATA[p2.position.nakshatra]?.keywords ?? "?"}`);
  }));

  const parivartanas: string[] = [];
  planets.forEach((p1, i) => planets.slice(i + 1).forEach(p2 => {
    if (OWN_SIGN[p1.key]?.includes(p2.position.rashiIndex) && OWN_SIGN[p2.key]?.includes(p1.position.rashiIndex)) {
      parivartanas.push(`${p1.name} (house ${p1.house}) and ${p2.name} (house ${p2.house}) are in each other's signs — these house domains are karmically fused; both activate simultaneously during either planet's period`);
    }
  }));

  const aspectsOn7  = planets.filter(p => p.key !== h7LordKey  && getPlanetaryAspects(p.key, p.house).includes(7));
  const aspectsOn10 = planets.filter(p => p.key !== h10LordKey && getPlanetaryAspects(p.key, p.house).includes(10));
  const aspectsOn1  = planets.filter(p => p.key !== lagnaLordKey && getPlanetaryAspects(p.key, p.house).includes(1));
  const h7fromMoon  = ((mo.house - 1 + 6) % 12) + 1;
  const planetsIn7fromMoon = planets.filter(p => p.house === h7fromMoon);
  const planetsIn7 = planets.filter(p => p.house === 7);

  const dashaLord = activeDasha ? get(activeDasha.planet as PlanetKey) : null;
  const antarLord = activeAntar ? get(activeAntar.planet as PlanetKey) : null;
  const dashaRuledHouses = dashaLord ? [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex+h-1)%12] === dashaLord.key) : [];
  const antarRuledHouses = antarLord ? [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex+h-1)%12] === antarLord.key) : [];
  const nkDasha = dashaLord ? NAKSHATRA_DATA[dashaLord.position.nakshatra] : null;
  const nkAntar = antarLord ? NAKSHATRA_DATA[antarLord.position.nakshatra] : null;

  const cond = (p: PlanetInfo | undefined | null) => [
    p?.isRetrograde && !["ra","ke"].includes(p.key) && "RETROGRADE (internalized, past-life weight, non-conventional expression)",
    p?.isDebilitated && "DEBILITATED (primary karmic challenge — struggle IS the curriculum; genuine strength emerges through difficulty, often after 35)",
    p?.isExalted && "EXALTED (genuine strength, natural authority and flow in this domain)",
    p?.isCombust && "COMBUST (absorbed into solar ego themes — visibility, authority, father mediate this planet's expression)",
    p && getDignity(p.key, p.position.rashiIndex, p.position.degrees) && getDignity(p.key, p.position.rashiIndex, p.position.degrees),
  ].filter(Boolean).join("; ") || "neutral";

  const upcomingDashas = chart.dashas
    .filter(d => !d.isActive && new Date(d.startDate) > new Date())
    .slice(0, 3)
    .map(d => {
      const lord = get(d.planet as PlanetKey);
      const ruledH = [1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex+h-1)%12] === d.planet);
      const nk = NAKSHATRA_DATA[lord?.position.nakshatra];
      return `${d.planetName} (${new Date(d.startDate).getFullYear()}–${new Date(d.endDate).getFullYear()}): sits in house ${lord?.house} (${lord?.position.rashi}), rules houses ${ruledH.join("/")}, nakshatra keywords: ${nk?.keywords ?? "?"}, shadow: ${nk?.shadowTheme ?? "?"}`;
    });

  return `=== YOUR PRIVATE CHART NOTES — ${(details.name || "NATIVE").toUpperCase()} ===
Born: ${details.dob} at ${details.tob} | ${details.pob}
Translate everything below into human experience before speaking. Never quote these notes directly.

--- IDENTITY AND CORE SELF ---
Lagna: ${chart.lagna.rashi} ${chart.lagna.degrees.toFixed(1)}° | ${chart.lagna.nakshatra} Pada ${chart.lagna.nakshatraPada}
Core identity signature: ${nkLagna?.keywords ?? "?"}
The shadow this rising sign fights against: ${nkLagna?.shadowTheme ?? "?"}
The deepest lesson running through the whole life: ${nkLagna?.spiritualLesson ?? "?"}
Lagna lord (${PLANET_META[lagnaLordKey].name}): house ${lagnaLord?.house} (${lagnaLord?.position.rashi}, ${lagnaLord?.position.nakshatra} Pada ${lagnaLord?.position.nakshatraPada})
Lagna lord condition: ${cond(lagnaLord)}
Planets aspecting lagna: ${aspectsOn1.map(p => `${p.name} from house ${p.house} — ${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"}`).join("; ") || "none"}
${yogakaraka ? `Yogakaraka: ${PLANET_META[yogakaraka].name} — exceptional power; periods deliver above expectations` : ""}
Soul purpose (Atmakaraka): ${atmakaraka}

--- EMOTIONAL WORLD AND INNER LIFE ---
Moon: ${mo.position.rashi} ${mo.position.degrees.toFixed(1)}° | house ${mo.house} | ${mo.position.nakshatra} Pada ${mo.position.nakshatraPada}
Emotional signature: ${nkMoon?.keywords ?? "?"}
The emotional shadow: ${nkMoon?.shadowTheme ?? "?"}
Emotional lesson: ${nkMoon?.spiritualLesson ?? "?"}
Moon condition: ${cond(mo)}
Planets conjunct Moon: ${planets.filter(p => p.house === mo.house && p.key !== "mo").map(p => `${p.name} (${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"})`).join(", ") || "none"}
Planets aspecting Moon: ${planets.filter(p => p.key !== "mo" && getPlanetaryAspects(p.key, p.house).includes(mo.house)).map(p => `${p.name} from house ${p.house}`).join(", ") || "none"}

--- RELATIONSHIPS, SPOUSE, AND PARTNERSHIP (MOST DETAILED SECTION) ---
7th house sign: ${RASHIS[(lagnaRashiIndex + 6) % 12]}
Significance: This sign's energy is the FIRST IMPRESSION of the partner — their outer presentation, the quality they lead with.

LAYER 1 — 7th LORD (${PLANET_META[h7LordKey].name}): house ${h7Lord?.house} (${h7Lord?.position.rashi})
7th lord nakshatra: ${h7Lord?.position.nakshatra} Pada ${h7Lord?.position.nakshatraPada}
THIS IS THE SPOUSE'S CORE PERSONALITY:
  Deity: ${nk7Lord?.deity ?? "?"} | Symbol: ${nk7Lord?.symbol ?? "?"}
  Keywords (their essence): ${nk7Lord?.keywords ?? "?"}
  Their primary shadow (what they struggle with most): ${nk7Lord?.shadowTheme ?? "?"}
  Their spiritual lesson (what this person is here to learn): ${nk7Lord?.spiritualLesson ?? "?"}
  Their goal archetype: ${nk7Lord?.goal ?? "?"} | Their nature: ${nk7Lord?.nature ?? "?"}
  Guna: ${nk7Lord?.guna ?? "?"} | Dosha: ${nk7Lord?.dosha ?? "?"}
7th lord condition: ${cond(h7Lord)}

LAYER 2 — NAKSHATRA LORD OF 7TH LORD (second-level spouse indicator):
${nk7LordLord ? `${PLANET_META[nk7LordLordKey!].name} in house ${nk7LordLord.house} (${nk7LordLord.position.rashi}, ${nk7LordLord.position.nakshatra})` : "unknown"}
${nk7LordLordNk ? `This layer's keywords: ${nk7LordLordNk.keywords}` : ""}
${nk7LordLordNk ? `This layer's shadow: ${nk7LordLordNk.shadowTheme}` : ""}
Professional/situational coloring from this layer: house ${nk7LordLord?.house} themes shape where the spouse lives their life

LAYER 3 — PLANETS IN THE 7TH HOUSE (these energies ARE part of the spouse's personality):
${planetsIn7.length ? planetsIn7.map(p => `${p.name} in house 7 (${p.position.rashi}, ${p.position.nakshatra}):
  This planet's energy is permanently fused into the spouse's personality as experienced
  Keywords: ${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"}
  Shadow this brings into the relationship: ${NAKSHATRA_DATA[p.position.nakshatra]?.shadowTheme ?? "?"}
  Condition: ${cond(p)}`).join("\n") : "No planets in 7th house — spouse personality expressed through 7th lord alone"}

LAYER 4 — PLANETS ASPECTING 7TH HOUSE (shaping the relationship dynamic from outside):
${aspectsOn7.length ? aspectsOn7.map(p => `${p.name} from house ${p.house} aspects the 7th:
  ${p.isRetrograde && !["ra","ke"].includes(p.key) ? "RETROGRADE — past-life influence on relationship patterns" : ""}
  Keywords this planet brings to relationship: ${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"}
  Shadow this creates in relationship: ${NAKSHATRA_DATA[p.position.nakshatra]?.shadowTheme ?? "?"}
  This aspect creates: ${isBenefic(p.key) ? "grace and expansion in relationship" : "testing, pressure, or transformation in relationship"}`).join("\n") : "No planets aspecting 7th house — relationship domain is relatively unaspected"}

LAYER 5 — DARAKARAKA (soul-level partner archetype, Jaimini):
${darakaraka}
The darakaraka planet and its nakshatra reveal the SOUL'S PARTNER ARCHETYPE — who this person's soul came here to meet, what that meeting is karmically for.

LAYER 6 — VENUS (how this person experiences love, beauty, and attraction):
Venus: house ${ve.house} (${ve.position.rashi}, ${ve.position.nakshatra} Pada ${ve.position.nakshatraPada})
Venus keywords: ${nkVenus?.keywords ?? "?"}
Venus shadow: ${nkVenus?.shadowTheme ?? "?"}
Venus lesson: ${nkVenus?.spiritualLesson ?? "?"}
Venus condition: ${cond(ve)}
What Venus here means about attraction pattern: Venus in house ${ve.house} means love and beauty enter through the themes of this house

LAYER 7 — 7TH FROM MOON (emotional experience of the partner):
7th from Moon = house ${h7fromMoon}
Planets in house ${h7fromMoon}: ${planetsIn7fromMoon.map(p => `${p.name} (${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"})`).join(", ") || "none"}
This tells you how the PARTNER MAKES THIS PERSON FEEL at the emotional level

SYNTHESIS FOR SPOUSE/PARTNER READINGS:
Do not hedge. Do not say "I cannot see another person." Use EVERY layer above.
Draw one specific observation from each layer.
Each fact about the spouse must come from a different layer — that is what makes 10 facts feel like 10 revelations.
Translate nakshatra keywords directly into behavioral and personality traits.
Name the shadow without dramatizing it. Name the gift without flattering it.

--- CAREER, PURPOSE, AND PUBLIC LIFE ---
10th house sign: ${RASHIS[(lagnaRashiIndex + 9) % 12]}
10th lord (${PLANET_META[h10LordKey].name}): house ${h10Lord?.house} (${h10Lord?.position.rashi}, ${h10Lord?.position.nakshatra})
10th lord condition: ${cond(h10Lord)}
Planets aspecting 10th: ${aspectsOn10.map(p => `${p.name} from house ${p.house}`).join(", ") || "none"}
Planets in 10th: ${planets.filter(p => p.house === 10).map(p => p.name).join(", ") || "none"}
5th lord (${PLANET_META[h5LordKey].name}): house ${h5Lord?.house} (${h5Lord?.position.rashi}) — condition: ${cond(h5Lord)}
9th lord (${PLANET_META[h9LordKey].name}): house ${h9Lord?.house} (${h9Lord?.position.rashi}, ${h9Lord?.position.nakshatra}) — condition: ${cond(h9Lord)}

--- SUN ---
Sun: house ${su.house} (${su.position.rashi}, ${su.position.nakshatra} Pada ${su.position.nakshatraPada})
Sun keywords: ${nkSun?.keywords ?? "?"} | Shadow: ${nkSun?.shadowTheme ?? "?"}
Sun condition: ${cond(su)}

--- SATURN ---
Saturn: house ${sa.house} (${sa.position.rashi}, ${sa.position.nakshatra} Pada ${sa.position.nakshatraPada})
Saturn keywords: ${nkSaturn?.keywords ?? "?"} | Shadow: ${nkSaturn?.shadowTheme ?? "?"} | Lesson: ${nkSaturn?.spiritualLesson ?? "?"}
Saturn condition: ${cond(sa)}
Houses Saturn rules for this lagna: ${[1,2,3,4,5,6,7,8,9,10,11,12].filter(h => RASHI_LORDS[(lagnaRashiIndex+h-1)%12] === "sa").join(", ") || "none"}
Houses Saturn aspects: ${getPlanetaryAspects("sa", sa.house).map(h => `house ${h}`).join(", ")}

--- MARS ---
Mars: house ${ma.house} (${ma.position.rashi}, ${ma.position.nakshatra} Pada ${ma.position.nakshatraPada})
Mars keywords: ${nkMars?.keywords ?? "?"} | Shadow: ${nkMars?.shadowTheme ?? "?"}
Mars condition: ${cond(ma)}
Houses Mars aspects: ${getPlanetaryAspects("ma", ma.house).map(h => `house ${h}`).join(", ")}

--- JUPITER ---
Jupiter: house ${ju.house} (${ju.position.rashi}, ${ju.position.nakshatra} Pada ${ju.position.nakshatraPada})
Jupiter keywords: ${nkJupiter?.keywords ?? "?"} | Shadow: ${nkJupiter?.shadowTheme ?? "?"}
Jupiter condition: ${cond(ju)}
Houses Jupiter aspects: ${getPlanetaryAspects("ju", ju.house).map(h => `house ${h}`).join(", ")}

--- RAHU-KETU AXIS ---
Rahu: house ${ra.house} (${ra.position.rashi}, ${ra.position.nakshatra})
Rahu keywords: ${nkRahu?.keywords ?? "?"} | Shadow: ${nkRahu?.shadowTheme ?? "?"}
Ketu: house ${ke.house} (${ke.position.rashi}, ${ke.position.nakshatra})
Ketu keywords: ${nkKetu?.keywords ?? "?"} | Shadow: ${nkKetu?.shadowTheme ?? "?"}
Nodal tension: pulled toward house ${ra.house}, asked to release house ${ke.house}

--- CONJUNCTIONS ---
${conjunctions.length ? conjunctions.join("\n") : "No conjunctions — planets in separate houses"}

--- PARIVARTANAS ---
${parivartanas.length ? parivartanas.join("\n") : "No parivartanas"}

--- CHALLENGING PLACEMENTS ---
${planets.filter(p => p.isDebilitated).map(p => `${p.name} debilitated in house ${p.house} (${p.position.rashi}, ${p.position.nakshatra}): primary karmic challenge here. Keywords: ${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? "?"}. Shadow: ${NAKSHATRA_DATA[p.position.nakshatra]?.shadowTheme ?? "?"}.`).join("\n") || "None debilitated"}
${planets.filter(p => p.isCombust).map(p => `${p.name} combust in house ${p.house}: absorbed into solar ego themes`).join("\n") || ""}
${planets.filter(p => p.isRetrograde && !["ra","ke"].includes(p.key)).map(p => `${p.name} retrograde in house ${p.house}: internalized, past-life patterns, non-conventional results`).join("\n") || ""}

--- STRONG PLACEMENTS ---
${planets.filter(p => p.isExalted).map(p => `${p.name} exalted in house ${p.house}: genuine strength. ${NAKSHATRA_DATA[p.position.nakshatra]?.keywords ?? ""}`).join("\n") || "None exalted"}
${planets.filter(p => getDignity(p.key, p.position.rashiIndex, p.position.degrees)).map(p => `${p.name} in ${getDignity(p.key, p.position.rashiIndex, p.position.degrees)} in house ${p.house}`).join("\n") || ""}

--- CLASSICAL YOGAS ---
${chart.yogas.map(y => `${y.name} (${y.strength}): ${y.description}`).join("\n") || "No classical yogas detected"}

--- CURRENT TIMING ---
Mahadasha: ${activeDasha?.planetName ?? "unknown"} (${activeDasha ? new Date(activeDasha.startDate).getFullYear() : "?"}–${activeDasha ? new Date(activeDasha.endDate).getFullYear() : "?"})
Dasha lord: house ${dashaLord?.house} (${dashaLord?.position.rashi}, ${dashaLord?.position.nakshatra} Pada ${dashaLord?.position.nakshatraPada})
Dasha lord condition: ${cond(dashaLord)}
Houses ruled by dasha lord: ${dashaRuledHouses.join(", ")}
Dasha keywords: ${nkDasha?.keywords ?? "?"} | Shadow: ${nkDasha?.shadowTheme ?? "?"} | Lesson: ${nkDasha?.spiritualLesson ?? "?"}
Natural nature: ${["su","ma","sa","ra","ke"].includes(activeDasha?.planet ?? "") ? "MALEFIC — period tests, strips false structures" : "BENEFIC — period broadly supports growth"}

Antardasha: ${activeAntar ? PLANET_META[activeAntar.planet].name : "unknown"} until ${new Date(activeAntar?.endDate ?? Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
Antardasha lord: house ${antarLord?.house} (${antarLord?.position.rashi}, ${antarLord?.position.nakshatra})
Antardasha lord condition: ${cond(antarLord)}
Houses ruled by antardasha lord: ${antarRuledHouses.join(", ")}
Antardasha keywords: ${nkAntar?.keywords ?? "?"} | Shadow: ${nkAntar?.shadowTheme ?? "?"}
Current activation: houses ${[...new Set([...dashaRuledHouses, ...antarRuledHouses])].join(", ")}

--- UPCOMING PERIODS ---
${upcomingDashas.join("\n") || "None in near future"}

=== END PRIVATE NOTES ===
Everything above must be translated into human experience before speaking. The person only experiences the warmth, depth, and precision of what you say from having studied all of this.`;
}

// ─── Main system prompt builder ───────────────────────────────────────────────

export function buildSystemPrompt(
  details: BirthDetails,
  chart: KundliChart,
  transitChart?: { planets: TransitPlanetInfo[]; date: string }
): string {
  const planets = chart.planets;
  const lagnaRashiIndex = chart.lagna.rashiIndex;
  const yogakaraka = getYogakaraka(lagnaRashiIndex);
  const badhaka = getBadhaka(lagnaRashiIndex);
  const marakas = getMarakas(lagnaRashiIndex);
  const conjunctions = getConjunctions(planets);
  const aspects = getAspectAnalysis(planets);
  const lordChain = getHouseLordAnalysis(planets, lagnaRashiIndex);
  const nakshatraChain = getNakshatraLordChain(planets);
  const parivartanas = getParivartanas(planets, lagnaRashiIndex);
  const neechabhanga = getNeechabhanga(planets, lagnaRashiIndex);
  const charaKarakas = getCharaKarakas(planets);
  const dashaDepth = getDashaDepth(chart, planets, lagnaRashiIndex);

  const activeDasha = chart.dashas.find(d => d.isActive);
  const activeAntar = activeDasha?.antardasha?.find(a => a.isActive);
  const yogaList = chart.yogas.map(y => `${y.name} (Strength: ${y.strength}) — ${y.description}`).join("\n    ") || "None detected by standard algorithms";

  const ashtakavarga = computeAshtakavarga(planets, lagnaRashiIndex);
  const transitAnalysis = transitChart
    ? analyzeTransits(transitChart.planets, planets, lagnaRashiIndex,
        (activeDasha?.planet ?? null) as PlanetKey | null,
        (activeAntar?.planet ?? null) as PlanetKey | null,
        ashtakavarga)
    : null;
  const transitSignificators = transitChart
    ? getTransitOverSignificators(transitChart.planets, planets, lagnaRashiIndex,
        (activeDasha?.planet ?? null) as PlanetKey | null)
    : null;
  const avSummary = Object.entries(ashtakavarga)
    .map(([h, data]) => `  H${h}: ${data.bindus} bindus — ${interpretAshtakavargaBindus(parseInt(h), data.bindus)}`)
    .join("\n");

  const planetList = planets.map(p => {
    const dignity = getDignity(p.key, p.position.rashiIndex, p.position.degrees);
    const digBala = getDigBala(p.key, p.house);
    const deepEx = getDeepExaltation(p.key, p.position.rashiIndex, p.position.degrees);
    const sandhi = getSandhiStatus(p.position.degrees);
    const gandanta = getGandantaStatus(p.key, p.position.rashiIndex, p.position.degrees);
    const decanate = getDecanate(p.position.degrees, p.position.rashi);
    const flags = [
      dignity,
      deepEx && "EXACT EXALTATION (Paramochcha)",
      p.isExalted && !deepEx && "Exalted",
      p.isDebilitated && "Debilitated (Neecha)",
      p.isRetrograde && "Retrograde (Vakri)",
      p.isCombust && "Combust (Moudyami)",
      digBala,
    ].filter(Boolean).join(" | ");
    return [
      `  ${p.symbol} ${p.name}: ${p.position.rashi} ${p.position.degrees.toFixed(2)}° | H${p.house} | ${p.position.nakshatra} P${p.position.nakshatraPada}`,
      `     ${decanate}`,
      flags ? `     -> ${flags}` : "",
      sandhi ? `     WARNING: ${sandhi}` : "",
      gandanta ? `     WARNING: ${gandanta}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return `You are JYOTISH DARSHAN — not merely an astrologer, but a living repository of 40 years of immersion in the classical texts: BPHS, Jataka Parijata, Phaladeepika, Brihat Jataka, Saravali, Uttara Kalamrita, Hora Ratna, and the Jaimini Sutras. You do not perform readings — you hold sacred council. You read a chart the way a Sanskrit scholar reads an Upanishad: every syllable (degree, nakshatra, pada, aspect, lord placement) is a living transmission. You do not guess. You TRACE.

Your fundamental methodology is the Parashari multi-layer chain:
Planet -> Sign -> Lord of sign (where is it? what does it rule?) -> Nakshatra (which deity speaks?) -> Nakshatra lord (where seated?) -> Pada (which navamsa resonance?) -> Aspects upon it -> Dasha activation -> Confluence of 3+ factors before declaring anything.

CHART OF ${(details.name || "THE NATIVE").toUpperCase()}
Born: ${details.dob} at ${details.tob} | ${details.pob}

LAGNA (ASCENDANT):
  ${chart.lagna.rashi} ${chart.lagna.degrees.toFixed(2)}° | ${chart.lagna.nakshatra} Pada ${chart.lagna.nakshatraPada}
  Nakshatra deity: ${NAKSHATRA_DATA[chart.lagna.nakshatra]?.deity ?? "?"}
  Nakshatra keywords: ${NAKSHATRA_DATA[chart.lagna.nakshatra]?.keywords ?? "?"}
  Spiritual lesson: ${NAKSHATRA_DATA[chart.lagna.nakshatra]?.spiritualLesson ?? "?"}
  Pada resonance: ${PADA_NAVAMSA[chart.lagna.nakshatraPada] ?? ""}
  Lagna lord: ${PLANET_META[RASHI_LORDS[lagnaRashiIndex]].name}
  ${yogakaraka ? `Yogakaraka: ${PLANET_META[yogakaraka].name} — Rajayoga by ruling both kendra AND trikona` : "No single yogakaraka"}
  Badhaka: H${badhaka.house} — ${badhaka.description}
  ${marakas}

CHARA KARAKAS (JAIMINI):
${charaKarakas.map(c => `  ${c}`).join("\n")}

PLANETARY POSITIONS:
${planetList}

NAKSHATRA DEEP ANALYSIS:
${nakshatraChain.map(n => `  ──────────────────\n${n.split("\n").map(l => `  ${l}`).join("\n")}`).join("\n")}

HOUSE LORD PLACEMENTS:
${lordChain.map(l => `  ${l}`).join("\n\n")}

ASPECTS:
${aspects.slice(0, 30).map(a => `  - ${a}`).join("\n")}

CONJUNCTIONS:
${conjunctions.length ? conjunctions.map(c => `  - ${c}`).join("\n") : "  No conjunctions"}

${parivartanas.length ? `PARIVARTANA YOGAS:\n${parivartanas.map(p => `  ${p}`).join("\n\n")}\n` : ""}
${neechabhanga.length ? `NEECHABHANGA RAJA YOGAS:\n${neechabhanga.map(n => `  ${n}`).join("\n\n")}\n` : ""}

ACTIVE YOGAS:
    ${yogaList}

DASHA SYSTEM — VIMSHOTTARI:
${dashaDepth}

${transitChart ? `
ASHTAKAVARGA:
${avSummary}` : ""}

${transitChart ? `
CURRENT TRANSITS (as of ${transitChart.date}):
${transitAnalysis}

TRANSITS OVER SIGNIFICATORS:
${transitSignificators}` : "No transit chart provided"}

COMPLETE HOUSE ANALYSIS:
${Object.entries(HOUSE_SIGNIFICATIONS).map(([h, sig]) => {
  const hNum = parseInt(h);
  const rashiOfHouse = (lagnaRashiIndex + hNum - 1) % 12;
  const lordKey = RASHI_LORDS[rashiOfHouse];
  const lord = planets.find(p => p.key === lordKey);
  const planetsInHouse = planets.filter(p => p.house === hNum);
  const bb = getBhavatBhavam(hNum);
  return `  H${h} (${RASHIS[rashiOfHouse]}, lord: ${PLANET_META[lordKey].name} in H${lord?.house ?? "?"}) — ${sig}\n     Bhavat Bhavam: H${bb.bhavatBhavam} — ${bb.meaning}\n     ${planetsInHouse.length ? `Occupied by: ${planetsInHouse.map(p => `${p.name} (${p.position.nakshatra} P${p.position.nakshatraPada})`).join(", ")}` : "Empty — rely on lord and aspects"}`;
}).join("\n\n")}

CORE READING PHILOSOPHY:

A placement reveals an ARCHETYPAL THEME and a RANGE of manifestations.
Map that range honestly. Do not select the most dramatic reading as fact.

CONFLUENCE PROTOCOL:
  1 indicator -> possible
  2 indicators -> notable tendency
  3 indicators -> strongly indicated (name all three)
  4+ indicators -> multiple independent factors converge

WHAT NEVER APPEARS IN RESPONSES:
  Planet names as subjects ("Jupiter in H9 indicates...")
  House numbers spoken aloud
  Nakshatra names in technical framing
  Astrological jargon without translation
  Specific year event predictions
  Declared trauma as biographical fact
  The words: Saturn, Moon, Jupiter, Rahu, Ketu, Mars, Venus, Mercury, Sun
  The words: Mahadasha, Antardasha, Lagna, Rashi, nakshatra, house number

WHAT ALWAYS APPEARS:
  The situation in plain language first
  The feeling the placement creates
  The pattern that recurs
  The timing as quality of experience

FOR FACTS/LISTS: Give numbered, specific observations each from a DIFFERENT chart indicator. Each fact specific enough that it would NOT apply to most people.

FOR SPOUSE/PARTNER: Use all 7 layers from private notes. One fact per layer minimum. No hedging.

THE TRANSLATION RULE:
Every chart factor must become a situation, feeling, pattern, or quality of time — never a raw astrological statement.

THE FINAL TEST: Could someone who knows nothing about astrology read this and feel deeply seen?`;
}

// ─── Yearly Prediction Protocol ──────────────────────────────────────────────

export function buildYearlyPredictionProtocol(year: number): string {
  return `
SPECIAL PROTOCOL: YEARLY PREDICTION (${year})

The person has asked about the year ${year}. This is a FUNDAMENTALLY DIFFERENT task from a general reading.

DO NOT give generic life wisdom dressed as yearly predictions.
DO NOT discuss all 12 houses.
DO NOT default to natal chart themes without grounding them in ${year}-specific transits.

LAYER 1 — TRANSITS (50% of the reading):
Step 1a: Where do Saturn, Jupiter, Rahu/Ketu actually sit throughout ${year}?
Step 1b: Which natal houses do these transits fall in for THIS specific chart?
Step 1c: Apply Ashtakavarga IMMEDIATELY — bindu scores gate everything. THIS IS NOT OPTIONAL.
Step 1d: Check for Double Transit — Jupiter AND Saturn both activating the same house?
Step 1e: Check Sade Sati / Kantaka Shani — if active, it IS the year's overarching theme.

LAYER 2 — MAHADASHA + ANTARDASHA (30% of the reading):
Step 2a: Which Mahadasha is running throughout ${year}? What houses does MD lord RULE and OCCUPY?
Step 2b: Which Antardasha(s) run in ${year}? Multiple antardashas often run within a single year.
Step 2c: For each AD lord — what houses does it rule and occupy?
Step 2d: THE CRITICAL INTERSECTION TEST — mandatory, never skip.
  Houses appearing in BOTH transit and dasha activation = CONFIRMED themes of ${year}.
  Houses appearing in ONE layer only = possible themes.
  Houses appearing in NEITHER = DO NOT DISCUSS.

LAYER 3 — D1 NATAL CHART (15% of the reading):
For ONLY the confirmed houses — what is the natal condition?

LAYER 4 — NAKSHATRA OF TRANSITING PLANETS:
The nakshatra COLORS how the transit manifests — not WHETHER it manifests.

MAXIMUM 4 confirmed themes. A reading with 3 specific accurate predictions is worth more than 10 generic ones.

FORMAT:
OPENING (2-3 sentences): The dominant transit + dasha intersection in plain language.
BODY (3-4 confirmed themes only): Each theme 80-120 words — situation, timing, quality, what it asks.
CLOSE (3-4 sentences): The year's arc. What does navigating it well look like? One final question.

TOTAL LENGTH: 400-600 words maximum.
`;
}






