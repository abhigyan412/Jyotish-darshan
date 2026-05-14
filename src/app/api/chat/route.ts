import { NextRequest } from "next/server";
import { buildVoicePrompt, buildChartContext, buildYearlyPredictionProtocol, NAKSHATRA_DATA } from "@/lib/promptEngine";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ZIMA_BASE_URL = "https://www.zima.chat/api/v1";

let salienceEngineOk  = false;
let contradictionsOk  = false;
let queryClassifierOk = false;
let contextBuilderOk  = false;
let memoryOk          = false;

try {
  require("@/lib/contradictions");
  contradictionsOk = true;
  console.log("[diag] contradictions.ts — OK");
} catch (e) {
  console.error("[diag] contradictions.ts — CRASH:", (e as Error).message);
}

try {
  require("@/lib/salienceEngine");
  salienceEngineOk = true;
  console.log("[diag] salienceEngine.ts — OK");
} catch (e) {
  console.error("[diag] salienceEngine.ts — CRASH:", (e as Error).message);
}

try {
  require("@/lib/queryClassifier");
  queryClassifierOk = true;
  console.log("[diag] queryClassifier.ts — OK");
} catch (e) {
  console.error("[diag] queryClassifier.ts — CRASH:", (e as Error).message);
}

try {
  require("@/lib/memory");
  memoryOk = true;
  console.log("[diag] memory.ts — OK");
} catch (e) {
  console.error("[diag] memory.ts — CRASH:", (e as Error).message);
}

try {
  require("@/lib/contextBuilder");
  contextBuilderOk = true;
  console.log("[diag] contextBuilder.ts — OK");
} catch (e) {
  console.error("[diag] contextBuilder.ts — CRASH:", (e as Error).message);
}

let computeChartSignature: any = null;
let buildSalienceContext: any  = null;
let classifyQuery: any         = null;
let QUERY_PROTOCOLS: any       = null;
let resolveModel: any          = null;
let loadMemory: any            = null;
let updateMemory: any          = null;

if (salienceEngineOk) {
  const se = require("@/lib/salienceEngine");
  computeChartSignature = se.computeChartSignature;
  buildSalienceContext  = se.buildSalienceContext;
}

if (queryClassifierOk) {
  const qc = require("@/lib/queryClassifier");
  classifyQuery   = qc.classifyQuery;
  QUERY_PROTOCOLS = qc.QUERY_PROTOCOLS;
  resolveModel    = qc.resolveModel;
}

if (memoryOk) {
  const mem = require("@/lib/memory");
  loadMemory   = mem.loadMemory;
  updateMemory = mem.updateMemory;
}

function detectYear(msg: string): number | null {
  const match = msg.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1]) : null;
}

function classifyQueryLocal(msg: string): string {
  const m = msg.toLowerCase();
  if (/\b(when|will i).*(marr|wed|engag)\b/.test(m) || /\bget married\b/.test(m)) return "timing_marriage";
  if (/\b(when|will i).*(job|career|promot)\b/.test(m)) return "timing_career";
  if (/\b20[2-3][0-9]\b/.test(m) && /\b(predict|year|happen)\b/.test(m)) return "timing_yearly";
  if (/\b(spouse|husband|wife|partner).*(like|be|describe)\b/.test(m)) return "relationship_partner";
  if (/\b(who am i|personality|life purpose|dharma)\b/.test(m)) return "identity_core";
  if (/\bwhy do i keep\b/.test(m)) return "identity_contradiction";
  if (/\b(what career|which career|career path)\b/.test(m)) return "career_direction";
  if (/\b(give me|tell me).*(specific|facts|list)\b/.test(m)) return "fact_mode";
  return "general";
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const {
      details,
      chart,
      messages,
      chartId,
      conversationId: existingConvId,
      transitPlanets,
    } = await req.json();

    const apiKey  = process.env.ZIMA_API_KEY || "";
    const baseUrl = process.env.ZIMA_BASE_URL || ZIMA_BASE_URL;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured." }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "Missing messages." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Auth + Persistence ───────────────────────────────────────────────
    let userId: string | null         = null;
    let conversationId: string | null = existingConvId ?? null;
    let supabaseClient: any           = null;

    try {
      supabaseClient = await createSupabaseServerClient();
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        userId = user.id;

        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("tier")
          .eq("id", userId)
          .single();

        const tier  = profile?.tier ?? "free";
        const limits: Record<string, number> = { free: 20, basic: 100, pro: Infinity };
        const limit = limits[tier] ?? 20;

        if (chartId) {
          if (!conversationId) {
            const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
            const { data: conv } = await supabaseClient
              .from("conversations")
              .insert({
                user_id:  userId,
                chart_id: chartId,
                title:    firstUserMsg?.content?.slice(0, 60) ?? "New reading",
              })
              .select("id")
              .single();
            conversationId = conv?.id ?? null;
          }

          if (conversationId && limit !== Infinity) {
            const { count } = await supabaseClient
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId)
              .eq("role", "user");

            if ((count ?? 0) >= limit) {
              return new Response(
                JSON.stringify({ error: `Message limit reached (${limit} on ${tier} plan).` }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }
          }

          const lastUserMsg = messages[messages.length - 1];
          if (conversationId && lastUserMsg?.role === "user") {
            await supabaseClient.from("messages").insert({
              conversation_id: conversationId,
              user_id:         userId,
              role:            "user",
              content:         lastUserMsg.content,
            });
          }
        }
      }
    } catch (e) {
      console.log("AUTH BLOCK ERROR:", (e as Error).message);
    }

    // ─── Build system prompt ──────────────────────────────────────────────
    const lastUserContent = messages[messages.length - 1]?.content ?? "";
    const year            = detectYear(lastUserContent);

    let systemPrompt: string;
    let modelToUse  = "claude-sonnet-4.5";
    let chartMemory: any = null;

    if (salienceEngineOk && queryClassifierOk && chart?.lagna && details) {
      try {
        console.log("[diag] Attempting salience pipeline...");

        // Step 1: classify
        const classification = await classifyQuery(lastUserContent, messages.slice(-6));
        console.log("[diag] classify OK:", classification.queryClass);

        // Timing queries always need fresh transits — never serve from cache
        const isTimingQuery = (classification.queryClass as string).startsWith("timing_");

        // Step 2: load memory
        if (memoryOk && chartId && userId) {
          try {
            chartMemory = await loadMemory(chartId);
            console.log("[diag] memory load OK:", !!chartMemory);
          } catch (e) {
            console.error("[diag] memory load FAILED:", (e as Error).message);
          }
        }

        // Step 3: signature
        const lagnaRashiIndex = chart.lagna.rashiIndex ?? 0;
        let signature: any    = null;

        // Load from DB only for non-timing queries
        if (!isTimingQuery && supabaseClient && chartId) {
          try {
            const { data: saved } = await supabaseClient
              .from("chart_salience")
              .select("*")
              .eq("chart_id", chartId)
              .single();

            if (saved) {
              signature = {
                dominantAxis:      saved.dominant_axis      ?? [],
                planetaryPressure: saved.planetary_pressure ?? [],
                activeHouses:      saved.active_houses      ?? [],
                timingConfluence:  saved.timing_confluence  ?? [],
                contradictions:    saved.contradictions     ?? [],
                partnerSignature:  saved.partner_signature  ?? {},
                dashaThemes:       saved.dasha_themes       ?? [],
                computedAt:        saved.computed_at,
                engineVersion:     saved.engine_version,
              };
              console.log("[diag] signature loaded from DB OK");
            }
          } catch (e) {
            console.log("[diag] no saved signature, computing fresh");
          }
        } else if (isTimingQuery) {
          console.log("[diag] timing query — computing fresh with today's transits");
        }

        // Compute fresh if not loaded from DB
        if (!signature) {
          signature = computeChartSignature(
            chart,
            lagnaRashiIndex,
            NAKSHATRA_DATA,
            transitPlanets
          );
          console.log("[diag] signature computed fresh OK, dominantAxis.length=", signature.dominantAxis?.length);

          // Only cache non-timing signatures
          if (!isTimingQuery && supabaseClient && chartId) {
            supabaseClient.from("chart_salience").upsert({
              chart_id:           chartId,
              dominant_axis:      signature.dominantAxis,
              planetary_pressure: signature.planetaryPressure,
              active_houses:      signature.activeHouses,
              timing_confluence:  signature.timingConfluence,
              contradictions:     signature.contradictions,
              partner_signature:  signature.partnerSignature,
              dasha_themes:       (signature as any).dashaThemes ?? [],
              engine_version:     signature.engineVersion,
              computed_at:        signature.computedAt,
            }, { onConflict: "chart_id" }).then(({ error }: any) => {
              if (error) console.log("[diag] salience save error:", error.message);
            });
          }
        }

        // Step 4: build context
        const salienceContext = buildSalienceContext(
          signature,
          classification.queryClass,
          { name: details?.name, dob: details?.dob, pob: details?.pob }
        );
        console.log("[diag] salienceContext built, length=", salienceContext?.length);

        const protocol    = QUERY_PROTOCOLS[classification.queryClass];
        const yearlyProto = year ? buildYearlyPredictionProtocol(year) : "";

        let memoryContext = "";
        if (chartMemory) {
          try {
            const { buildCompactMemorySummary } = require("@/lib/memory");
            memoryContext = buildCompactMemorySummary(chartMemory);
          } catch (e) {
            console.error("[diag] memory summary FAILED:", (e as Error).message);
          }
        }

        systemPrompt = [
          buildVoicePrompt(),
          salienceContext,
          protocol
            ? `\n── ACTIVE PROTOCOL: ${classification.queryClass.toUpperCase()} ──\n${protocol}`
            : "",
          memoryContext
            ? `\n── CHART MEMORY ──\n${memoryContext}\n\nINSTRUCTION: This person has had previous readings. Do NOT repeat observations already confirmed above. Build on what landed. Go one level deeper on confirmed themes. Introduce at least one observation they have not heard before.`
            : "",
          yearlyProto || "",
          `\n\n── OUTPUT RULES ──\nNEVER say planet names, house numbers, Sanskrit terms unless user explicitly asks for technical analysis.\nNEVER produce generic observations. Every statement must be specific enough that a different person would say "that's not me."\nALWAYS include at least one behavioral contradiction — two genuine drives that collide in real life.\nTranslate everything into behavioral patterns, emotional textures, and qualities of time.`,
        ].filter(Boolean).join("\n\n");

        modelToUse = resolveModel(classification.modelTier);
        console.log(`[diag] FULL PIPELINE OK — model=${modelToUse} prompt.length=${systemPrompt.length}`);

      } catch (e) {
        console.error("[diag] PIPELINE RUNTIME CRASH:", (e as Error).message, "\n", (e as Error).stack);

        const voicePrompt  = buildVoicePrompt();
        const chartContext = buildChartContext(details, chart);
        const yearlyProto  = year ? buildYearlyPredictionProtocol(year) : "";

        systemPrompt = [
          voicePrompt,
          `\n\nYOUR PRIVATE NOTES:\n${chartContext}\n\nTranslate into human experience. Never quote directly.`,
          yearlyProto,
        ].filter(Boolean).join("\n\n");

        modelToUse = "claude-sonnet-4.5";
        console.log("[diag] Fell back to safe path — prompt.length=", systemPrompt.length);
      }

    } else {
      console.log("[diag] Pipeline modules not all loaded, using safe path");

      const voicePrompt  = buildVoicePrompt();
      const chartContext = chart && details ? buildChartContext(details, chart) : "";
      const yearlyProto  = year ? buildYearlyPredictionProtocol(year) : "";

      systemPrompt = [
        voicePrompt,
        chartContext
          ? `\n\nYOUR PRIVATE NOTES:\n${chartContext}\n\nTranslate into human experience. Never quote directly.`
          : "",
        yearlyProto,
      ].filter(Boolean).join("\n\n");

      modelToUse = "claude-sonnet-4.5";
    }

    const persistArgs: PersistArgs = {
      userId,
      conversationId,
      chartId:     chartId ?? null,
      queryClass:  classifyQueryLocal(lastUserContent),
      userMessage: lastUserContent,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    };

    console.log(`[diag] Calling Zima — model=${modelToUse}`);
    console.log("[timing] pre-Zima:", Date.now() - startTime, "ms");

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:      modelToUse,
        max_tokens: 1200,
        stream:     true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
      }),
    });

    console.log(`[diag] Zima status=${res.status}`);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[diag] Zima error body:", errBody.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Upstream error: ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return streamOpenAI(res, persistArgs);

  } catch (err) {
    console.error("[diag] TOP LEVEL CRASH:", (err as Error).message, (err as Error).stack);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Persist ──────────────────────────────────────────────────────────────────

async function saveAssistantReply(
  fullText:       string,
  userId:         string | null,
  conversationId: string | null,
  chartId:        string | null,
  queryClass:     string,
  userMessage:    string,
  supabaseUrl:    string,
  supabaseKey:    string
) {
  if (!userId || !conversationId || !fullText) return;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    await db.from("messages").insert({
      conversation_id: conversationId,
      user_id:         userId,
      role:            "assistant",
      content:         fullText,
    });
  } catch (e) {
    console.log("SAVE ERROR:", (e as Error).message);
  }

  if (chartId && userId && fullText) {
    try {
      const { updateMemory } = await import("@/lib/memory");
      await updateMemory({
        chartId,
        userId,
        userMessage,
        assistantResponse: fullText,
        queryClass:        queryClass as any,
      });
      console.log("[memory] updated OK");
    } catch (e) {
      console.log("[memory] update FAILED:", (e as Error).message);
    }
  }
}

type PersistArgs = {
  userId:         string | null;
  conversationId: string | null;
  chartId:        string | null;
  queryClass:     string;
  userMessage:    string;
  supabaseUrl:    string;
  supabaseKey:    string;
};

// ─── Stream ────────────────────────────────────────────────────────────────────

function streamOpenAI(res: Response, persist: PersistArgs): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }

      let buffer   = "";
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const data = line.startsWith("data:") ? line.slice(5).trim() : "";
            if (data === "[DONE]") {
              console.log("[stream] DONE — chars=", fullText.length);
              await saveAssistantReply(
                fullText,
                persist.userId,
                persist.conversationId,
                persist.chartId,
                persist.queryClass,
                persist.userMessage,
                persist.supabaseUrl,
                persist.supabaseKey,
              );
              controller.close();
              return;
            }
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              const text   = parsed.choices?.[0]?.delta?.content ?? "";
              if (text) {
                fullText += text;
                controller.enqueue(encoder.encode(text));
              }
            } catch { }
          }
        }
      } finally {
        reader.releaseLock();
        if (fullText) {
          await saveAssistantReply(
            fullText,
            persist.userId,
            persist.conversationId,
            persist.chartId,
            persist.queryClass,
            persist.userMessage,
            persist.supabaseUrl,
            persist.supabaseKey,
          );
        } else {
          console.error("[stream] EMPTY — Zima returned no content");
        }
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}