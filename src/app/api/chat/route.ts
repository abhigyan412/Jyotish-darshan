import { NextRequest } from "next/server";
import type { BirthDetails, KundliChart } from "@/types";
import { PLANET_META } from "@/lib/astro";
import { buildSystemPrompt } from "@/lib/promptEngine";

const ZIMA_BASE_URL = "https://www.zima.chat/api/v1";

function detectProvider(apiKey: string): "zima" | "anthropic" {
  return apiKey.startsWith("sk-ant-") ? "anthropic" : "zima";
}



export async function POST(req: NextRequest) {
  try {
    const { details, chart, messages } = await req.json();
    const apiKey = process.env.ZIMA_API_KEY || "zima-ae583d0069496f08f9eb75514de2dac04c4c77951bd90c882aa49048f9c0ae90";
    const baseUrl = process.env.ZIMA_BASE_URL || "https://www.zima.chat/api/v1";

    if (!apiKey || !messages?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const provider = detectProvider(apiKey);
    const systemPrompt = buildSystemPrompt(details, chart);
    console.log("System prompt token estimate:", Math.round(systemPrompt.length / 4));

    // Only pass last 10 messages to avoid token overflow
    const recentMessages = messages.slice(-10);

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          stream: true,
          system: systemPrompt,
          messages: recentMessages,
        }),
      });

      return streamAnthropic(res);
    }

    // Zima
    const res = await fetch(`${baseUrl || ZIMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-opus-4.5",
        max_tokens: 4096,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
      }),
    });

    return streamOpenAI(res);

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

function streamAnthropic(res: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const readable = new ReadableStream({
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
            const data = line.startsWith("data:") ? line.slice(5).trim() : "";
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta") {
                controller.enqueue(encoder.encode(parsed.delta?.text ?? ""));
              } else if (parsed.type === "message_stop") {
                controller.close(); return;
              }
            } catch { }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function streamOpenAI(res: Response): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const readable = new ReadableStream({
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
            const data = line.startsWith("data:") ? line.slice(5).trim() : "";
            if (data === "[DONE]") { controller.close(); return; }
            if (!data) continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch { }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });
  return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}