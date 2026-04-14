// lib/ai/modelRouter.ts
// Model priority list, per-model context limits, and fallback orchestration

import { callGroq, ChatMessage, GroqError } from "./groq";
import { estimateTokens, trimHistory } from "./contextManager";

// ---------------------------------------------------------------------------
// Conservative per-model context limits (tokens)
// ---------------------------------------------------------------------------
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "llama-3.3-70b-versatile": 32768,
  "llama-3.1-8b-instant": 32768,
  "deepseek-r1-distill-llama-70b": 32768,
  "mixtral-8x7b-32768": 32768,
};

const DEFAULT_LIMIT = 8192;

export function getContextLimit(model: string): number {
  return MODEL_CONTEXT_LIMITS[model] ?? DEFAULT_LIMIT;
}

export function getModelList(): string[] {
  const raw = process.env.GROQ_MODEL_PRIORITY ?? "";
  const fromEnv = raw.split(",").map((m) => m.trim()).filter(Boolean);
  return fromEnv.length > 0
    ? fromEnv
    : [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "deepseek-r1-distill-llama-70b",
      ];
}

export interface RouterResult {
  answer: string;
  modelUsed: string;
  fallbackCount: number;
  wasContextTrimmed: boolean;
  tokenEstimate: number;
  warnings: string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main fallback loop
// ---------------------------------------------------------------------------
export async function routeChat(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<RouterResult> {
  const models = getModelList();
  const reservedOutput = parseInt(
    process.env.CHAT_RESERVED_OUTPUT_TOKENS ?? "1024",
    10
  );

  let fallbackCount = 0;
  let wasContextTrimmed = false;
  const warnings: string[] = [];
  let rateLimitTriggered = false;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    const maxInput = getContextLimit(model) - reservedOutput;
    const systemMsg: ChatMessage = { role: "system", content: systemPrompt };

    let working = messages;
    const rawCost = estimateTokens([systemMsg, ...working]);

    if (rawCost > maxInput) {
      const budget = maxInput - estimateTokens([systemMsg]);
      const trimmed = trimHistory(working, budget);
      if (trimmed.length < working.length) {
        wasContextTrimmed = true;
        warnings.push(`History trimmed (${working.length} → ${trimmed.length} msgs) for ${model}`);
        working = trimmed;
      }
      // Still too large? Skip to bigger-context model
      if (estimateTokens([systemMsg, ...working]) > maxInput) {
        warnings.push(`${model} context too small even after trim — skipping`);
        fallbackCount++;
        continue;
      }
    }

    const tokenEstimate = estimateTokens([systemMsg, ...working]);

    let attemptedRateLimitRetry = false;
    while (true) {
      try {
        const response = await callGroq({
          model,
          messages: [systemMsg, ...working],
          max_tokens: reservedOutput,
        });

        const answer =
          response.choices?.[0]?.message?.content?.trim() ||
          "I couldn't generate a response. Please try again.";

        return { answer, modelUsed: response.model || model, fallbackCount, wasContextTrimmed, tokenEstimate, warnings };
      } catch (err: unknown) {
        const e = err as GroqError;

        if (e.isRateLimit && !attemptedRateLimitRetry) {
          attemptedRateLimitRetry = true;
          const baseWait = e.retryAfterMs ?? 1200;
          const waitMs = Math.min(Math.max(baseWait, 800), 4000) + Math.floor(Math.random() * 250);
          warnings.push(`${model} rate-limited (429) — retrying once in ${Math.ceil(waitMs / 1000)}s`);
          await sleep(waitMs);
          continue;
        }

        if (e.isContextOverflow) {
          wasContextTrimmed = true;
          warnings.push(`${model} returned context overflow — switching model`);
        } else if (e.isRateLimit) {
          rateLimitTriggered = true;
          warnings.push(`${model} rate-limited (429) — switching model`);
        } else {
          warnings.push(`${model} failed (${e.status ?? "unknown"}) — switching model`);
        }

        fallbackCount++;
        if (i === models.length - 1) {
          throw new Error(`All ${models.length} models failed. Last: ${e.message}`);
        }
        break;
      }
    }
  }

  if (rateLimitTriggered) {
    throw new Error("All configured Groq models are currently rate-limited (429)");
  }

  throw new Error("No models available");
}
