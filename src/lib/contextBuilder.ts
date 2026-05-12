// ============================================================
// contextBuilder.ts
// Assembles the final system prompt for every AI call.
// This is the last step before the Anthropic API is called.
//
// Pipeline this file completes:
//   ChartCalculation
//     → salienceEngine    (ChartSignature)
//     → queryClassifier   (QueryClass + protocol)
//     → contextBuilder    (final system prompt) ← THIS FILE
//     → Anthropic API     (streaming response)
//
// What it assembles (in order):
//   1. Voice prompt        — WHO the AI is (from promptEngine.ts)
//   2. Salience context    — WHAT the chart says (compressed, ranked)
//   3. Query protocol      — HOW to handle this specific question
//   4. Conversation memory — WHAT has been confirmed/asked before
//   5. Quality constraints — WHAT must never appear in output
//
// Token budget enforcement:
//   Full chart (technical_mode): ~8000 tokens
//   Deep reading (opus queries):  ~6000 tokens
//   Standard reading (sonnet):    ~4500 tokens
//   Quick query (haiku):          ~2000 tokens
// ============================================================

import type { KundliChart, BirthDetails } from "@/types"
import type { ChartSignature }            from "./salienceEngine"
import type { QueryClass, ClassificationResult } from "./queryClassifier"
import type { ChartMemory }               from "./memory"
import { buildVoicePrompt, buildChartContext } from "./promptEngine"
import { buildSalienceContext }           from "./salienceEngine"
import { QUERY_PROTOCOLS, needsFullChart, needsPartnerSignature, needsTimingAnalysis } from "./queryClassifier"

// ============================================================
// TYPES
// ============================================================

export interface ContextBuildInput {
  // Chart data
  chart: KundliChart
  birthDetails: BirthDetails
  lagnaRashiIndex: number

  // Pre-computed signal
  signature: ChartSignature

  // Query routing
  classification: ClassificationResult

  // Session state
  conversationHistory: Array<{ role: string; content: string }>
  chartMemory?: ChartMemory | null

  // Optional: full chart context (only for technical_mode)
  // If not provided and needed, will be built from chart
  fullChartContext?: string
}

export interface BuiltContext {
  systemPrompt: string
  estimatedTokens: number
  layersIncluded: string[]
  modelToUse: string
}

// ============================================================
// QUALITY CONSTRAINTS
// These are injected as hard rules at the end of every prompt.
// Short, non-negotiable, specific.
// ============================================================

const QUALITY_CONSTRAINTS = `
── OUTPUT RULES (non-negotiable) ──

NEVER say: Saturn, Jupiter, Mars, Venus, Mercury, Sun, Moon, Rahu, Ketu, Lagna, Rashi, nakshatra, house number, Mahadasha, Antardasha, Vimshottari, pada, trikona, kendra, dusthana — unless the user explicitly asked for technical analysis (technical_mode).

NEVER produce output where the same observation could apply to most people. If you catch yourself writing "you value independence" or "you are sensitive" — that is a failure. Rewrite with behavioral specificity.

ALWAYS include at least one behavioral contradiction — a pattern where two genuine drives collide and create a specific recurring outcome in real life.

ALWAYS translate chart factors into: situations, feelings, behavioral patterns, recurring dynamics, or qualities of time. Never raw astrological statements.

THE TEST before outputting anything: "Could someone with zero astrology knowledge read this and feel precisely, specifically seen?" If not — rewrite.

DO NOT end with open-ended therapy questions ("How does that resonate?", "What do you think?"). End with an observation, a specific implication, or a pointed question that goes somewhere.
`.trim()

// ============================================================
// MEMORY FORMATTER
// Compresses chart memory into a short context block.
// Only most recent and most relevant entries included.
// ============================================================

function formatMemoryContext(memory: ChartMemory | null | undefined): string {
  if (!memory) return ""

  const lines: string[] = ["── ACCUMULATED CHART MEMORY ──"]

  // Confirmed observations (what has landed accurately)
  if (memory.confirmedObservations?.length) {
    lines.push("Observations confirmed accurate by this user:")
    memory.confirmedObservations
      .slice(-5) // Last 5 confirmed
      .forEach(obs => {
        lines.push(`  ✓ ${obs.observation}`)
      })
  }

  // Life context (what they've shared about their life)
  if (memory.lifeContext && Object.keys(memory.lifeContext).length > 0) {
    lines.push("Life context shared:")
    if (memory.lifeContext.relationshipStatus) {
      lines.push(`  Relationship: ${memory.lifeContext.relationshipStatus}`)
    }
    if (memory.lifeContext.careerDomain) {
      lines.push(`  Career domain: ${memory.lifeContext.careerDomain}`)
    }
    if (memory.lifeContext.currentChallenge) {
      lines.push(`  Current challenge: ${memory.lifeContext.currentChallenge}`)
    }
    if (memory.lifeContext.location) {
      lines.push(`  Location: ${memory.lifeContext.location}`)
    }
  }

  // Readings given (prevent repetition)
  if (memory.readingsGiven?.length) {
    const recentReadings = memory.readingsGiven.slice(-3)
    lines.push("Recent readings given (do not repeat these exact observations):")
    recentReadings.forEach(r => {
      lines.push(`  [${r.category}] ${r.keyPoints.slice(0, 2).join(" | ")}`)
    })
  }

  // Calibration note
  if (memory.calibrationScore !== undefined) {
    if (memory.calibrationScore < 0.4) {
      lines.push("⚠ Calibration note: Recent observations have not been landing well for this user. Go sharper and more specific — the current approach is too generic for them.")
    } else if (memory.calibrationScore > 0.8) {
      lines.push("✓ Calibration note: Observations have been landing accurately. Continue at current specificity level.")
    }
  }

  return lines.length > 1 ? lines.join("\n") : ""
}

// ============================================================
// CONVERSATION WINDOW FORMATTER
// Rolling window of last N turns, compressed.
// ============================================================

function formatConversationWindow(
  history: Array<{ role: string; content: string }>,
  maxTurns: number = 6
): string {
  if (!history.length) return ""

  const recent = history.slice(-(maxTurns * 2))
  if (!recent.length) return ""

  const lines = ["── CONVERSATION SO FAR ──"]
  for (const msg of recent) {
    const role = msg.role === "user" ? "User" : "Astrologer"
    // Truncate long messages
    const content = msg.content.length > 400
      ? msg.content.slice(0, 400) + "…"
      : msg.content
    lines.push(`${role}: ${content}`)
  }

  return lines.join("\n")
}

// ============================================================
// TOKEN ESTIMATOR
// Rough estimate: 1 token ≈ 4 characters
// ============================================================

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ============================================================
// SALIENCE LAYER SELECTOR
// Decides which layers of the signature to include
// based on query class and token budget.
// ============================================================

function selectSalienceLayers(
  signature: ChartSignature,
  queryClass: QueryClass,
  tokenBudget: number
): string {
  // For technical mode — don't use salience context, use full chart
  if (queryClass === "technical_mode") return ""

  return buildSalienceContext(signature, queryClass, {})
}

// ============================================================
// MAIN CONTEXT BUILDER
// ============================================================

/**
 * Builds the complete system prompt for an AI call.
 * Call this in your API route handler, right before the Anthropic call.
 *
 * @param input — all context needed to build the prompt
 * @returns BuiltContext with systemPrompt ready to use
 *
 * Usage in API route:
 *   const built = buildContext(input)
 *   const stream = await anthropic.messages.stream({
 *     model: built.modelToUse,
 *     system: built.systemPrompt,
 *     messages: [...conversationHistory, { role: "user", content: message }],
 *     max_tokens: 1200,
 *   })
 */
export function buildContext(input: ContextBuildInput): BuiltContext {
  const {
    chart,
    birthDetails,
    lagnaRashiIndex,
    signature,
    classification,
    conversationHistory,
    chartMemory,
    fullChartContext,
  } = input

  const { queryClass, modelTier, tokenBudget } = classification
  const layersIncluded: string[] = []
  const parts: string[] = []

  // ── Layer 1: Voice prompt ────────────────────────────────
  // WHO the AI is — the astrologer's identity and rules
  const voicePrompt = buildVoicePrompt()
  parts.push(voicePrompt)
  layersIncluded.push("voice_prompt")

  // ── Layer 2: Chart signal ────────────────────────────────
  // WHAT the chart says — compressed, ranked, pre-processed
  if (queryClass === "technical_mode") {
    // Technical mode: use full chart context
    const fullContext = fullChartContext ?? buildChartContext(birthDetails, chart)
    parts.push(fullContext)
    layersIncluded.push("full_chart_context")
  } else {
    // All other modes: use compressed salience context
    const salienceContext = selectSalienceLayers(signature, queryClass, tokenBudget)
    if (salienceContext) {
      parts.push(salienceContext)
      layersIncluded.push("salience_context")
    }
  }

  // ── Layer 3: Query-specific protocol ────────────────────
  // HOW to handle this specific question type
  const protocol = QUERY_PROTOCOLS[queryClass]
  if (protocol) {
    parts.push(`\n── ACTIVE PROTOCOL: ${queryClass.toUpperCase()} ──\n${protocol}`)
    layersIncluded.push(`protocol_${queryClass}`)
  }

  // ── Layer 4: Conversation memory ────────────────────────
  // WHAT has been confirmed and shared in previous sessions
  const memoryContext = formatMemoryContext(chartMemory)
  if (memoryContext) {
    parts.push(memoryContext)
    layersIncluded.push("chart_memory")
  }

  // ── Layer 5: Conversation window ────────────────────────
  // Recent turns for continuity (only if not first message)
  if (conversationHistory.length > 0) {
    const maxTurns = tokenBudget > 5000 ? 6 : 4
    const convContext = formatConversationWindow(conversationHistory, maxTurns)
    if (convContext) {
      parts.push(convContext)
      layersIncluded.push("conversation_window")
    }
  }

  // ── Layer 6: Quality constraints ────────────────────────
  // WHAT must never appear — injected last so it's freshest in context
  // Skip for technical mode — user wants to see the astrology
  if (queryClass !== "technical_mode") {
    parts.push(QUALITY_CONSTRAINTS)
    layersIncluded.push("quality_constraints")
  }

  const systemPrompt = parts.join("\n\n")
  const estimatedTokens = estimateTokens(systemPrompt)

  // Token budget warning
  if (estimatedTokens > tokenBudget * 1.2) {
    console.warn(
      `[contextBuilder] Token budget exceeded: estimated ${estimatedTokens} vs budget ${tokenBudget} for queryClass=${queryClass}`
    )
  }

  // Resolve model string from tier
  const MODEL_MAP: Record<string, string> = {
    haiku:  "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-20250514",
    opus:   "claude-opus-4-5-20251101",
  }

  return {
    systemPrompt,
    estimatedTokens,
    layersIncluded,
    modelToUse: MODEL_MAP[modelTier] ?? MODEL_MAP.sonnet,
  }
}

// ============================================================
// STREAMING WRAPPER
// Convenience function: classify + build + stream in one call.
// Use this in your /api/reading/stream route.
// ============================================================


// ============================================================
// QUALITY GATE
// Scores a completed response before delivering to user.
// Called after streaming completes, before saving to DB.
// If score < threshold, flag for review or regenerate.
// ============================================================

const GENERIC_PHRASES = [
  "you value independence",
  "you are sensitive",
  "you seek balance",
  "you have a strong intuition",
  "you are a natural leader",
  "you experience intensity",
  "you may find that",
  "many people with this",
  "this placement suggests",
  "this indicates that",
  "saturn indicates",
  "jupiter indicates",
  "moon in",
  "sun in",
  "your lagna",
  "your rashi",
  "mahadasha",
  "antardasha",
  "7th house",
  "10th house",
  "your nakshatra",
]

const TECHNICAL_LEAK_TERMS = [
  "saturn", "jupiter", "mars", "venus", "mercury", "rahu", "ketu",
  "mahadasha", "antardasha", "lagna", "nakshatra", "pada", "trikona",
  "kendra", "dusthana", "vimshottari", "bhava", "graha",
]

export interface QualityScore {
  passed: boolean
  score: number                // 0–1
  specificityScore: number     // 0–1 (ratio of specific to generic language)
  technicalLeakage: boolean    // Did forbidden terms appear?
  hasContradiction: boolean    // Is there a behavioral contradiction?
  issues: string[]
}

/**
 * Scores a completed AI response for quality.
 * Call after streaming completes.
 *
 * @param output      — the full AI response text
 * @param queryClass  — what kind of reading this was
 * @returns QualityScore
 *
 * Usage:
 *   const score = scoreResponse(fullResponseText, classification.queryClass)
 *   await supabase.from("messages").update({ quality_passed: score.passed, specificity_score: score.score }).eq("id", messageId)
 *   if (!score.passed) { // flag for review }
 */
export function scoreResponse(output: string, queryClass: QueryClass): QualityScore {
  const issues: string[] = []
  const lower = output.toLowerCase()

  // ── Check 1: Technical term leakage ─────────────────────
  let technicalLeakage = false
  if (queryClass !== "technical_mode") {
    const leaked = TECHNICAL_LEAK_TERMS.filter(term => lower.includes(term))
    if (leaked.length > 0) {
      technicalLeakage = true
      issues.push(`Technical terms leaked: ${leaked.slice(0, 3).join(", ")}`)
    }
  }

  // ── Check 2: Generic phrase detection ───────────────────
  const genericFound = GENERIC_PHRASES.filter(phrase => lower.includes(phrase))
  const genericRatio = genericFound.length / GENERIC_PHRASES.length

  // Penalize more for generic phrases that are most common
  if (genericFound.length >= 3) {
    issues.push(`Generic phrases detected: ${genericFound.slice(0, 2).join(", ")}`)
  }

  // ── Check 3: Behavioral contradiction present ────────────
  // Look for contradiction signal words
  const contradictionSignals = [
    "but simultaneously", "at the same time", "and yet",
    "the same person who", "alongside", "while also",
    "on the surface", "underneath", "both real",
    "this doesn't mean", "neither of these",
  ]
  const hasContradiction = contradictionSignals.some(sig => lower.includes(sig))
  if (!hasContradiction && queryClass !== "timing_general" && queryClass !== "technical_mode") {
    issues.push("No behavioral contradiction detected — output may be one-dimensional")
  }

  // ── Check 4: Minimum length ──────────────────────────────
  const wordCount = output.split(/\s+/).length
  if (wordCount < 80) {
    issues.push(`Response too short: ${wordCount} words`)
  }

  // ── Check 5: Ends with therapy question ──────────────────
  const lastLines = output.slice(-200).toLowerCase()
  const therapyEndings = [
    "how does that resonate",
    "what do you think",
    "does that feel accurate",
    "i'm here to support",
    "feel free to share",
    "how are you feeling about",
  ]
  if (therapyEndings.some(e => lastLines.includes(e))) {
    issues.push("Ends with therapy-style question — replace with observation")
  }

  // ── Score calculation ────────────────────────────────────
  let score = 1.0

  if (technicalLeakage) score -= 0.35
  score -= genericRatio * 0.4
  if (!hasContradiction) score -= 0.15
  if (wordCount < 80) score -= 0.2

  score = Math.max(0, Math.round(score * 100) / 100)

  const specificityScore = Math.max(0, 1 - genericRatio * 2)
  const passed = score >= 0.55 && !technicalLeakage

  return {
    passed,
    score,
    specificityScore,
    technicalLeakage,
    hasContradiction,
    issues,
  }
}

// ============================================================
// CONTEXT DIFF UTILITY
// Useful for debugging — shows what changed between two contexts.
// Use during development to verify layer injection is working.
// ============================================================

export function debugContext(built: BuiltContext): void {
  if (process.env.NODE_ENV !== "development") return

  console.group("[contextBuilder] System prompt breakdown")
  console.log("Model:", built.modelToUse)
  console.log("Estimated tokens:", built.estimatedTokens)
  console.log("Layers included:", built.layersIncluded.join(" → "))
  console.log("Prompt preview (first 500 chars):")
  console.log(built.systemPrompt.slice(0, 500))
  console.groupEnd()
}