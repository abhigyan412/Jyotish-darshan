// ============================================================
// zimaClassifierClient.ts
// Minimal adapter so queryClassifier.ts's Stage 2 AI fallback
// (classifyWithAI) can run against Zima's OpenAI-compatible API
// instead of a native Anthropic SDK client.
//
// queryClassifier.ts expects an object shaped like:
//   { messages: { create({ model, max_tokens, messages }) => { content: [{type, text}] } } }
// This wraps a Zima fetch call to match that exact shape, so
// nothing in queryClassifier.ts needs to change.
//
// Cost note: this only runs when Stage 1 pattern matching fails
// to find a confident match (~the ambiguous minority of messages).
// Most real questions will still resolve via free regex matching.
// ============================================================

const ZIMA_BASE_URL = process.env.ZIMA_BASE_URL || "https://www.zima.chat/api/v1";
const CLASSIFIER_MODEL = "claude-haiku-4.5"; // cheapest tier, fast, sufficient for a 1-label classification task

export function createZimaClassifierClient(apiKey: string) {
  return {
    messages: {
      async create(params: {
        model: string;
        max_tokens: number;
        messages: Array<{ role: string; content: string }>;
      }) {
        const res = await fetch(`${ZIMA_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          // Force the cheap classifier model regardless of what's passed in,
          // since this client is single-purpose (classification only).
          body: JSON.stringify({
            model: CLASSIFIER_MODEL,
            max_tokens: params.max_tokens,
            stream: false,
            messages: params.messages,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(`Zima classifier call failed: ${res.status} ${errBody.slice(0, 200)}`);
        }

        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";

        // Match the shape classifyWithAI() expects: content[0].type === "text"
        return {
          content: [{ type: "text", text }],
        };
      },
    },
  };
}