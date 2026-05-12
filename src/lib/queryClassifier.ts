// ============================================================
// queryClassifier.ts
// Routes every user message to one of 12 QueryClass types.
// Used by contextBuilder.ts to inject only relevant chart layers.
//
// Architecture: two-stage
//   Stage 1 — deterministic regex/keyword matching (~2ms, free)
//   Stage 2 — Haiku AI fallback for ambiguous messages (~300ms, cheap)
//
// The query class controls:
//   - Which salience layers are injected (marriage? career? identity?)
//   - Which protocol runs in the system prompt
//   - Which model is used (Haiku / Sonnet / Opus)
//   - Token budget for the context
//
// Usage:
//   const result = await classifyQuery(message, conversationHistory);
//   const context = buildSalienceContext(signature, result.queryClass, details);
// ============================================================

// Duck-typed interface — avoids @anthropic-ai/sdk dependency.
// The chat route uses Zima (OpenAI-compatible); Stage 2 AI classification
// is optional and only runs when a compatible client is passed explicitly.
interface AnthropicLike {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string }>;
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

// ============================================================
// TYPES
// ============================================================

export type QueryClass =
  | "timing_marriage"          // When will I get married / relationship timing
  | "timing_career"            // When will I get a job / promotion / career shift
  | "timing_general"           // When will X happen (generic timing)
  | "timing_yearly"            // What will happen in [year] / yearly prediction
  | "identity_core"            // Who am I / personality / life purpose / dharma
  | "identity_contradiction"   // Why do I keep doing X / inner conflict
  | "relationship_partner"     // What is my partner/spouse like / spouse reading
  | "relationship_compatibility" // Are we compatible / synastry
  | "career_direction"         // What career suits me / professional path
  | "health"                   // Health patterns / body / wellness
  | "fact_mode"                // Give me specific facts / list things about me
  | "technical_mode"           // Show me my chart / technical astrological analysis
  | "spiritual_dharma"         // Karma / past life / spiritual path / moksha
  | "general"                  // Catch-all for unclear or conversational queries

export type ModelTier = "haiku" | "sonnet" | "opus"

export interface ClassificationResult {
  queryClass: QueryClass
  confidence: number           // 0–1
  modelTier: ModelTier         // Which model to use for the response
  tokenBudget: number          // Max tokens for context injection
  classifiedBy: "pattern" | "ai" // Which stage classified it
  subIntent?: string           // Additional nuance (e.g. "wants timing window")
}

// ============================================================
// MODEL ROUTING TABLE
// Maps each query class to the appropriate model and token budget.
// Haiku for simple/fast, Sonnet for most readings, Opus for deep.
// ============================================================

const MODEL_ROUTING: Record<QueryClass, { tier: ModelTier; tokens: number }> = {
  timing_marriage:           { tier: "sonnet", tokens: 5000 },
  timing_career:             { tier: "sonnet", tokens: 4500 },
  timing_general:            { tier: "sonnet", tokens: 4000 },
  timing_yearly:             { tier: "sonnet",   tokens: 6000 },
  identity_core:             { tier: "sonnet",   tokens: 6000 },
  identity_contradiction:    { tier: "opus",   tokens: 6000 },
  relationship_partner:      { tier: "sonnet", tokens: 5500 },
  relationship_compatibility:{ tier: "sonnet", tokens: 5500 },
  career_direction:          { tier: "sonnet", tokens: 5000 },
  health:                    { tier: "sonnet", tokens: 4000 },
  fact_mode:                 { tier: "sonnet", tokens: 4000 },
  technical_mode:            { tier: "sonnet", tokens: 8000 }, // Full chart needed
  spiritual_dharma:          { tier: "opus",   tokens: 6000 },
  general:                   { tier: "sonnet", tokens: 4000 },
}

// ============================================================
// STAGE 1: DETERMINISTIC PATTERN MATCHING
// Handles ~75% of queries with zero AI cost.
// Each pattern has: regex triggers + negative filters + confidence.
// ============================================================

interface PatternRule {
  queryClass: QueryClass
  confidence: number
  // Returns true if this message matches this pattern
  match: (msg: string, history: string) => boolean
}

const PATTERN_RULES: PatternRule[] = [

  // ── MARRIAGE / RELATIONSHIP TIMING ──────────────────────────
  {
    queryClass: "timing_marriage",
    confidence: 0.95,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(when|will i|am i going to|shall i)\b/.test(m) &&
        /\b(marr|wed|engag|partner|husband|wife|shaadi|vivah)\b/.test(m)
      ) || (
        /\b(marriage|wedding)\b/.test(m) &&
        /\b(when|timing|year|soon|happen|time)\b/.test(m)
      ) || (
        /\bget married\b/.test(m)
      )
    },
  },

  // ── YEARLY PREDICTION ────────────────────────────────────────
  {
    queryClass: "timing_yearly",
    confidence: 0.95,
    match: (msg) => {
      const m = msg.toLowerCase()
      // Matches "2025", "2026", "this year", "next year", "year prediction"
      return (
        /\b20[2-3][0-9]\b/.test(m) &&
        /\b(predict|forecast|year|happen|expect|look like|what|how)\b/.test(m)
      ) || (
        /\b(this year|next year|coming year|year ahead)\b/.test(m) &&
        /\b(predict|forecast|happen|expect|what|how|going)\b/.test(m)
      ) || (
        /\byearly (prediction|reading|report|forecast)\b/.test(m)
      )
    },
  },

  // ── CAREER TIMING ────────────────────────────────────────────
  {
    queryClass: "timing_career",
    confidence: 0.92,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(when|will i|am i going to)\b/.test(m) &&
        /\b(job|career|promotion|business|work|profession|success|naukri)\b/.test(m)
      ) || (
        /\b(career|job|promotion|business)\b/.test(m) &&
        /\b(timing|when|time|year|soon|change|shift|new)\b/.test(m)
      )
    },
  },

  // ── GENERAL TIMING ───────────────────────────────────────────
  {
    queryClass: "timing_general",
    confidence: 0.82,
    match: (msg) => {
      const m = msg.toLowerCase()
      // "when will" + something that isn't marriage or career
      return (
        /\bwhen will\b/.test(m) &&
        !/\b(marr|wed|job|career|promot)\b/.test(m)
      ) || (
        /\b(dasha|antardasha|mahadasha|transit|current period|going on)\b/.test(m)
      )
    },
  },

  // ── SPOUSE / PARTNER READING ─────────────────────────────────
  {
    queryClass: "relationship_partner",
    confidence: 0.93,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(spouse|husband|wife|partner|life partner)\b/.test(m) &&
        /\b(like|be|describe|tell|look|type|nature|character|personality|what kind)\b/.test(m)
      ) || (
        /\b(what|who|how)\b/.test(m) &&
        /\bmy (future )?(spouse|husband|wife|partner)\b/.test(m)
      ) || (
        /\b(7th house|seventh house|darakaraka)\b/.test(m) &&
        !/\btechnical\b/.test(m)
      )
    },
  },

  // ── COMPATIBILITY ────────────────────────────────────────────
  {
    queryClass: "relationship_compatibility",
    confidence: 0.92,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(compat|synastry|match|suitable|good match|right for me)\b/.test(m)
      ) || (
        /\b(are we|is (he|she|they))\b/.test(m) &&
        /\b(compat|right|good|suitable|match)\b/.test(m)
      ) || (
        /\b(relationship|love|partner)\b/.test(m) &&
        /\b(compat|match|right|suitable)\b/.test(m)
      )
    },
  },

  // ── IDENTITY / CORE SELF ──────────────────────────────────────
  {
    queryClass: "identity_core",
    confidence: 0.88,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(who am i|what am i like|my personality|my nature|my character)\b/.test(m)
      ) || (
        /\b(life purpose|purpose|calling|dharma|what am i here for|why am i here)\b/.test(m)
      ) || (
        /\b(tell me about (myself|me)|describe me|what (do you see|can you see) in my chart)\b/.test(m)
      ) || (
        /\b(lagna|ascendant|rising sign)\b/.test(m) &&
        !/\b(technical|house|degree|calculation)\b/.test(m)
      )
    },
  },

  // ── INNER CONFLICT / CONTRADICTION ───────────────────────────
  {
    queryClass: "identity_contradiction",
    confidence: 0.87,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\bwhy do i (keep|always|repeatedly|often)\b/.test(m)
      ) || (
        /\b(pattern|repeat|cycle|same mistake|same situation|over and over)\b/.test(m) &&
        /\b(why|what|how|understand)\b/.test(m)
      ) || (
        /\b(inner conflict|torn|divided|conflicted|contradictory)\b/.test(m)
      ) || (
        /\b(self.sabotage|sabotaging|holding (me|myself) back)\b/.test(m)
      )
    },
  },

  // ── CAREER DIRECTION ─────────────────────────────────────────
  {
    queryClass: "career_direction",
    confidence: 0.88,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(what career|which career|career path|profession|field|industry)\b/.test(m) &&
        /\b(suit|right|best|good|for me|should i)\b/.test(m)
      ) || (
        /\b(10th house|tenth house|karma)\b/.test(m) &&
        /\b(career|work|profession|job)\b/.test(m) &&
        !/\btechnical\b/.test(m)
      ) || (
        /\b(what (should|shall) i do|which (field|domain|area))\b/.test(m) &&
        /\b(career|work|job|professionally)\b/.test(m)
      )
    },
  },

  // ── HEALTH ───────────────────────────────────────────────────
  {
    queryClass: "health",
    confidence: 0.90,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(health|body|illness|disease|medical|physical|fitness)\b/.test(m) &&
        /\b(chart|planetary|indicate|astrology|what|how|why)\b/.test(m)
      ) || (
        /\b(6th house|8th house|1st house)\b/.test(m) &&
        /\b(health|body|illness|disease)\b/.test(m)
      )
    },
  },

  // ── FACT MODE ────────────────────────────────────────────────
  {
    queryClass: "fact_mode",
    confidence: 0.90,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(give me|tell me|list|what are)\b/.test(m) &&
        /\b(specific|facts|things about me|observations|traits|characteristics)\b/.test(m)
      ) || (
        /\b(specific things|10 things|5 things|facts about)\b/.test(m)
      ) || (
        /\b(numbered|list of|bullet)\b/.test(m) &&
        /\b(observations|facts|traits|things)\b/.test(m)
      )
    },
  },

  // ── TECHNICAL MODE ───────────────────────────────────────────
  {
    queryClass: "technical_mode",
    confidence: 0.93,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(technical|chart details|show me my chart|planetary positions|house lords|nakshatra|pada|shadbala|ashtakavarga)\b/.test(m)
      ) || (
        /\b(explain (the |my )?(chart|placement|conjunction|aspect|yoga|dasha))\b/.test(m) &&
        /\b(technically|astrologically|in detail)\b/.test(m)
      ) || (
        /\b(what (degree|sign|house|rashi) is\b)\b/.test(m)
      )
    },
  },

  // ── SPIRITUAL / DHARMA ───────────────────────────────────────
  {
    queryClass: "spiritual_dharma",
    confidence: 0.87,
    match: (msg) => {
      const m = msg.toLowerCase()
      return (
        /\b(karma|past life|previous life|soul|atma|spiritual path|moksha|liberation)\b/.test(m)
      ) || (
        /\b(ketu|rahu|nodes)\b/.test(m) &&
        /\b(karma|past|soul|spiritual|lesson|purpose)\b/.test(m)
      ) || (
        /\b(what is my (karma|soul purpose|spiritual lesson|past life))\b/.test(m)
      )
    },
  },
]

// ============================================================
// CONVERSATION HISTORY SUMMARIZER
// Extracts last N turns for context in AI classification.
// ============================================================

function summarizeHistory(history: Array<{ role: string; content: string }>, maxTurns = 3): string {
  if (!history.length) return ""
  const recent = history.slice(-maxTurns * 2)
  return recent
    .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 200)}`)
    .join("\n")
}

// ============================================================
// STAGE 2: AI CLASSIFICATION (Haiku — fast and cheap)
// Only called when Stage 1 doesn't produce high-confidence match.
// ============================================================

async function classifyWithAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  client: AnthropicLike
): Promise<{ queryClass: QueryClass; confidence: number; subIntent?: string }> {

  const historyContext = summarizeHistory(conversationHistory)

  const prompt = `You are classifying an astrology app user message into exactly one category.

CATEGORIES:
- timing_marriage: questions about when marriage/relationship will happen
- timing_career: questions about when job/career events will happen  
- timing_general: when will X happen (not marriage or career)
- timing_yearly: predictions for a specific year
- identity_core: who am I, personality, life purpose, dharma
- identity_contradiction: why do I keep doing X, inner patterns, self-sabotage
- relationship_partner: what is my spouse/partner like
- relationship_compatibility: are we compatible, synastry
- career_direction: what career suits me, professional path
- health: health patterns in the chart
- fact_mode: give me specific facts/observations/list about me
- technical_mode: show chart details, technical astrological analysis
- spiritual_dharma: karma, past life, spiritual path, moksha
- general: conversational, unclear, or doesn't fit above

${historyContext ? `Recent conversation:\n${historyContext}\n` : ""}

User message: "${message}"

Respond with ONLY a JSON object, no other text:
{"queryClass": "...", "confidence": 0.0-1.0, "subIntent": "one short phrase about what specifically they want"}`

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content[0]?.type === "text" ? (response.content[0].text ?? "") : ""

  try {
    const parsed = JSON.parse(text.trim())
    return {
      queryClass: (parsed.queryClass as QueryClass) ?? "general",
      confidence: Number(parsed.confidence ?? 0.7),
      subIntent: parsed.subIntent,
    }
  } catch {
    return { queryClass: "general", confidence: 0.5 }
  }
}

// ============================================================
// MAIN CLASSIFIER
// ============================================================

/**
 * Classifies a user message into a QueryClass.
 * Stage 1: deterministic pattern matching (fast, free)
 * Stage 2: Haiku AI fallback for ambiguous messages (only when needed)
 *
 * @param message            — the user's current message
 * @param conversationHistory — previous turns for context
 * @param client              — Anthropic client (only used if Stage 2 needed)
 *
 * Usage in API route:
 *   const result = await classifyQuery(message, history, anthropicClient)
 *   const context = buildSalienceContext(signature, result.queryClass, details)
 */
export async function classifyQuery(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  client?: AnthropicLike
): Promise<ClassificationResult> {

  const normalizedMsg = message.trim().toLowerCase()

  // ── Stage 1: Pattern matching ─────────────────────────────
  let bestMatch: PatternRule | null = null
  let bestConfidence = 0

  for (const rule of PATTERN_RULES) {
    if (rule.match(normalizedMsg, summarizeHistory(conversationHistory))) {
      if (rule.confidence > bestConfidence) {
        bestConfidence = rule.confidence
        bestMatch = rule
      }
    }
  }

  // High-confidence pattern match — return immediately
  if (bestMatch && bestConfidence >= 0.85) {
    const routing = MODEL_ROUTING[bestMatch.queryClass]
    return {
      queryClass: bestMatch.queryClass,
      confidence: bestConfidence,
      modelTier: routing.tier,
      tokenBudget: routing.tokens,
      classifiedBy: "pattern",
    }
  }

  // Medium-confidence match — use it but note lower confidence
  if (bestMatch && bestConfidence >= 0.70) {
    const routing = MODEL_ROUTING[bestMatch.queryClass]
    return {
      queryClass: bestMatch.queryClass,
      confidence: bestConfidence,
      modelTier: routing.tier,
      tokenBudget: routing.tokens,
      classifiedBy: "pattern",
    }
  }

  // ── Stage 2: AI fallback ──────────────────────────────────
  if (client) {
    try {
      const aiResult = await classifyWithAI(message, conversationHistory, client)
      const routing = MODEL_ROUTING[aiResult.queryClass]
      return {
        queryClass: aiResult.queryClass,
        confidence: aiResult.confidence,
        modelTier: routing.tier,
        tokenBudget: routing.tokens,
        classifiedBy: "ai",
        subIntent: aiResult.subIntent,
      }
    } catch (err) {
      console.error("[queryClassifier] AI fallback failed:", err)
    }
  }

  // ── Final fallback: general ───────────────────────────────
  return {
    queryClass: "general",
    confidence: 0.5,
    modelTier: "sonnet",
    tokenBudget: 4000,
    classifiedBy: "pattern",
  }
}

// ============================================================
// PROTOCOL MAP
// Each query class maps to its specific reading protocol.
// Injected into the system prompt by contextBuilder.ts.
// ============================================================

export const QUERY_PROTOCOLS: Record<QueryClass, string> = {

  timing_marriage: `
PROTOCOL: MARRIAGE TIMING
Step 1 — Check timing confluence: is marriage confidence above 0.6? If not, say so directly.
Step 2 — State the window clearly. Give the quality of that window — what the relationship forming in it will be like.
Step 3 — Give 2-3 partner observations from the pre-computed partner signature.
Step 4 — Name the shadow pattern that will show up in that relationship.
Do not hedge. If the chart doesn't support marriage in the near term, say that clearly and explain why.
`.trim(),

  timing_career: `
PROTOCOL: CAREER TIMING
Step 1 — Check career_shift timing confluence. State confidence level.
Step 2 — Name the active career houses and what they mean in plain terms.
Step 3 — Describe the quality of the period — what it asks and what it makes possible.
Step 4 — One observation about the career domain's natal condition.
`.trim(),

  timing_general: `
PROTOCOL: GENERAL TIMING
Step 1 — Identify which houses are currently activated (from active_houses).
Step 2 — Cross-reference: which of these are activated by BOTH dasha AND transit?
Step 3 — Those intersections are the confirmed themes. Speak only from those.
Step 4 — Give the quality of the timing window — not a prediction, a texture.
`.trim(),

  timing_yearly: `
PROTOCOL: YEARLY PREDICTION
Maximum 4 confirmed themes. Each theme must appear in BOTH transit and dasha layers.
Opening: dominant intersection in plain language (2-3 sentences).
Body: 3-4 themes, 80-120 words each — situation, timing quality, what it asks.
Close: the year's arc in 3-4 sentences.
Total: 400-600 words. No vague encouragement. No themes that don't pass the intersection test.
`.trim(),

  identity_core: `
PROTOCOL: IDENTITY READING
Lead from the dominant axis — the highest-confidence observation first.
Then the primary behavioral contradiction.
Then the timing layer — what the current period is asking of this specific identity.
Each observation must be specific enough that it wouldn't apply to most people.
End with what this period is asking of this person — not advice, an observation.
`.trim(),

  identity_contradiction: `
PROTOCOL: INNER CONTRADICTION
The person is asking why they keep repeating a pattern. Answer it directly.
Lead with the contradiction: name drive 1, name drive 2, name the behavioral result.
Explain why the chart creates this specific tension — not as fate but as structure.
Do not pathologize. Do not offer a solution. Describe the architecture precisely.
The person should feel seen, not diagnosed.
`.trim(),

  relationship_partner: `
PROTOCOL: PARTNER READING
Use all 7 layers from the pre-computed partner signature. One observation per layer minimum.
Layer 1 (core wound/gift), Layer 2 (second personality), Layer 3 (traits in relationship),
Layer 4 (recurring dynamic), Layer 5 (soul archetype), Layer 6 (love pattern), Layer 7 (emotional texture).
Do not hedge. Do not say "I cannot know another person." Read the signature.
Name the shadow without dramatizing. Name the gift without flattering.
`.trim(),

  relationship_compatibility: `
PROTOCOL: COMPATIBILITY
Focus on the DYNAMIC that forms between these two charts — not a compatibility score.
What is the recurring pattern in this pairing?
Where does each person's shadow activate the other's?
Where does each person's gift support the other's?
Name the structural challenge of this combination.
Name the structural strength.
`.trim(),

  career_direction: `
PROTOCOL: CAREER DIRECTION
Lead with what the chart structurally supports — not what sounds good, what is actually indicated.
Name the domains of work, the working style, the relationship to authority.
Name the career shadow — what consistently gets in the way.
Name the period's specific implication for career.
End with one practical observation about what to move toward and what to stop doing.
`.trim(),

  health: `
PROTOCOL: HEALTH
Do not predict illness. Describe the health patterns and sensitivities.
Name the body systems under most planetary pressure.
Name the period's implications for health — what requires more attention now.
Always include: the chart indicates tendencies, not certainties. Recommend professional guidance.
`.trim(),

  fact_mode: `
PROTOCOL: FACT MODE
Give numbered, specific observations. Each from a DIFFERENT chart layer.
Each observation specific enough that it would NOT apply to most people.
Minimum 7, maximum 12. No padding. If the chart only gives you 8 genuinely specific facts, give 8.
Every fact must be falsifiable — specific enough that someone could say "that's not me."
`.trim(),

  technical_mode: `
PROTOCOL: TECHNICAL MODE
The user wants to see the astrology. Use technical language freely.
Name planets, houses, nakshatras, dashas, aspects as needed.
Be precise about degrees, dignities, and chain analysis.
This is the one mode where the astrological machinery surfaces.
`.trim(),

  spiritual_dharma: `
PROTOCOL: SPIRITUAL / DHARMA
This is the deepest layer. Work from the nodal axis first.
Rahu house = the direction of soul growth in this life.
Ketu house = the place of release, completion, past mastery.
Then the atmakaraka — the soul's primary lesson.
Speak in the language of experience, not doctrine. No spiritual performance.
`.trim(),

  general: `
PROTOCOL: GENERAL
Answer what was asked. Use the dominant axis and current timing as the foundation.
Keep it grounded and specific. Do not over-read the question.
If the question is conversational, respond conversationally.
`.trim(),
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Returns true if this query class needs the full partner signature injected.
 */
export function needsPartnerSignature(qc: QueryClass): boolean {
  return ["timing_marriage", "relationship_partner", "relationship_compatibility"].includes(qc)
}

/**
 * Returns true if this query class needs deep timing analysis injected.
 */
export function needsTimingAnalysis(qc: QueryClass): boolean {
  return qc.startsWith("timing_") || qc === "identity_core"
}

/**
 * Returns true if this query class needs the full chart data (technical mode).
 */
export function needsFullChart(qc: QueryClass): boolean {
  return qc === "technical_mode"
}

/**
 * Returns true if this query class should use Opus.
 */
export function isDeepQuery(qc: QueryClass): boolean {
  return MODEL_ROUTING[qc].tier === "opus"
}

/**
 * Maps model tier to actual Anthropic model string.
 */
export function resolveModel(tier: ModelTier): string {
  switch (tier) {
    case "haiku":  return "claude-haiku-4.5"
    case "sonnet": return "claude-sonnet-4.5"
    case "opus":   return "claude-opus-4.5"
    default:       return "claude-sonnet-4.5"
  }
}
// ============================================================
// CONVERSATION-LEVEL CONTEXT EXTRACTOR
// Extracts what the user actually cares about from history.
// Used to bias classification and context building.
// ============================================================

export interface ConversationContext {
  dominantTheme: QueryClass | null   // What they've mostly been asking about
  mentionedTopics: string[]          // Specific topics that came up
  hasSharedLifeContext: boolean      // Did they share personal details?
  turnCount: number
}

export function extractConversationContext(
  history: Array<{ role: string; content: string }>
): ConversationContext {

  const userMessages = history
    .filter(m => m.role === "user")
    .map(m => m.content.toLowerCase())

  const allText = userMessages.join(" ")

  // Count topic mentions
  const topicCounts: Partial<Record<QueryClass, number>> = {}
  for (const rule of PATTERN_RULES) {
    const count = userMessages.filter(m =>
      rule.match(m, "")
    ).length
    if (count > 0) {
      topicCounts[rule.queryClass] = (topicCounts[rule.queryClass] ?? 0) + count
    }
  }

  // Find dominant theme
  let dominantTheme: QueryClass | null = null
  let maxCount = 0
  for (const [qc, count] of Object.entries(topicCounts)) {
    if ((count ?? 0) > maxCount) {
      maxCount = count ?? 0
      dominantTheme = qc as QueryClass
    }
  }

  // Extract mentioned topics
  const mentionedTopics: string[] = []
  if (/\b(job|career|work|business)\b/.test(allText)) mentionedTopics.push("career")
  if (/\b(marr|relationship|partner|love)\b/.test(allText)) mentionedTopics.push("relationship")
  if (/\b(child|children|baby|pregnancy)\b/.test(allText)) mentionedTopics.push("children")
  if (/\b(health|illness|disease|body)\b/.test(allText)) mentionedTopics.push("health")
  if (/\b(money|wealth|finance|income)\b/.test(allText)) mentionedTopics.push("finances")
  if (/\b(spiritual|karma|soul|dharma)\b/.test(allText)) mentionedTopics.push("spiritual")
  if (/\b(family|parents|mother|father)\b/.test(allText)) mentionedTopics.push("family")

  // Has the user shared personal life context?
  const hasSharedLifeContext = (
    /\b(i am|i'm|i have|i work|i live|my (job|wife|husband|partner|child|mother|father))\b/.test(allText)
  )

  return {
    dominantTheme,
    mentionedTopics,
    hasSharedLifeContext,
    turnCount: history.filter(m => m.role === "user").length,
  }
}