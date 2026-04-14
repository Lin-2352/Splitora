// lib/ai/contextManager.ts
// Token estimation and conversation history trimming

import { ChatMessage } from "./groq";

// ~4 characters per token (conservative estimate, works for English)
const CHARS_PER_TOKEN = 4;
const PER_MESSAGE_OVERHEAD = 4; // role + formatting tokens per message

export function estimateTokens(messages: ChatMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + Math.ceil(msg.content.length / CHARS_PER_TOKEN) + PER_MESSAGE_OVERHEAD;
  }, 0);
}

export function estimateStringTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Trim oldest messages first.
 * Always preserves the last user message so the model has something to answer.
 */
export function trimHistory(
  messages: ChatMessage[],
  maxTokenBudget: number
): ChatMessage[] {
  if (messages.length === 0) return messages;

  // Find and always keep the last user message
  const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
  const mustKeep = messages.slice(lastUserIdx === -1 ? -1 : lastUserIdx);
  const candidates = messages.slice(0, lastUserIdx === -1 ? messages.length - 1 : lastUserIdx);

  const mustKeepTokens = estimateTokens(mustKeep);
  if (mustKeepTokens >= maxTokenBudget) return mustKeep; // best effort

  let remaining = maxTokenBudget - mustKeepTokens;
  const kept: ChatMessage[] = [];

  // Walk from newest to oldest among candidates
  for (let i = candidates.length - 1; i >= 0; i--) {
    const cost = estimateTokens([candidates[i]]);
    if (remaining >= cost) {
      kept.unshift(candidates[i]);
      remaining -= cost;
    }
  }

  return [...kept, ...mustKeep];
}

/**
 * Lightweight compression: summarise older messages into a system note.
 */
export function compressHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= 4) return messages;

  const older = messages.slice(0, messages.length - 4);
  const recent = messages.slice(messages.length - 4);

  const summary = older
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 100)}`)
    .join("\n");

  return [
    { role: "system", content: `[Conversation summary]\n${summary}\n[End summary]` },
    ...recent,
  ];
}
