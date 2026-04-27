import { NextRequest } from "next/server";
import type { BirthDetails, KundliChart, InterpretationSection } from "@/types";
import { PLANET_META } from "@/lib/astro";
import { buildSystemPrompt } from "@/lib/promptEngine";

export const runtime = "edge";

// ─── Provider config ──────────────────────────────────────────────────────────
// Zima uses an OpenAI-compatible API — just swap base URL + key.
// Key prefix detection:
//   "sk-ant-..."  → direct Anthropic
//   anything else → Zima (OpenAI-compatible, routes to Claude models)

const ZIMA_BASE_URL = "https://www.zima.chat/api/v1";   // ← update if different
const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

// Model IDs: Zima may use different names — update if needed
const MODEL_IDS = {
  zima: "claude-sonnet-4.5",  // ← Zima's name for Claude Sonnet
  anthropic: "claude-sonnet-4-20250514",
};

function buildPrompt(
  section: InterpretationSection,
  details: BirthDetails,
  chart: KundliChart
): string {
  const planetList = chart.planets
    .map(p => {
      const flags = [
        p.isRetrograde && "(R)",
        p.isExalted && "(Exalted)",
        p.isDebilitated && "(Debilitated)",
        p.isCombust && "(Combust)",
      ].filter(Boolean).join(" ");
      return `${p.name}: ${p.position.rashi} ${p.position.degrees.toFixed(1)}°, House ${p.house} ${flags}`;
    })
    .join("\n");

  const yogaList = chart.yogas
    .map(y => `• ${y.name}: ${y.description}`)
    .join("\n");

  const activeDasha = chart.dashas.find(d => d.isActive);
  const activeAntar = activeDasha?.antardasha?.find(a => a.isActive);

  const baseContext = `
You are Jyotish Darshan, a master Vedic astrologer with 40+ years of experience in classical Jyotish shastra.

BIRTH DETAILS:
Name: ${details.name}
Date of Birth: ${details.dob}
Time of Birth: ${details.tob}
Place: ${details.pob}

CHART:
Lagna (Ascendant): ${chart.lagna.rashi} (${chart.lagna.degrees.toFixed(1)}°)
Nakshatra of Moon: ${chart.planets.find(p => p.key === "mo")?.position.nakshatra}

PLANETARY POSITIONS:
${planetList}

YOGAS PRESENT:
${yogaList || "None detected"}

CURRENT DASHA: ${activeDasha ? `${activeDasha.planetName} Mahadasha` : "N/A"}
CURRENT ANTARDASHA: ${activeAntar ? `${PLANET_META[activeAntar.planet].name} Antardasha` : "N/A"}
`.trim();

  const prompts: Record<InterpretationSection, string> = {
    full: `${baseContext}

Provide a comprehensive, personalized Vedic Kundli reading. Use flowing, eloquent prose. Be specific to this chart — not generic. Structure your response with these sections using **bold headings**:

**Lagna & Core Personality**
Analyse the ascendant deeply. How does it shape personality, physical appearance, and the native's approach to life?

**Planetary Strengths & Weaknesses**
Which planets are dignified, exalted, debilitated, or afflicted? What does this mean for the native?

**Key Yogas & Their Promise**
Elaborate on the yogas present and their practical impact on life.

**Career & Dharma**
Based on the 10th house, its lord, and significators, what career paths are indicated?

**Relationships & Love**
Analyse the 7th house, Venus, and Jupiter for relationship potential.

**Current Dasha Themes**
What themes does the current Mahadasha/Antardasha bring?

Write 500–600 words. Mystical but grounded. Specific, not generic.`,

    personality: `${baseContext}\n\nWrite a 250-word analysis of the native's core personality, temperament, and character traits based on the Lagna, Moon sign, and their lords. Be specific.`,

    career: `${baseContext}\n\nWrite a 250-word analysis of career, ambition, professional strengths, and ideal paths based on the 10th house, its lord, Sun placement, and relevant yogas.`,

    relationships: `${baseContext}\n\nWrite a 250-word analysis of relationships, marriage potential, and interpersonal dynamics based on the 7th house, Venus, Jupiter, and Moon.`,

    health: `${baseContext}\n\nWrite a 250-word analysis of health tendencies, potential vulnerabilities, and body constitution (Prakriti) based on the Lagna, its lord, 6th house, and relevant planets.`,

    spiritual: `${baseContext}\n\nWrite a 200-word analysis of spiritual inclinations, karmic lessons, and soul's purpose based on the 9th and 12th houses, Jupiter, Ketu placement, and the Atmakaraka.`,

    remedies: `${baseContext}

Recommend 6–8 specific, practical Vedic remedies tailored to this exact chart. Include:

**Gemstones**
Recommend stones for the Lagna lord and supportive planets with wearing instructions.

**Mantras & Prayers**
Specific mantras with frequency (e.g., 108 times on which day).

**Charitable Acts (Dana)**
What to donate, to whom, and on which day of the week.

**Lifestyle Recommendations**
Colors to wear, favorable directions, dietary suggestions.

**Fasting**
Which day(s) to fast and for which deity.

Be specific, practical, and concise. About 300 words.`,
  };

  return prompts[section];
}

// ─── Detect which provider to use ─────────────────────────────────────────────

function detectProvider(apiKey: string): "zima" | "anthropic" {
  return apiKey.startsWith("sk-ant-") ? "anthropic" : "zima";
}

// ─── OpenAI-compatible streaming (Zima) ───────────────────────────────────────

async function streamViaOpenAICompat(
  apiKey: string,
  baseUrl: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<Response> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Provider error ${res.status}: ${err.slice(0, 200)}`);
  }

  // Transform SSE chunks → plain text stream
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }

      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") { controller.close(); return; }
            try {
              const parsed = JSON.parse(data);
              const text =
                parsed.choices?.[0]?.delta?.content ??
                parsed.choices?.[0]?.delta?.text ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed chunks */ }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ─── Anthropic native streaming ───────────────────────────────────────────────

async function streamViaAnthropic(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<Response> {
  const res = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 200)}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }

      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta") {
                const text = parsed.delta?.text ?? "";
                if (text) controller.enqueue(encoder.encode(text));
              } else if (parsed.type === "message_stop") {
                controller.close();
                return;
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────




export async function POST(req: NextRequest) {
  try {
    let body: { apiKey?: string; baseUrl?: string; details?: BirthDetails; chart?: KundliChart; section?: InterpretationSection };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const { apiKey, baseUrl, details, chart, section } = body;

    if (!apiKey || apiKey.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid or missing API key." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const provider = detectProvider(apiKey);
    const prompt = buildPrompt(section!, details!, chart!);

    const systemPrompt = buildSystemPrompt(details!, chart!);

    if (provider === "anthropic") {
      return streamViaAnthropic(apiKey, MODEL_IDS.anthropic, systemPrompt, prompt);
    }

    return streamViaOpenAICompat(apiKey, baseUrl?.trim() || ZIMA_BASE_URL, MODEL_IDS.zima, systemPrompt, prompt);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}