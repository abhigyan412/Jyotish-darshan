// ============================================================
// contradictions.ts
// 50 behavioral contradiction patterns.
//
// Each pattern is:
//   condition()   — pure chart math, returns boolean
//   drive1        — first competing drive (plain language)
//   drive2        — second competing drive (plain language)
//   behavioral()  — what happens in real life when these collide
//   indicators()  — which chart factors are firing (for AI context)
//   confidence()  — how strongly the chart supports this pattern
//
// These are the observations that make people say "how did you know that."
// They work because they name a STRUCTURAL TENSION, not a trait.
// A trait can be ignored. A structural tension keeps showing up.
//
// Used by: salienceEngine.ts → computeChartSignature()
// ============================================================

import type { PlanetKey, PlanetInfo, KundliChart } from "@/types";
import { RASHI_LORDS, PLANET_META } from "@/lib/astro";

// ============================================================
// HELPERS (local — not exported)
// ============================================================

const DUSTHANA  = [6, 8, 12];
const KENDRA    = [1, 4, 7, 10];
const TRIKONA   = [1, 5, 9];
const UPACHAYA  = [3, 6, 10, 11];
const BENEFICS: PlanetKey[] = ["ju", "ve", "mo", "me"];
const MALEFICS: PlanetKey[] = ["sa", "ma", "su", "ra", "ke"];

function get(chart: KundliChart, key: PlanetKey): PlanetInfo | undefined {
  return chart.planets.find(p => p.key === key);
}

function house(chart: KundliChart, key: PlanetKey): number {
  return get(chart, key)?.house ?? 0;
}

function aspects(key: PlanetKey, fromHouse: number): number[] {
  const a = (o: number) => ((fromHouse - 1 + o) % 12) + 1;
  const r = [a(6)];
  if (key === "ma") r.push(a(3), a(7));
  if (key === "ju") r.push(a(4), a(8));
  if (key === "sa") r.push(a(2), a(9));
  if (key === "ra" || key === "ke") r.push(a(4), a(8));
  return r;
}

function aspectsHouse(chart: KundliChart, key: PlanetKey, targetHouse: number): boolean {
  const p = get(chart, key);
  if (!p) return false;
  return aspects(key, p.house).includes(targetHouse);
}

function ruledHouses(key: PlanetKey, lri: number): number[] {
  return [1,2,3,4,5,6,7,8,9,10,11,12].filter(
    h => RASHI_LORDS[(lri + h - 1) % 12] === key
  );
}

function lagnaLordKey(lri: number): PlanetKey {
  return RASHI_LORDS[lri];
}

function isConjunct(chart: KundliChart, a: PlanetKey, b: PlanetKey): boolean {
  const pa = get(chart, a), pb = get(chart, b);
  if (!pa || !pb) return false;
  return pa.house === pb.house;
}

function orbDeg(chart: KundliChart, a: PlanetKey, b: PlanetKey): number {
  const pa = get(chart, a), pb = get(chart, b);
  if (!pa || !pb) return 999;
  let diff = Math.abs(pa.position.totalDegrees - pb.position.totalDegrees);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function isDusthanaPlanet(chart: KundliChart, key: PlanetKey): boolean {
  return DUSTHANA.includes(house(chart, key));
}

function isKendraPlanet(chart: KundliChart, key: PlanetKey): boolean {
  return KENDRA.includes(house(chart, key));
}

// ============================================================
// CONTRADICTION PATTERN TYPE
// ============================================================

export interface ContradictionPattern {
  id: string;
  drive1: string;
  drive2: string;
  condition: (chart: KundliChart, lri: number) => boolean;
  behavioral: (chart: KundliChart, lri: number, nkData?: Record<string, any>) => string;
  indicators: (chart: KundliChart, lri: number) => string[];
  confidence: (chart: KundliChart, lri: number) => number;
}

// ============================================================
// THE 50 PATTERNS
// ============================================================

export const CONTRADICTION_PATTERNS: ContradictionPattern[] = [

  // ── IDENTITY & SOCIAL ────────────────────────────────────────

  {
    id: "ambition_withdrawal",
    drive1: "Genuine ambition and desire for public recognition",
    drive2: "Constitutional need for solitude and withdrawal from the social arena",
    condition: (chart, lri) =>
      (house(chart, "su") === 10 || ruledHouses("su", lri).includes(10)) &&
      (isDusthanaPlanet(chart, lagnaLordKey(lri)) || house(chart, lagnaLordKey(lri)) === 12),
    behavioral: () =>
      `Builds toward public visibility with genuine drive, then — at the moment of maximum exposure — something pulls inward. Others read this as inconsistency or fear of success. Internally it feels like self-preservation. The cycle repeats often enough to become a defining life pattern.`,
    indicators: (chart, lri) => [
      `Sun in or ruling 10th — public ambition`,
      `Lagna lord in ${house(chart, lagnaLordKey(lri))}th — withdrawal pull`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, lagnaLordKey(lri)) === 12) s += 0.2;
      if (isDusthanaPlanet(chart, "su")) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "competence_unworthiness",
    drive1: "High competence and demonstrated capability",
    drive2: "Underlying sense that the capability is never quite enough",
    condition: (chart, lri) =>
      (get(chart, lagnaLordKey(lri))?.isDebilitated ?? false) &&
      (ruledHouses(lagnaLordKey(lri), lri).some(h => KENDRA.includes(h))),
    behavioral: () =>
      `Achieves things that objectively impress others, then immediately raises the bar for what would constitute "actually being good enough." The goalposts move inward at the same speed as external achievements accumulate. Other people experience this person as capable and underconfident simultaneously — a combination that reads as false modesty but isn't false at all.`,
    indicators: (chart, lri) => [
      `Lagna lord debilitated — identity built through friction`,
      `Lagna lord rules kendra — capacity is real but self-assessment lags`,
    ],
    confidence: (chart, lri) => {
      let s = 0.65;
      if (aspectsHouse(chart, "sa", 1)) s += 0.15;
      if (aspectsHouse(chart, "sa", house(chart, lagnaLordKey(lri)))) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "social_solitude",
    drive1: "Genuine warmth and capacity for deep social connection",
    drive2: "Recurring need to disappear from social life entirely",
    condition: (chart, lri) =>
      house(chart, "mo") === 11 &&
      (house(chart, "sa") === 1 || aspectsHouse(chart, "sa", house(chart, "mo"))),
    behavioral: () =>
      `Socially magnetic and genuinely warm when present — people are drawn to them. Then they go quiet. Not always visibly, but they withdraw internally even when physically present. Others interpret the periods of absence as rejection or coldness. The person experiences them as necessary maintenance. The cycle is not a problem to solve — it is the rhythm.`,
    indicators: (chart) => [
      `Moon in 11th — social ease and warmth`,
      `Saturn aspecting Moon — withdrawal requirement`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (aspectsHouse(chart, "sa", 11)) s += 0.15;
      if (house(chart, "ke") === 11) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "leadership_aversion",
    drive1: "Natural leadership instinct and others' expectation of leadership",
    drive2: "Strong aversion to being held responsible for others' outcomes",
    condition: (chart, lri) =>
      (house(chart, "su") === 1 || isConjunct(chart, "su", lagnaLordKey(lri))) &&
      (isDusthanaPlanet(chart, "ma") || get(chart, "ma")?.isDebilitated === true),
    behavioral: () =>
      `Gets placed in leadership positions — by circumstance or others' projection — and functions well there. But there is a quiet resistance to it: the responsibility for others' wellbeing sits heavily. Often leads while privately wishing someone else would take the weight. Does not fully trust their own authority even when it is clearly working.`,
    indicators: (chart) => [
      `Sun in 1st or conjunct lagna lord — leadership projection`,
      `Mars weakened — resistance to carrying others' outcomes`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (get(chart, "ma")?.isDebilitated) s += 0.2;
      if (aspectsHouse(chart, "sa", 1)) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "intelligence_paralysis",
    drive1: "Sharp analytical intelligence that sees all sides of a situation",
    drive2: "Difficulty committing to a direction because all sides remain visible",
    condition: (chart, lri) =>
      (house(chart, "me") === 1 || house(chart, "me") === 7) &&
      (get(chart, "me")?.isRetrograde === true || aspectsHouse(chart, "sa", house(chart, "me"))),
    behavioral: () =>
      `Processes situations faster than most and sees angles others miss. But seeing all the angles creates a specific paralysis: every option has a visible downside, every decision a traceable cost. This looks like indecision from outside. Internally it is the opposite — too much decision, too many simultaneously. Commits late but then fully.`,
    indicators: (chart) => [
      `Mercury in 1st or 7th — analytical identity`,
      `Mercury retrograde or Saturn-aspected — processing turned inward`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (get(chart, "me")?.isRetrograde) s += 0.15;
      if (isConjunct(chart, "me", "sa")) s += 0.15;
      return Math.min(s, 1.0);
    },
  },

  // ── RELATIONSHIPS ────────────────────────────────────────────

  {
    id: "intimacy_distance",
    drive1: "Deep desire for genuine intimate connection",
    drive2: "Reflexive distancing when connection becomes too close",
    condition: (chart, lri) => {
      const h7lk = RASHI_LORDS[(lri + 6) % 12];
      return (
        isDusthanaPlanet(chart, h7lk) ||
        aspectsHouse(chart, "sa", 7) ||
        (get(chart, "ke")?.house === 7)
      );
    },
    behavioral: () =>
      `Wants closeness — genuinely. But when someone gets past the outer layer, something activates that starts creating distance again. Not betrayal, not loss of interest — more like the closeness itself triggers a self-protective mechanism. Partners experience this as push-pull. The person experiences it as a need for space that arrives inconveniently. The distance is not evidence of not caring. It is evidence of caring too much for comfort.`,
    indicators: (chart, lri) => {
      const h7lk = RASHI_LORDS[(lri + 6) % 12];
      return [
        `7th lord in ${house(chart, h7lk)}th — relationship domain carries tension`,
        aspectsHouse(chart, "sa", 7) ? `Saturn aspects 7th — commitment carries fear or delay` : "",
        get(chart, "ke")?.house === 7 ? `Ketu in 7th — detachment runs alongside desire` : "",
      ].filter(Boolean);
    },
    confidence: (chart, lri) => {
      let s = 0.58;
      const h7lk = RASHI_LORDS[(lri + 6) % 12];
      if (isDusthanaPlanet(chart, h7lk)) s += 0.15;
      if (get(chart, "ke")?.house === 7) s += 0.15;
      if (aspectsHouse(chart, "sa", 7)) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "loyalty_independence",
    drive1: "Capacity for fierce, unconditional loyalty to people they choose",
    drive2: "Non-negotiable need for personal independence and autonomy",
    condition: (chart, lri) =>
      (house(chart, "mo") === 7 || isConjunct(chart, "mo", "ve")) &&
      (house(chart, "ra") === 1 || house(chart, lagnaLordKey(lri)) === 3 ||
       house(chart, lagnaLordKey(lri)) === 11),
    behavioral: () =>
      `Capable of profound loyalty — will show up completely for people they have chosen. But the choosing must be on their own terms and cannot be demanded. The moment someone assumes the loyalty rather than receiving it as a gift, something shifts. They do not leave — but they begin to feel trapped. The relationship becomes a cage only when the person stops acknowledging the choice that keeps them in it.`,
    indicators: (chart) => [
      `Moon in 7th or conjunct Venus — genuine relational warmth`,
      `Lagna lord in 3rd or 11th, or Rahu in 1st — independence drive`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "ra") === 1) s += 0.2;
      if (house(chart, lagnaLordKey(lri)) === 3) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "attachment_detachment",
    drive1: "Attaches quickly and completely to people who interest them",
    drive2: "Detaches equally completely once the connection feels like obligation",
    condition: (chart, lri) =>
      house(chart, "mo") === 5 &&
      (house(chart, "ke") === 7 || isDusthanaPlanet(chart, RASHI_LORDS[(lri + 6) % 12])),
    behavioral: () =>
      `The engagement is real — when interested, they are fully present and the connection feels unusually intense to the other person. Then something shifts. It is often not a dramatic event. The energy simply withdraws. The other person is left trying to understand what changed. The answer is usually that the relationship started to feel like something that was expected rather than chosen. Obligation ends their presence; choice sustains it.`,
    indicators: (chart) => [
      `Moon in 5th — attachment is romantic and total`,
      `Ketu in 7th or 7th lord in dusthana — detachment mechanism active`,
    ],
    confidence: (chart, lri) => {
      let s = 0.62;
      if (house(chart, "ke") === 7) s += 0.2;
      if (orbDeg(chart, "mo", "ke") < 15) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "trust_testing",
    drive1: "Craves trust and genuine openness in relationships",
    drive2: "Unconsciously tests loyalty before allowing real vulnerability",
    condition: (chart, lri) =>
      (house(chart, "mo") === 8 || aspectsHouse(chart, "sa", house(chart, "mo"))) &&
      (house(chart, "ra") === 7 || isConjunct(chart, "ra", RASHI_LORDS[(lri + 6) % 12])),
    behavioral: () =>
      `Genuinely wants to trust — the desire for authentic, open connection is real. But trust is extended through a testing phase that the other person may not know is happening. Small behaviors are watched. Responses to stress are noted. The test is passed not by passing it but by being consistent long enough that the testing mechanism stops running. Partners who pass often don't know they were being evaluated. Those who fail are usually confused about what went wrong.`,
    indicators: (chart) => [
      `Moon in 8th or Saturn-aspected — trust carries historical weight`,
      `Rahu in 7th — the relationship domain holds complexity and desire simultaneously`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "mo") === 8) s += 0.2;
      if (house(chart, "ra") === 7) s += 0.15;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "devotion_resentment",
    drive1: "Capacity for selfless, devoted service to people they love",
    drive2: "Accumulating resentment when that devotion is not matched",
    condition: (chart, lri) =>
      (house(chart, "mo") === 6 || house(chart, "ve") === 6) &&
      (aspectsHouse(chart, "sa", 7) || get(chart, "mo")?.isDebilitated === true),
    behavioral: () =>
      `Gives extensively — time, energy, emotional labor — and does it genuinely, without apparent expectation. But the expectation is there, unstated. When it is not matched over time, the resentment doesn't announce itself. It accumulates quietly until it becomes the primary texture of the relationship. The person may not know this is happening until it is already advanced. The giving was real. So was the unspoken contract.`,
    indicators: (chart) => [
      `Moon or Venus in 6th — service and sacrifice orientation`,
      `Saturn aspecting 7th or Moon debilitated — disappointment pattern active`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "mo") === 6 && house(chart, "ve") === 6) s += 0.2;
      if (get(chart, "mo")?.isDebilitated) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  // ── CAREER & PURPOSE ─────────────────────────────────────────

  {
    id: "authority_autonomy",
    drive1: "Strong capacity for institutional authority and leadership",
    drive2: "Deep resistance to being managed or directed by others",
    condition: (chart, lri) => {
      const h10lk = RASHI_LORDS[(lri + 9) % 12];
      return (
        (house(chart, "su") === 10 || house(chart, h10lk) === 1) &&
        (house(chart, "ra") === 10 || house(chart, "ke") === 10 ||
         house(chart, lagnaLordKey(lri)) === 10)
      );
    },
    behavioral: () =>
      `Functions exceptionally well in authority — genuinely capable of leading complex situations. But requires that authority to be given, not managed from above. The moment a superior micromanages or restricts, motivation collapses faster than it does for most people. This is not ego — it is a structural mismatch between how they generate their best work (autonomously) and how institutions tend to operate (hierarchically). Works best as the final decision-maker in their domain, even a small one.`,
    indicators: (chart, lri) => {
      const h10lk = RASHI_LORDS[(lri + 9) % 12];
      return [
        `Sun or 10th lord prominent — leadership capacity genuine`,
        `Rahu or Ketu in 10th, or lagna lord in 10th — independent career orientation`,
      ];
    },
    confidence: (chart, lri) => {
      let s = 0.62;
      if (house(chart, "ra") === 10) s += 0.15;
      if (house(chart, lagnaLordKey(lri)) === 10) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "vision_execution",
    drive1: "Expansive, long-range vision and genuinely original ideas",
    drive2: "Difficulty sustaining the detail-level execution those ideas require",
    condition: (chart, lri) =>
      (house(chart, "ju") === 1 || house(chart, "ju") === 9 || house(chart, "ju") === 11) &&
      (get(chart, "me")?.isDebilitated === true || isDusthanaPlanet(chart, "me") ||
       house(chart, "sa") === 3),
    behavioral: () =>
      `The ideas are real and often genuinely ahead. The gap is in the sustained execution phase — the long middle of a project where the original insight has been made but the infrastructure hasn't caught up. This is where things stall. Not from lack of capability but from loss of the novel energy that started things. Needs either a partner who handles the execution layer, or a structural system that maintains momentum through the middle phase.`,
    indicators: (chart) => [
      `Jupiter in 1st, 9th, or 11th — expansive vision`,
      `Mercury weakened or Saturn in 3rd — execution energy drops`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (get(chart, "me")?.isDebilitated) s += 0.2;
      if (house(chart, "sa") === 3) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "recognition_invisibility",
    drive1: "Genuine desire for public recognition of their work",
    drive2: "Simultaneous desire to operate invisibly, without scrutiny",
    condition: (chart, lri) =>
      (ruledHouses(lagnaLordKey(lri), lri).includes(10) ||
       ruledHouses("su", lri).includes(10)) &&
      (house(chart, "ke") === 10 || isDusthanaPlanet(chart, "su")),
    behavioral: () =>
      `Wants the work to be known and appreciated — the desire for recognition is genuine and not merely ego. But when the recognition arrives, the exposure feels uncomfortable. Being seen clearly by many people simultaneously activates a self-protective instinct that conflicts with the professional ambition. The result: builds visibility, then unconsciously creates friction with it.`,
    indicators: (chart) => [
      `Sun or lagna lord rules 10th — recognition desire`,
      `Ketu in 10th or Sun in dusthana — visibility creates discomfort`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "ke") === 10) s += 0.2;
      if (isDusthanaPlanet(chart, "su")) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "mastery_restlessness",
    drive1: "High capacity to go deep and achieve genuine mastery in a domain",
    drive2: "Restlessness that appears before mastery is complete",
    condition: (chart, lri) =>
      (house(chart, "me") === 3 || house(chart, lagnaLordKey(lri)) === 3) &&
      house(chart, "ra") === 3,
    behavioral: () =>
      `Gets deeply into things — the learning curve is steep and the engagement is real. But before the depth converts fully into authority, the interest begins to drift. A new domain appears more interesting than the current one. This creates a pattern of impressive range with expertise that almost consolidates but rarely fully does. The mastery is available; the staying through the unglamorous phase of cementing it is the challenge.`,
    indicators: (chart) => [
      `Mercury or lagna lord in 3rd — multiple skills, intellectual range`,
      `Rahu in 3rd — restlessness and ambition around communication/skills`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "me") === 3 && house(chart, "ra") === 3) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "discipline_excess",
    drive1: "Capacity for extraordinary discipline and structured effort",
    drive2: "Tendency toward excess or burnout when structure breaks down",
    condition: (chart, lri) =>
      (house(chart, "sa") === 1 || house(chart, "sa") === 10 ||
       ruledHouses("sa", lri).includes(1)) &&
      (house(chart, "ra") === 1 || isConjunct(chart, "sa", "ma")),
    behavioral: () =>
      `Can work at a sustained level that genuinely impresses — the discipline is real and the output consistent. But the off switch is poorly calibrated. When the structure is in place, everything functions. When it breaks down — through disruption, completion of a goal, or external chaos — the behavior swings toward excess in some form: overwork in a different direction, indulgence, or collapse. The middle register between full output and full rest is difficult to access.`,
    indicators: (chart) => [
      `Saturn in 1st or 10th — discipline as identity`,
      `Rahu in 1st or Saturn-Mars conjunction — excess tendency`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (isConjunct(chart, "sa", "ma")) s += 0.15;
      if (house(chart, "ra") === 1) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  // ── EMOTIONAL ────────────────────────────────────────────────

  {
    id: "strength_suppression",
    drive1: "Genuine inner strength and reliability that others depend on",
    drive2: "Complete suppression of personal vulnerability and need for support",
    condition: (chart, lri) =>
      (aspectsHouse(chart, "sa", house(chart, "mo")) ||
       house(chart, "mo") === 10 || house(chart, "mo") === 6) &&
      (get(chart, "mo")?.isCombust === true || isConjunct(chart, "mo", "sa")),
    behavioral: () =>
      `Functions as the reliable one — the person others call when things are hard. Does this genuinely and without performance. But reciprocal support — being the one who needs — is not accessible in the same way. Not because others wouldn't offer it, but because asking feels like a category error: that is not a role this person occupies. The strength is real. So is the isolation that comes with it.`,
    indicators: (chart) => [
      `Saturn aspects Moon or conjunction — emotional suppression`,
      `Moon in 10th or 6th — strength and service orientation`,
    ],
    confidence: (chart, lri) => {
      let s = 0.65;
      if (isConjunct(chart, "mo", "sa")) s += 0.2;
      if (house(chart, "mo") === 10) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "sensitivity_armor",
    drive1: "Unusually deep emotional sensitivity",
    drive2: "Hard outer presentation that protects the sensitivity from exposure",
    condition: (chart, lri) =>
      (house(chart, "mo") === 8 || house(chart, "mo") === 12) &&
      (house(chart, "su") === 1 || house(chart, "ma") === 1 ||
       get(chart, "sa")?.house === 1),
    behavioral: () =>
      `Feels things at a depth most people don't, or don't show. The outer presentation — confident, self-contained, sometimes blunt — is not a lie, but it is armor. The sensitivity lives underneath and only surfaces in situations of absolute trust, or in situations of complete overwhelm where the armor stops working. People who know only the surface are surprised by the depth. People who know only the depth are surprised by the surface.`,
    indicators: (chart) => [
      `Moon in 8th or 12th — deep, private emotional life`,
      `Sun, Mars, or Saturn in 1st — strong outer self-presentation`,
    ],
    confidence: (chart, lri) => {
      let s = 0.65;
      if (house(chart, "mo") === 8) s += 0.15;
      if (house(chart, "su") === 1 && house(chart, "mo") === 12) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "anger_avoidance",
    drive1: "Strong, fast-rising anger that is genuine and energetic",
    drive2: "Deep discomfort with conflict and its relational aftermath",
    condition: (chart, lri) =>
      (house(chart, "ma") === 4 || aspectsHouse(chart, "ma", house(chart, "mo"))) &&
      (house(chart, "ve") === 7 || house(chart, "mo") === 7),
    behavioral: () =>
      `The anger is real and arrives quickly — a sharp spike that is followed almost immediately by discomfort at having expressed it. The relational cost of conflict feels higher to this person than it does for most. So the pattern becomes: feel the anger, suppress or redirect it, feel the resentment of having suppressed it. The anger doesn't disappear — it goes underground and resurfaces indirectly through withdrawal, sarcasm, or sudden exits.`,
    indicators: (chart) => [
      `Mars in 4th or aspecting Moon — fast emotional reactivity`,
      `Venus in 7th or Moon in 7th — high relational investment, conflict aversion`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "ma") === 4 && house(chart, "mo") === 7) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "optimism_catastrophizing",
    drive1: "Genuine and sustaining optimism about the future",
    drive2: "Rapid catastrophizing when things go wrong in the present",
    condition: (chart, lri) =>
      (house(chart, "ju") === 1 || house(chart, "ju") === 5 ||
       house(chart, "ju") === 9) &&
      (house(chart, "mo") === 6 || house(chart, "mo") === 8 ||
       aspectsHouse(chart, "sa", house(chart, "mo"))),
    behavioral: () =>
      `Genuinely optimistic as a baseline — not naively, but with a structural expectation that things will work out. This serves them well most of the time. But when something goes wrong, the same imagination that generates optimism generates catastrophe scenarios at the same speed and intensity. The shift from "everything will be fine" to "this could spiral into total collapse" happens faster than observers expect. Both are real; neither is the full picture.`,
    indicators: (chart) => [
      `Jupiter in 1st, 5th, or 9th — optimism and faith as baseline`,
      `Moon in 6th/8th or Saturn-aspected — anxiety current underneath`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (aspectsHouse(chart, "sa", house(chart, "mo"))) s += 0.15;
      if (house(chart, "mo") === 8) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "grief_productivity",
    drive1: "Deep capacity to feel grief and loss",
    drive2: "Converting unprocessed grief into high productivity",
    condition: (chart, lri) =>
      (house(chart, "mo") === 8 || isConjunct(chart, "mo", "ke") ||
       orbDeg(chart, "mo", "ke") < 10) &&
      (house(chart, "su") === 10 || house(chart, "ma") === 10 ||
       ruledHouses("sa", lri).includes(10)),
    behavioral: () =>
      `Loss hits deeply — possibly more than they show and more than the situation seems to warrant to others. The processing mechanism is work. Periods of high productivity are sometimes periods of unprocessed grief in motion. This is not pathological — the productivity is real and the output genuine. But the emotion driving it is not always acknowledged, which means it doesn't fully complete. The sadness stays available underneath the output.`,
    indicators: (chart) => [
      `Moon conjunct or near Ketu, or in 8th — grief and loss sensitivity`,
      `Strong 10th house or Saturn — work as processing mechanism`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (orbDeg(chart, "mo", "ke") < 5) s += 0.2;
      if (house(chart, "mo") === 8) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  // ── SPIRITUALITY & DHARMA ─────────────────────────────────────

  {
    id: "material_detachment",
    drive1: "Active desire for material success and financial security",
    drive2: "Underlying detachment from whether it arrives or not",
    condition: (chart, lri) =>
      (ruledHouses("sa", lri).includes(2) || ruledHouses("sa", lri).includes(11)) &&
      (house(chart, "ke") === 2 || house(chart, "ke") === 11 ||
       house(chart, "ju") === 12),
    behavioral: () =>
      `Pursues material goals with genuine effort — this is not someone who has transcended wanting things. But alongside the effort there is a quality of non-attachment that coexists with it without resolving it. They can work toward something fully and simultaneously not be destroyed if it doesn't arrive. Others read this as either admirable equanimity or frustrating lack of drive, depending on context.`,
    indicators: (chart) => [
      `Saturn rules wealth houses — effort-oriented financial relationship`,
      `Ketu in 2nd or 11th, or Jupiter in 12th — genuine non-attachment`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "ke") === 2) s += 0.2;
      if (house(chart, "ju") === 12) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "seeker_doubter",
    drive1: "Deep draw toward spiritual inquiry and metaphysical questions",
    drive2: "Rational mind that consistently dismantles spiritual conclusions",
    condition: (chart, lri) =>
      (house(chart, "ke") === 9 || house(chart, "ke") === 12 ||
       house(chart, "ju") === 12) &&
      (house(chart, "me") === 9 || house(chart, "me") === 1 ||
       ruledHouses(lagnaLordKey(lri), lri).includes(9)),
    behavioral: () =>
      `The seeking is genuine — there is a real pull toward understanding what is underneath the surface of experience. But the rational mind is equally active and equally genuine. Every spiritual conclusion gets examined and found lacking in some respect. The result is a person who has covered more spiritual ground than most, holds it more lightly than most, and is more honestly uncertain than most. The doubt is not a failure of faith — it is the same intelligence that makes the seeking real.`,
    indicators: (chart) => [
      `Ketu in 9th or 12th, or Jupiter in 12th — spiritual pull`,
      `Mercury in 9th or 1st — rational examination of belief`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "ke") === 9 && house(chart, "me") === 9) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "dharma_resistance",
    drive1: "Clear sense of what their life purpose or calling is",
    drive2: "Consistent resistance to actually pursuing it",
    condition: (chart, lri) => {
      const h9lk = RASHI_LORDS[(lri + 8) % 12];
      return (
        (get(chart, h9lk)?.isDebilitated === true ||
         isDusthanaPlanet(chart, h9lk)) &&
        (house(chart, "su") === 9 || ruledHouses("su", lri).includes(9))
      );
    },
    behavioral: () =>
      `Knows what matters — there is a clear signal about what direction the life should move in. But the movement toward it is halting. The preparation extends beyond what preparation requires. The conditions are never quite right. The calling is acknowledged privately and deferred publicly. The deferral is not laziness — it usually contains real fear: that pursuing the real thing and having it fail would be worse than not having tried it.`,
    indicators: (chart, lri) => {
      const h9lk = RASHI_LORDS[(lri + 8) % 12];
      return [
        `9th lord debilitated or in dusthana — dharma path carries friction`,
        `Sun in or ruling 9th — the purpose is visible to the person`,
      ];
    },
    confidence: (chart, lri) => {
      let s = 0.6;
      const h9lk = RASHI_LORDS[(lri + 8) % 12];
      if (get(chart, h9lk)?.isDebilitated) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  // ── POWER & CONTROL ──────────────────────────────────────────

  {
    id: "control_surrender",
    drive1: "Deep need for control over their environment and circumstances",
    drive2: "Recurring situations that force surrender of that control",
    condition: (chart, lri) =>
      (house(chart, "sa") === 1 || isConjunct(chart, "su", "sa") ||
       ruledHouses("sa", lri).includes(1)) &&
      (house(chart, "ra") === 1 || house(chart, "ke") === 1 ||
       isDusthanaPlanet(chart, lagnaLordKey(lri))),
    behavioral: () =>
      `Builds careful structures — in work, in relationships, in daily life — that keep things predictable and manageable. Then life periodically dismantles those structures through events outside their control. The dismantling is experienced intensely because the control was doing important emotional work: not just organizing the external world but managing an internal anxiety about unpredictability. What looks like a control issue is usually anxiety with a systems interface.`,
    indicators: (chart) => [
      `Saturn in 1st or conjunct Sun — control as identity structure`,
      `Rahu/Ketu in 1st or lagna lord in dusthana — disruption is structural`,
    ],
    confidence: (chart, lri) => {
      let s = 0.62;
      if (isConjunct(chart, "su", "sa")) s += 0.15;
      if (house(chart, "ra") === 1) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "power_discomfort",
    drive1: "Genuine personal power and influence over others",
    drive2: "Discomfort with or ambivalence about having that power",
    condition: (chart, lri) =>
      (house(chart, "su") === 8 || house(chart, "ma") === 8 ||
       house(chart, "ra") === 10) &&
      (house(chart, "ke") === 10 || isDusthanaPlanet(chart, "su")),
    behavioral: () =>
      `Has more influence on others than they fully acknowledge — in rooms they enter, in decisions they participate in, in how people feel after interacting with them. But the influence is not fully claimed. There is ambivalence about power: a sense that claiming it openly would be presumptuous, or that it carries a cost they are not sure they want to pay. The power operates regardless. The ambivalence just makes it less directed.`,
    indicators: (chart) => [
      `Sun or Mars in 8th, or Rahu in 10th — power without full acknowledgment`,
      `Ketu in 10th or Sun in dusthana — ambivalence about claiming authority`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "ra") === 10 && house(chart, "ke") === 4) s += 0.15;
      return Math.min(s, 1.0);
    },
  },

  // ── MONEY & SECURITY ─────────────────────────────────────────

  {
    id: "abundance_scarcity",
    drive1: "Genuine capacity to generate wealth and abundance",
    drive2: "Persistent underlying scarcity mindset that coexists with actual abundance",
    condition: (chart, lri) => {
      const h2lk = RASHI_LORDS[(lri + 1) % 12];
      const h11lk = RASHI_LORDS[(lri + 10) % 12];
      return (
        (get(chart, h2lk)?.isExalted === true ||
         KENDRA.includes(house(chart, h2lk)) ||
         TRIKONA.includes(house(chart, h11lk))) &&
        (aspectsHouse(chart, "sa", 2) || house(chart, "ke") === 2 ||
         get(chart, h2lk)?.isDebilitated === true)
      );
    },
    behavioral: () =>
      `Can generate money and does — the track record is there. But the internal experience of financial security rarely matches the external reality. There is a background worry that runs independently of what the bank account says. The worry is not proportional to the risk. It is a default setting, probably learned early, that keeps running even when the evidence no longer supports it.`,
    indicators: (chart, lri) => {
      const h2lk = RASHI_LORDS[(lri + 1) % 12];
      return [
        `2nd or 11th lord well-placed — abundance capacity`,
        `Saturn aspects 2nd or Ketu in 2nd — scarcity experience`,
      ];
    },
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "ke") === 2) s += 0.2;
      if (aspectsHouse(chart, "sa", 2)) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  // ── COMMUNICATION ────────────────────────────────────────────

  {
    id: "articulate_silent",
    drive1: "High articulateness and genuine communicative intelligence",
    drive2: "Long silences and deliberate withholding of what they actually think",
    condition: (chart, lri) =>
      (house(chart, "me") === 1 || isConjunct(chart, "me", lagnaLordKey(lri))) &&
      (get(chart, "me")?.isRetrograde === true ||
       house(chart, "sa") === 3 ||
       house(chart, "ke") === 3),
    behavioral: () =>
      `When they speak, it is precise and often more insightful than the situation seemed to require. But they speak less than their intelligence would suggest. There are things they notice that they do not say. Opinions fully formed that are offered partially or not at all. The gap between what they observe and what they express is usually significant, and usually intentional. The withholding is not social awkwardness — it is considered.`,
    indicators: (chart) => [
      `Mercury in 1st or conjunct lagna lord — communicative intelligence`,
      `Mercury retrograde, Saturn in 3rd, or Ketu in 3rd — deliberate withholding`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (get(chart, "me")?.isRetrograde) s += 0.15;
      if (house(chart, "ke") === 3) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "blunt_sensitive",
    drive1: "Direct, sometimes blunt communication style",
    drive2: "High sensitivity to how their own directness lands on others",
    condition: (chart, lri) =>
      (house(chart, "ma") === 3 || isConjunct(chart, "ma", "me") ||
       house(chart, "su") === 3) &&
      (house(chart, "mo") === 4 || house(chart, "ve") === 1 ||
       aspectsHouse(chart, "mo", 3)),
    behavioral: () =>
      `Says things directly — this is not performance or aggression, it is simply how they process and communicate. But after the direct statement lands, there is a monitoring process: how was that received, did I cause damage, should I walk it back. The bluntness and the sensitivity exist simultaneously in the same person. Others who experience only the directness are surprised by the sensitivity. Others who experience only the sensitivity are surprised by the directness.`,
    indicators: (chart) => [
      `Mars in 3rd or conjunct Mercury, Sun in 3rd — direct communication`,
      `Moon in 4th or aspecting 3rd, Venus in 1st — relational sensitivity`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (isConjunct(chart, "ma", "me")) s += 0.15;
      return Math.min(s, 1.0);
    },
  },

  // ── TRANSFORMATION ───────────────────────────────────────────

  {
    id: "destruction_creation",
    drive1: "Capacity to build and create with genuine sustained effort",
    drive2: "Periodic impulse to dismantle what has been built",
    condition: (chart, lri) =>
      (house(chart, "ra") === 8 || house(chart, "ke") === 4 ||
       isConjunct(chart, "sa", "ma")) &&
      (ruledHouses("su", lri).includes(10) || house(chart, "su") === 10),
    behavioral: () =>
      `Builds things — projects, structures, sometimes relationships — with real investment. Then at some point, often when the thing is near completion or functioning well, there is an impulse to tear it down. This is not self-sabotage in the therapeutic sense. It is closer to a need for the energy of creation, which requires that the previous structure no longer be there. The destruction is real. So is the creation that follows.`,
    indicators: (chart) => [
      `Rahu in 8th, Ketu in 4th, or Saturn-Mars conjunction — destruction-creation cycle`,
      `Sun in or ruling 10th — genuine builder`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "ra") === 8 && house(chart, "ke") === 2) s += 0.15;
      if (isConjunct(chart, "sa", "ma")) s += 0.15;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "stability_disruption",
    drive1: "Strong desire for stability, routine, and predictable structure",
    drive2: "Unconscious generation of disruption that dismantles stability",
    condition: (chart, lri) =>
      (house(chart, "mo") === 4 || house(chart, "ve") === 4 ||
       ruledHouses(lagnaLordKey(lri), lri).includes(4)) &&
      (house(chart, "ra") === 4 || house(chart, "ra") === 1 ||
       house(chart, "ma") === 4),
    behavioral: () =>
      `Genuinely wants stability — home, routine, consistent relationships. Goes to considerable effort to build it. Then disrupts it, often without fully understanding why. The disruption can be external (moving, ending relationships, changing careers) or internal (creating emotional upheaval in a stable situation). The stability that was built is real. So is the part that cannot remain in it indefinitely.`,
    indicators: (chart) => [
      `Moon or Venus in 4th — stability and home orientation`,
      `Rahu in 4th or 1st, or Mars in 4th — disruption mechanism`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "ra") === 4 && house(chart, "mo") === 4) s += 0.2;
      if (house(chart, "ma") === 4) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  // ── SELF-KNOWLEDGE ───────────────────────────────────────────

  {
    id: "self_aware_blind",
    drive1: "High self-awareness and capacity for honest self-assessment",
    drive2: "Specific blind spot that the self-awareness consistently misses",
    condition: (chart, lri) =>
      (house(chart, "me") === 1 || house(chart, "ju") === 1) &&
      (house(chart, "su") === 12 || get(chart, "su")?.isCombust === true ||
       house(chart, "ke") === 1),
    behavioral: () =>
      `More self-aware than most — genuinely examines their behavior, tracks their patterns, can name their own tendencies with some accuracy. But there is one area — usually involving how others actually experience them versus how they believe others experience them — where the self-model is consistently off. The blind spot is maintained precisely because the general self-awareness makes it feel unnecessary: if I can see this much, surely I can see that too. Usually cannot.`,
    indicators: (chart) => [
      `Mercury or Jupiter in 1st — high self-reflection capacity`,
      `Sun in 12th or combust, or Ketu in 1st — specific blind spot`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "su") === 12) s += 0.15;
      if (house(chart, "ke") === 1) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "past_future",
    drive1: "Strong orientation toward the future and what is being built",
    drive2: "Persistent pull of the past that intrudes on forward momentum",
    condition: (chart, lri) =>
      (house(chart, "ra") === 10 || house(chart, "ra") === 9 ||
       house(chart, "su") === 11) &&
      (house(chart, "ke") === 4 || house(chart, "mo") === 12 ||
       get(chart, lagnaLordKey(lri))?.isRetrograde === true),
    behavioral: () =>
      `Future-oriented in most visible respects — goal-directed, forward-planning, interested in what comes next. But something from the past has not fully resolved and keeps returning. Not always as explicit memory — sometimes as a behavioral pattern that replicates an older dynamic without the person recognizing the template. The future-orientation is genuine. So is the pull backward. They run simultaneously, creating a kind of doubling in the timeline.`,
    indicators: (chart) => [
      `Rahu in 9th or 10th, Sun in 11th — future and achievement orientation`,
      `Ketu in 4th, Moon in 12th, or retrograde lagna lord — past pull`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (house(chart, "ke") === 4 && house(chart, "ra") === 10) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  // ── BONUS PATTERNS ───────────────────────────────────────────

  {
    id: "public_private",
    drive1: "Compelling, magnetic public presence",
    drive2: "Private self that is significantly different from the public one",
    condition: (chart, lri) =>
      (house(chart, "su") === 10 || house(chart, "ra") === 10 ||
       house(chart, "ve") === 10) &&
      (house(chart, "mo") === 12 || house(chart, "mo") === 4 ||
       isDusthanaPlanet(chart, lagnaLordKey(lri))),
    behavioral: () =>
      `Creates a strong impression in public contexts — charismatic, competent, or compelling depending on the domain. The private self is quieter, sometimes simpler, and bears little resemblance to the public presence. People who know them publicly and then encounter them privately are often surprised. People who know them privately and watch them publicly are equally surprised. Both are authentic; they simply do not overlap much.`,
    indicators: (chart) => [
      `Sun, Rahu, or Venus in 10th — strong public presence`,
      `Moon in 12th or 4th, or lagna lord in dusthana — private self hidden`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "mo") === 12 && house(chart, "su") === 10) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "help_burden",
    drive1: "Genuine desire and capacity to help others",
    drive2: "Feeling burdened or resentful when the helping is not reciprocal",
    condition: (chart, lri) =>
      (house(chart, "ju") === 6 || house(chart, "mo") === 6 ||
       house(chart, "ve") === 6) &&
      (aspectsHouse(chart, "sa", 6) || isDusthanaPlanet(chart, "mo")),
    behavioral: () =>
      `The helping impulse is genuine and not performed. Shows up for people, sometimes at real cost to themselves. But the giving has an implicit contract: that the effort is seen and, over time, matched in some form. When it isn't — when the helping becomes expected rather than appreciated, or when someone takes more than they give back — the resentment accumulates. The person will give for a long time before they say anything. When they do say something, the amount stored surprises everyone including them.`,
    indicators: (chart) => [
      `Jupiter, Moon, or Venus in 6th — service orientation`,
      `Saturn aspects 6th or Moon in dusthana — resentment accumulation risk`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (house(chart, "mo") === 6 && aspectsHouse(chart, "sa", 6)) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "certainty_doubt",
    drive1: "Projects certainty and decisiveness",
    drive2: "Internal doubt that runs continuously behind the projected certainty",
    condition: (chart, lri) =>
      (house(chart, "su") === 1 || house(chart, "ma") === 1 ||
       get(chart, lagnaLordKey(lri))?.isExalted === true) &&
      (get(chart, "me")?.isRetrograde === true ||
       aspectsHouse(chart, "sa", house(chart, "me")) ||
       house(chart, "ke") === 5),
    behavioral: () =>
      `Reads as certain and decisive — makes calls, takes positions, projects clarity. Inside, a commentary is running that questions most of those calls. The doubt is not proportional to the situation and is not visible to anyone who isn't very close. The certainty is not performed — it is one true thing. The doubt is another true thing running beneath it. Managing the gap between the two is a significant part of the private interior life.`,
    indicators: (chart) => [
      `Sun or Mars in 1st, or lagna lord exalted — projects certainty`,
      `Mercury retrograde, Saturn-aspected Mercury, or Ketu in 5th — internal doubt`,
    ],
    confidence: (chart, lri) => {
      let s = 0.6;
      if (get(chart, "me")?.isRetrograde && house(chart, "su") === 1) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "independence_connection",
    drive1: "Deep valuing of independence and self-sufficiency",
    drive2: "Equally deep need for genuine connection and belonging",
    condition: (chart, lri) =>
      (house(chart, "ra") === 1 || house(chart, lagnaLordKey(lri)) === 11 ||
       house(chart, "su") === 11) &&
      (house(chart, "mo") === 7 || house(chart, "mo") === 4 ||
       house(chart, "ve") === 1),
    behavioral: () =>
      `Values independence at a constitutional level — not as a preference but as a requirement. But the independence is not actually the whole story. Alongside it runs a genuine need for connection that is equally real and sometimes stronger. The tension produces a person who pulls toward intimacy and simultaneously maintains escape routes from it. Neither drive wins; they alternate. The people in their life have to be comfortable with both — the closeness when it arrives and the distance when it doesn't.`,
    indicators: (chart) => [
      `Rahu in 1st, lagna lord in 11th, or Sun in 11th — independence drive`,
      `Moon in 7th or 4th, Venus in 1st — belonging and connection need`,
    ],
    confidence: (chart, lri) => {
      let s = 0.62;
      if (house(chart, "ra") === 1 && house(chart, "mo") === 7) s += 0.2;
      return Math.min(s, 1.0);
    },
  },

  {
    id: "forgiveness_memory",
    drive1: "Genuine capacity for forgiveness and moving forward",
    drive2: "Precise emotional memory that never actually forgets",
    condition: (chart, lri) =>
      (house(chart, "ju") === 7 || house(chart, "ju") === 12 ||
       house(chart, "ve") === 9) &&
      (house(chart, "sa") === 4 || isConjunct(chart, "sa", "mo") ||
       house(chart, "ma") === 4),
    behavioral: () =>
      `Forgives — genuinely, without performance, and means it at the time. But the emotional memory of what happened is stored separately from the forgiveness and accessed separately from it. The person can forgive someone and simultaneously not trust them again at the level they did before. This is not hypocrisy — both things are true. The forgiveness is real. So is the adjustment to how much exposure the other person gets going forward.`,
    indicators: (chart) => [
      `Jupiter in 7th or 12th, Venus in 9th — genuine forgiveness capacity`,
      `Saturn in 4th or conjunct Moon, Mars in 4th — precise emotional memory`,
    ],
    confidence: (chart, lri) => {
      let s = 0.58;
      if (isConjunct(chart, "sa", "mo")) s += 0.15;
      if (house(chart, "sa") === 4 && house(chart, "ju") === 12) s += 0.1;
      return Math.min(s, 1.0);
    },
  },

];