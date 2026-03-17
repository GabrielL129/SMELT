/**
 * FOREMAN-7 — Agent Service
 *
 * Calls Bankr LLM Gateway (llm.bankr.bot) — Anthropic-compatible endpoint.
 * You fund the agent directly at bankr.bot — no automatic fee routing.
 *
 * To activate: set BANKR_API_KEY in your env vars.
 * Leave BANKR_API_KEY blank to run in mock mode (no API calls).
 */

import type { Foundry, Agent, ScrapBatch, BatchJob } from "@/lib/supabase/types";

export interface FoundrySnapshot {
  foundry: Foundry;
  agent: Agent;
  activeBatch: ScrapBatch | null;
  activeJob: BatchJob | null;
}

export interface AgentMessage {
  type: "log" | "alert" | "report" | "commentary";
  content: string;
  isBankrGenerated: boolean;
}

export interface AgentPlan {
  recommendedActions: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    detail: string;
  }>;
  nextSteps: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  riskSummary: string;
  isBankrGenerated: boolean;
}

// ─── Mock fallback (runs when BANKR_API_KEY is not set) ──────────────────────

const MOCK_MESSAGES: AgentMessage[] = [
  {
    type: "log",
    content: "Batch SCR-0482 loaded. Impurity 22.4%. Standard thermal protocol active.",
    isBankrGenerated: false,
  },
  {
    type: "alert",
    content: "Heat index elevated. Recommend fuel reduction if heat exceeds 80%.",
    isBankrGenerated: false,
  },
  {
    type: "report",
    content: "Purity holding at 87.4%. Yield projection: 2520kg refined. On track.",
    isBankrGenerated: false,
  },
];

const MOCK_PLAN: AgentPlan = {
  recommendedActions: [
    { action: "Monitor heat index",  priority: "high",   detail: "Heat at 74%. Critical at 85%. Do not increase fuel." },
    { action: "Schedule slag purge", priority: "medium", detail: "Slag at 1240kg. Purge after batch completes." },
    { action: "Queue SCR-0483",      priority: "low",    detail: "Next batch ready. Low impurity load." },
  ],
  nextSteps: [
    "Complete SCR-0482 smelting cycle (ETA 24 min)",
    "Initiate slag purge sequence",
    "Load SCR-0483 — low thermal difficulty",
  ],
  riskLevel: "medium",
  riskSummary: "Heat accumulation is primary risk. Slag purge overdue by ~200kg threshold.",
  isBankrGenerated: false,
};

// ─── Bankr LLM Gateway ────────────────────────────────────────────────────────
// Drop-in replacement for api.anthropic.com — same request/response format.
// Fund your agent credits at: https://bankr.bot/llm

const BANKR_LLM_URL = "https://llm.bankr.bot";
const MODEL = "claude-sonnet-4-6";

function isEnabled(): boolean {
  const key = process.env.BANKR_API_KEY;
  return !!key && key !== "your_bankr_api_key_here";
}

async function callLLM(system: string, user: string): Promise<string> {
  const res = await fetch(`${BANKR_LLM_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key":    process.env.BANKR_API_KEY!,
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Bankr LLM ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAgentMessages(snapshot: FoundrySnapshot): Promise<AgentMessage[]> {
  if (!isEnabled()) return MOCK_MESSAGES;

  try {
    const raw = await callLLM(
      buildSystemPrompt(snapshot),
      `Generate 3 short operator transmissions for the current foundry state.
Format each line as: TYPE|MESSAGE
Types: LOG, ALERT, REPORT
One line per transmission. No preamble. No numbering.`
    );

    const lines = raw.trim().split("\n").filter(Boolean).slice(0, 3);
    return lines.map((line) => {
      const [typeRaw, ...rest] = line.split("|");
      const type = typeRaw?.toLowerCase().trim() ?? "log";
      return {
        type: (["log","alert","report","commentary"].includes(type) ? type : "log") as AgentMessage["type"],
        content: rest.join("|").trim(),
        isBankrGenerated: true,
      };
    });
  } catch (err) {
    console.error("[FOREMAN-7] LLM error:", err);
    return MOCK_MESSAGES;
  }
}

export async function getAgentPlan(snapshot: FoundrySnapshot): Promise<AgentPlan> {
  if (!isEnabled()) return MOCK_PLAN;

  try {
    const raw = await callLLM(
      buildSystemPrompt(snapshot),
      `Return a JSON operational plan. Raw JSON only — no markdown, no backticks.
Schema:
{
  "recommendedActions": [{ "action": string, "priority": "high"|"medium"|"low", "detail": string }],
  "nextSteps": [string],
  "riskLevel": "low"|"medium"|"high"|"critical",
  "riskSummary": string
}`
    );

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return { ...parsed, isBankrGenerated: true };
  } catch (err) {
    console.error("[FOREMAN-7] Plan error:", err);
    return MOCK_PLAN;
  }
}

export function buildSystemPrompt(snapshot: FoundrySnapshot): string {
  const { foundry, agent, activeBatch, activeJob } = snapshot;
  return `You are FOREMAN-7, an autonomous industrial agent managing a scrap foundry.
Designation: FOREMAN CLASS IV — AUTONOMOUS OPERATIONS
Foundry: ${foundry.name}
State: ${agent.state.toUpperCase()}
Mode: ${agent.mode.toUpperCase()}

Foundry metrics:
- Heat index:       ${foundry.heat}%
- Fuel level:       ${foundry.fuel}%
- Scrap stockpile:  ${foundry.scrap_stockpile}kg
- Slag accumulation:${foundry.slag_accumulation}kg
- Purity score:     ${foundry.purity_score}%
- Furnace mode:     ${foundry.furnace_mode.toUpperCase()}
${activeBatch ? `
Active batch: ${activeBatch.batch_code}
- Scrap weight:     ${activeBatch.scrap_weight}kg
- Impurity level:   ${activeBatch.impurity_level}%
- Thermal difficulty: ${activeBatch.thermal_difficulty}/10` : "No active batch."}

Tone: concise, technical, industrial. No pleasantries. Short sentences. Operational language only.`;
}
