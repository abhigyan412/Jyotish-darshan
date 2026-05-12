// ============================================================
// memory.ts
// Per-chart session intelligence that compounds across conversations.
// This is what makes session 6 sharper than session 1.
//
// Three jobs:
//   1. READ  — load accumulated memory before building context
//   2. WRITE — update memory after each exchange
//   3. CALIBRATE — adjust confidence based on user feedback signals
//
// Memory persists in chart_memory table (Supabase).
// One row per chart. Updated after every assistant message.
//
// What gets stored:
//   confirmedObservations — what has landed accurately
//   questionHistory       — what the user actually cares about
//   readingsGiven         — what was said (prevents repetition)
//   lifeContext           — personal details they've shared
//   calibrationScore      — are our readings hitting or missing?
//
// What this enables:
//   - Never repeating an observation already made
//   - Building on confirmed accurate observations
//   - Knowing which life domains matter to this user
//   - Adjusting specificity when readings aren't landing
// ============================================================

import { supabaseAdmin } from "@/lib/supabase-server"
import type { QueryClass } from "./queryClassifier"

// ============================================================
// TYPES
// ============================================================

export interface ConfirmedObservation {
  observation: string
  confirmedAt: string              // ISO timestamp
  confirmationType: "explicit" | "implicit" | "elaborated"
  // explicit   = user said "that's accurate" or "yes exactly"
  // implicit   = user engaged deeply, asked follow-up on it
  // elaborated = user added detail ("yes and also...")
  category: string                  // which life domain
}

export interface QuestionRecord {
  question: string
  category: QueryClass
  askedAt: string
  answered: boolean
}

export interface ReadingRecord {
  category: QueryClass
  keyPoints: string[]              // 2-3 sentence summary of what was said
  givenAt: string
  qualityScore?: number
}

export interface LifeContext {
  relationshipStatus?: string      // "single" | "in relationship" | "married" | "divorced"
  careerDomain?: string            // "tech" | "medicine" | "arts" | "business" | etc.
  currentChallenge?: string        // What they're actively dealing with
  location?: string                // City/country if shared
  ageRange?: string                // "20s" | "30s" | etc. if mentioned
  hasChildren?: boolean
  additionalContext?: Record<string, string>  // Anything else specific
}

export interface ChartMemory {
  id?: string
  chartId: string
  userId: string
  confirmedObservations: ConfirmedObservation[]
  questionHistory: QuestionRecord[]
  readingsGiven: ReadingRecord[]
  lifeContext: LifeContext
  calibrationScore: number         // 0–1, starts at 0.5
  updatedAt: string
}

export interface MemoryUpdateInput {
  chartId: string
  userId: string
  userMessage: string
  assistantResponse: string
  queryClass: QueryClass
  feedbackSignal?: "accurate" | "off" | "more" | null
  qualityScore?: number
}

// ============================================================
// SUPABASE OPERATIONS
// ============================================================

/**
 * Load chart memory from Supabase.
 * Returns null if no memory exists yet (first session).
 */
export async function loadMemory(chartId: string): Promise<ChartMemory | null> {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from("chart_memory")
    .select("*")
    .eq("chart_id", chartId)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    chartId: data.chart_id,
    userId: data.user_id,
    confirmedObservations: data.confirmed_observations ?? [],
    questionHistory:       data.question_history ?? [],
    readingsGiven:         data.readings_given ?? [],
    lifeContext:           data.life_context ?? {},
    calibrationScore:      data.calibration_score ?? 0.5,
    updatedAt:             data.updated_at,
  }
}

/**
 * Initialize memory for a new chart.
 * Call this when a chart is first created.
 */
export async function initializeMemory(chartId: string, userId: string): Promise<ChartMemory> {
  const supabase = supabaseAdmin

  const fresh: Omit<ChartMemory, "id"> = {
    chartId,
    userId,
    confirmedObservations: [],
    questionHistory:       [],
    readingsGiven:         [],
    lifeContext:           {},
    calibrationScore:      0.5,
    updatedAt:             new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("chart_memory")
    .insert({
      chart_id:               chartId,
      user_id:                userId,
      confirmed_observations: fresh.confirmedObservations,
      question_history:       fresh.questionHistory,
      readings_given:         fresh.readingsGiven,
      life_context:           fresh.lifeContext,
      calibration_score:      fresh.calibrationScore,
      updated_at:             fresh.updatedAt,
    })
    .select()
    .single()

  if (error) {
    console.error("[memory] Failed to initialize:", error)
    return fresh
  }

  return { ...fresh, id: data.id }
}

/**
 * Save updated memory to Supabase.
 */
async function saveMemory(memory: ChartMemory): Promise<void> {
  const supabase = supabaseAdmin

  const { error } = await supabase
    .from("chart_memory")
    .upsert({
      chart_id:               memory.chartId,
      user_id:                memory.userId,
      confirmed_observations: memory.confirmedObservations,
      question_history:       memory.questionHistory,
      readings_given:         memory.readingsGiven,
      life_context:           memory.lifeContext,
      calibration_score:      memory.calibrationScore,
      updated_at:             new Date().toISOString(),
    }, { onConflict: "chart_id" })

  if (error) {
    console.error("[memory] Failed to save:", error)
  }
}

// ============================================================
// SIGNAL DETECTION
// Extracts implicit signals from user messages.
// ============================================================

interface DetectedSignals {
  confirmationSignal: "accurate" | "off" | "elaborated" | "neutral"
  lifeContextUpdates: Partial<LifeContext>
  impliedTopics: string[]
}

/**
 * Detects implicit signals in a user message.
 * No AI needed — pure pattern matching.
 */
function detectSignals(userMessage: string): DetectedSignals {
  const m = userMessage.toLowerCase().trim()

  // ── Confirmation / rejection signals ──────────────────
  let confirmationSignal: DetectedSignals["confirmationSignal"] = "neutral"

  const ACCURATE_SIGNALS = [
    "yes", "yeah", "exactly", "that's right", "that's accurate", "so true",
    "wow", "how did you know", "that's me", "totally", "absolutely",
    "spot on", "100%", "you nailed it", "this is accurate", "this is true",
    "true", "correct", "you're right", "omg", "that resonates",
    "this is so me", "i feel seen", "that's exactly", "precisely",
  ]

  const OFF_SIGNALS = [
    "no", "not really", "not accurate", "that's wrong", "i don't think so",
    "not me", "doesn't fit", "not true", "incorrect", "that's not right",
    "doesn't resonate", "not quite", "i disagree", "that's not how",
    "this doesn't apply",
  ]

  const ELABORATED_SIGNALS = [
    "yes and", "yes but", "that's true and", "exactly and",
    "yes especially", "that's right and also", "yes, particularly",
    "that's accurate but", "true, though",
  ]

  if (ELABORATED_SIGNALS.some(s => m.startsWith(s) || m.includes(s))) {
    confirmationSignal = "elaborated"
  } else if (ACCURATE_SIGNALS.some(s => {
    // Check if it's a standalone confirmation or starts the message
    return m === s || m.startsWith(s + " ") || m.startsWith(s + ",") || m.startsWith(s + "!")
  })) {
    confirmationSignal = "accurate"
  } else if (OFF_SIGNALS.some(s => {
    return m === s || m.startsWith(s + " ") || m.startsWith(s + ",")
  })) {
    confirmationSignal = "off"
  }

  // ── Life context extraction ────────────────────────────
  const lifeContextUpdates: Partial<LifeContext> = {}

  // Relationship status
  if (/\b(i am single|i'm single|not in a relationship|no partner)\b/.test(m)) {
    lifeContextUpdates.relationshipStatus = "single"
  } else if (/\b(i am married|i'm married|my (wife|husband))\b/.test(m)) {
    lifeContextUpdates.relationshipStatus = "married"
  } else if (/\b(i am in a relationship|i'm in a relationship|my partner|my boyfriend|my girlfriend)\b/.test(m)) {
    lifeContextUpdates.relationshipStatus = "in relationship"
  } else if (/\b(divorced|separated|recently broke up|just broke up)\b/.test(m)) {
    lifeContextUpdates.relationshipStatus = "single (recently ended)"
  }

  // Career domain
  if (/\b(i work in (tech|software|engineering|it|technology))\b/.test(m) ||
      /\b(i am a (developer|engineer|programmer|coder))\b/.test(m)) {
    lifeContextUpdates.careerDomain = "technology"
  } else if (/\b(i work in (medicine|healthcare|hospital|doctor|medical))\b/.test(m) ||
             /\b(i am a (doctor|nurse|physician|surgeon))\b/.test(m)) {
    lifeContextUpdates.careerDomain = "medicine"
  } else if (/\b(i work in (business|finance|banking|investment))\b/.test(m) ||
             /\b(i am a (businessman|entrepreneur|banker|investor))\b/.test(m)) {
    lifeContextUpdates.careerDomain = "business"
  } else if (/\b(i work in (art|design|creative|music|film|writing))\b/.test(m) ||
             /\b(i am a (artist|designer|musician|writer|filmmaker))\b/.test(m)) {
    lifeContextUpdates.careerDomain = "arts"
  } else if (/\b(i teach|i am a teacher|professor|academic|education)\b/.test(m)) {
    lifeContextUpdates.careerDomain = "education"
  }

  // Age range
  if (/\b(i am|i'm) (in my )?(early |late |mid-)?20s?\b/.test(m)) {
    lifeContextUpdates.ageRange = "20s"
  } else if (/\b(i am|i'm) (in my )?(early |late |mid-)?30s?\b/.test(m)) {
    lifeContextUpdates.ageRange = "30s"
  } else if (/\b(i am|i'm) (in my )?(early |late |mid-)?40s?\b/.test(m)) {
    lifeContextUpdates.ageRange = "40s"
  } else if (/\b(i am|i'm) (\d{2}) years? old\b/.test(m)) {
    const age = parseInt(m.match(/(\d{2}) years? old/)?.[1] ?? "0")
    if (age >= 20 && age < 30) lifeContextUpdates.ageRange = "20s"
    else if (age >= 30 && age < 40) lifeContextUpdates.ageRange = "30s"
    else if (age >= 40 && age < 50) lifeContextUpdates.ageRange = "40s"
    else if (age >= 50) lifeContextUpdates.ageRange = "50s+"
  }

  // Children
  if (/\b(i have (a |two |three )?(child|children|kids|son|daughter))\b/.test(m)) {
    lifeContextUpdates.hasChildren = true
  }

  // Current challenge
  if (/\b(struggling with|dealing with|going through|facing)\b/.test(m)) {
    // Extract the challenge context (first 80 chars after the trigger)
    const match = m.match(/(?:struggling with|dealing with|going through|facing)\s+(.{10,80})/)
    if (match) {
      lifeContextUpdates.currentChallenge = match[1].replace(/[.,!?].*$/, "").trim()
    }
  }

  // ── Implied topics ─────────────────────────────────────
  const impliedTopics: string[] = []
  if (/\b(job|work|career|business|promotion|office)\b/.test(m)) impliedTopics.push("career")
  if (/\b(marr|partner|relationship|love|dating)\b/.test(m)) impliedTopics.push("relationship")
  if (/\b(money|wealth|finance|income|salary)\b/.test(m)) impliedTopics.push("finances")
  if (/\b(health|body|illness|energy|tired)\b/.test(m)) impliedTopics.push("health")
  if (/\b(child|children|baby|pregnant|parent)\b/.test(m)) impliedTopics.push("children")
  if (/\b(move|relocate|travel|foreign|abroad)\b/.test(m)) impliedTopics.push("travel")

  return { confirmationSignal, lifeContextUpdates, impliedTopics }
}

// ============================================================
// KEY POINT EXTRACTOR
// Pulls 2-3 key points from an assistant response for storage.
// Used to prevent observation repetition across sessions.
// No AI — deterministic sentence extraction.
// ============================================================

function extractKeyPoints(response: string): string[] {
  // Split into sentences
  const sentences = response
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 300)

  if (sentences.length === 0) return [response.slice(0, 200)]

  // Take first sentence, one from the middle, one near end
  const keyPoints: string[] = []

  keyPoints.push(sentences[0])

  if (sentences.length > 4) {
    const midIdx = Math.floor(sentences.length / 2)
    keyPoints.push(sentences[midIdx])
  }

  if (sentences.length > 2) {
    keyPoints.push(sentences[sentences.length - 1])
  }

  return keyPoints.slice(0, 3)
}

// ============================================================
// CALIBRATION UPDATER
// Adjusts the calibration score based on feedback signals.
// ============================================================

function updateCalibration(
  currentScore: number,
  signal: "accurate" | "off" | "elaborated" | "more" | "neutral"
): number {
  const LEARNING_RATE = 0.08

  let adjustment = 0
  switch (signal) {
    case "accurate":   adjustment = +LEARNING_RATE;       break  // Strong positive
    case "elaborated": adjustment = +LEARNING_RATE * 0.6; break  // Moderate positive
    case "more":       adjustment = +LEARNING_RATE * 0.3; break  // Mild positive
    case "off":        adjustment = -LEARNING_RATE;       break  // Negative
    case "neutral":    adjustment = 0;                    break  // No change
  }

  const newScore = currentScore + adjustment
  return Math.max(0.1, Math.min(0.95, Math.round(newScore * 1000) / 1000))
}

// ============================================================
// MEMORY PRUNER
// Keeps memory size manageable by pruning old/low-value entries.
// Called before saving to prevent unbounded growth.
// ============================================================

function pruneMemory(memory: ChartMemory): ChartMemory {
  const MAX_CONFIRMED    = 20   // Keep last 20 confirmed observations
  const MAX_QUESTIONS    = 50   // Keep last 50 questions
  const MAX_READINGS     = 15   // Keep last 15 readings given

  return {
    ...memory,
    confirmedObservations: memory.confirmedObservations
      .slice(-MAX_CONFIRMED),

    questionHistory: memory.questionHistory
      .slice(-MAX_QUESTIONS),

    readingsGiven: memory.readingsGiven
      .slice(-MAX_READINGS),
  }
}

// ============================================================
// MAIN UPDATE FUNCTION
// Called after every assistant message.
// ============================================================

/**
 * Updates chart memory after an exchange.
 * Call this after streaming completes and the full response is available.
 *
 * @param input — the exchange details
 *
 * Usage after streaming:
 *   const fullResponse = accumulateStream(stream)
 *   await updateMemory({
 *     chartId, userId,
 *     userMessage: message,
 *     assistantResponse: fullResponse,
 *     queryClass: classification.queryClass,
 *     feedbackSignal: null,    // updated later when user clicks feedback
 *     qualityScore: score.score,
 *   })
 */
export async function updateMemory(input: MemoryUpdateInput): Promise<void> {
  const {
    chartId,
    userId,
    userMessage,
    assistantResponse,
    queryClass,
    feedbackSignal,
    qualityScore,
  } = input

  // Load existing memory (or create if first session)
  let memory = await loadMemory(chartId)
  if (!memory) {
    memory = await initializeMemory(chartId, userId)
  }

  const now = new Date().toISOString()
  const signals = detectSignals(userMessage)

  // ── 1. Update life context ─────────────────────────────
  if (Object.keys(signals.lifeContextUpdates).length > 0) {
    memory.lifeContext = {
      ...memory.lifeContext,
      ...signals.lifeContextUpdates,
    }
  }

  // ── 2. Record the question ─────────────────────────────
  memory.questionHistory.push({
    question: userMessage.slice(0, 200),
    category: queryClass,
    askedAt: now,
    answered: true,
  })

  // ── 3. Record the reading given ────────────────────────
  const keyPoints = extractKeyPoints(assistantResponse)
  memory.readingsGiven.push({
    category: queryClass,
    keyPoints,
    givenAt: now,
    qualityScore,
  })

  // ── 4. Handle confirmation signal ─────────────────────
  const effectiveSignal = feedbackSignal ?? signals.confirmationSignal

  if (effectiveSignal === "accurate" || effectiveSignal === "elaborated") {
    // Store the key observation that was confirmed
    // Use the first key point as the representative observation
    const confirmedObs: ConfirmedObservation = {
      observation: keyPoints[0] ?? assistantResponse.slice(0, 200),
      confirmedAt: now,
      confirmationType: effectiveSignal === "elaborated" ? "elaborated" : "explicit",
      category: queryClass,
    }
    memory.confirmedObservations.push(confirmedObs)
  }

  // ── 5. Update calibration ──────────────────────────────
  if (effectiveSignal !== "neutral") {
    memory.calibrationScore = updateCalibration(
      memory.calibrationScore,
      effectiveSignal as "accurate" | "off" | "elaborated" | "more" | "neutral"
    )
  }

  // ── 6. Prune and save ─────────────────────────────────
  memory = pruneMemory(memory)
  await saveMemory(memory)
}

// ============================================================
// FEEDBACK HANDLER
// Called when user clicks [Accurate] / [Off] / [More].
// Updates calibration separately from the message flow.
// ============================================================

/**
 * Updates memory when explicit feedback is received.
 * Call from your feedback API route.
 *
 * @param chartId         — which chart
 * @param userId          — who gave the feedback
 * @param signal          — what they clicked
 * @param observationText — the observation being rated (optional)
 *
 * Usage in /api/feedback/route.ts:
 *   await handleFeedback(chartId, userId, signal, observation)
 */
export async function handleFeedback(
  chartId: string,
  userId: string,
  signal: "accurate" | "off" | "more",
  observationText?: string
): Promise<void> {
  let memory = await loadMemory(chartId)
  if (!memory) {
    memory = await initializeMemory(chartId, userId)
  }

  const now = new Date().toISOString()

  // Update calibration
  memory.calibrationScore = updateCalibration(memory.calibrationScore, signal)

  // Store confirmed observation if accurate
  if (signal === "accurate" && observationText) {
    memory.confirmedObservations.push({
      observation: observationText.slice(0, 300),
      confirmedAt: now,
      confirmationType: "explicit",
      category: "fact_mode", // Default — caller can be more specific
    })
  }

  memory = pruneMemory(memory)
  await saveMemory(memory)
}

// ============================================================
// MEMORY QUERY UTILITIES
// Used by contextBuilder to ask specific questions about memory.
// ============================================================

/**
 * Returns topics this user has asked about most.
 * Used to bias query classification and context selection.
 */
export function getDominantTopics(memory: ChartMemory): QueryClass[] {
  const counts: Partial<Record<QueryClass, number>> = {}

  for (const q of memory.questionHistory) {
    counts[q.category] = (counts[q.category] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .map(([qc]) => qc as QueryClass)
    .slice(0, 3)
}

/**
 * Returns observations already confirmed as accurate.
 * Use to reinforce these in readings without repeating them verbatim.
 */
export function getConfirmedObservations(
  memory: ChartMemory,
  category?: string
): ConfirmedObservation[] {
  if (!category) return memory.confirmedObservations.slice(-10)

  return memory.confirmedObservations
    .filter(o => o.category === category)
    .slice(-5)
}

/**
 * Returns key points from recent readings to prevent repetition.
 * Pass to contextBuilder as "do not repeat these".
 */
export function getRecentKeyPoints(
  memory: ChartMemory,
  queryClass: QueryClass,
  limit: number = 5
): string[] {
  return memory.readingsGiven
    .filter(r => r.category === queryClass)
    .slice(-limit)
    .flatMap(r => r.keyPoints)
}

/**
 * Returns true if a specific topic has been read before.
 * Used to decide whether to go deeper or cover new ground.
 */
export function hasBeenReadBefore(
  memory: ChartMemory,
  queryClass: QueryClass
): boolean {
  return memory.readingsGiven.some(r => r.category === queryClass)
}

/**
 * Returns the calibration status for diagnostic purposes.
 */
export function getCalibrationStatus(memory: ChartMemory): {
  score: number
  status: "sharp" | "average" | "missing"
  recommendation: string
} {
  const score = memory.calibrationScore

  if (score >= 0.75) {
    return {
      score,
      status: "sharp",
      recommendation: "Readings are landing accurately. Maintain current specificity.",
    }
  } else if (score >= 0.45) {
    return {
      score,
      status: "average",
      recommendation: "Mixed results. Try sharper behavioral specificity.",
    }
  } else {
    return {
      score,
      status: "missing",
      recommendation: "Readings are not landing. Go significantly more specific. Avoid archetypes.",
    }
  }
}

/**
 * Builds a compact memory summary string for context injection.
 * Shorter version for when token budget is tight.
 */
export function buildCompactMemorySummary(memory: ChartMemory): string {
  const lines: string[] = []

  const confirmed = memory.confirmedObservations.slice(-3)
  if (confirmed.length > 0) {
    lines.push(`Confirmed accurate: ${confirmed.map(o => o.observation.slice(0, 80)).join(" | ")}`)
  }

  const topics = getDominantTopics(memory)
  if (topics.length > 0) {
    lines.push(`User cares most about: ${topics.join(", ")}`)
  }

  if (memory.lifeContext.relationshipStatus) {
    lines.push(`Relationship: ${memory.lifeContext.relationshipStatus}`)
  }
  if (memory.lifeContext.careerDomain) {
    lines.push(`Career: ${memory.lifeContext.careerDomain}`)
  }

  const cal = getCalibrationStatus(memory)
  if (cal.status !== "average") {
    lines.push(`Calibration note: ${cal.recommendation}`)
  }

  return lines.join("\n")
}