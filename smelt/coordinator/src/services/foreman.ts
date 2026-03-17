/**
 * FOREMAN-7 — Coordinator-side LLM service
 * Used to generate challenge documents and validate context.
 * Calls Bankr LLM Gateway — you fund it directly at bankr.bot/llm
 */

const BANKR_LLM_URL = "https://llm.bankr.bot";
const MODEL = "claude-sonnet-4-6";

export function isEnabled(): boolean {
  const key = process.env.BANKR_API_KEY;
  return !!key && key !== "your_bankr_api_key_here";
}

export async function callLLM(system: string, user: string, maxTokens = 512): Promise<string> {
  if (!isEnabled()) {
    throw new Error("BANKR_API_KEY not set — running in mock mode");
  }

  const res = await fetch(`${BANKR_LLM_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key":    process.env.BANKR_API_KEY!,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Bankr LLM ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as { content?: Array<{ text?: string }> };

  return data.content?.[0]?.text ?? "";
}
