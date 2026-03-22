import { buildGreetingReply, buildOutOfScopeReply, isOutOfScopeQuestion } from "./domainGuard";

export type FallbackReason = "rate_limit" | "timeout" | "upstream_error" | "config";

export interface FallbackInput {
  lastUserMessage: string;
  routeHint?: string;
  reason: FallbackReason;
}

export interface FallbackOutput {
  answer: string;
  intent: string;
  reason: FallbackReason;
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((n) => text.includes(n));
}

function getPrimaryConfiguredModel(): string {
  const raw = process.env.GROQ_MODEL_PRIORITY ?? "";
  const first = raw.split(",").map((m) => m.trim()).filter(Boolean)[0];
  return first ?? "configured AI model";
}

function clampQuestion(q: string): string {
  return q.trim().slice(0, 120);
}

export function buildFallbackResponse(input: FallbackInput): FallbackOutput {
  const question = clampQuestion(input.lastUserMessage || "");
  const q = question.toLowerCase();
  const route = (input.routeHint ?? "").toLowerCase();

  if (/^(hi|hello|hey|yo|hii|hola)\b/.test(q)) {
    return {
      reason: input.reason,
      intent: "greeting",
      answer: buildGreetingReply(),
    };
  }

  if (isOutOfScopeQuestion(q)) {
    return {
      reason: input.reason,
      intent: "out_of_scope",
      answer: buildOutOfScopeReply(),
    };
  }

  if (includesAny(q, ["model", "gpt", "llm", "which ai", "which model"])) {
    return {
      reason: input.reason,
      intent: "model_info",
      answer: `Right now I am replying in local fallback mode because the provider is busy. When available, chat uses ${getPrimaryConfiguredModel()} first.`,
    };
  }

  const asksToAddBill =
    (q.includes("add") && (q.includes("bill") || q.includes("expense"))) ||
    q.includes("create expense") ||
    q.includes("upload bill") ||
    q.includes("receipt");

  if (asksToAddBill) {
    return {
      reason: input.reason,
      intent: "add_bill",
      answer:
        "To add a bill: open the group -> Add Expense -> enter amount + description -> choose payer -> choose split members/shares -> Save. If you share your current screen, I can guide each field.",
    };
  }

  if (includesAny(q, ["settle", "debt", "pay back", "payback"])) {
    return {
      reason: input.reason,
      intent: "settlement",
      answer:
        "To settle debt: open group details -> Settle Up -> pick who paid whom -> enter amount -> confirm. This immediately updates balances.",
    };
  }

  if (includesAny(q, ["balance", "owe", "owed", "who owes who"])) {
    return {
      reason: input.reason,
      intent: "balance",
      answer:
        "Balance formula: net = (others owe you) - (you owe others), then settlements are applied. Positive means you should receive money; negative means you owe.",
    };
  }

  if (includesAny(q, ["group leader", "add member", "invite", "join group", "members"])) {
    return {
      reason: input.reason,
      intent: "group_membership",
      answer:
        "Yes, leader/admin can manage members. Typical flow: share invite code from group settings, members join via Groups page. Leader-only controls appear when your role is groupLeader.",
    };
  }

  if (includesAny(q, ["simplify debt", "minimize transactions", "optimize debt"])) {
    return {
      reason: input.reason,
      intent: "simplify_debt",
      answer:
        "Simplify Debt reduces the number of payments needed while keeping final balances equivalent. Use it after expenses are added and before final settlement.",
    };
  }

  if (includesAny(q, ["chart", "analytics", "treemap", "summary", "spending trend"]) || route === "analytics") {
    return {
      reason: input.reason,
      intent: "analytics",
      answer:
        "Analytics explains spending patterns: trends over time, category/group distribution, and settlement progress. If you tell me which chart you are viewing, I will interpret it.",
    };
  }

  if (route === "groups") {
    return {
      reason: input.reason,
      intent: "groups",
      answer:
        "On Groups page you can create or join groups via invite code, then open a group to add expenses, manage members, and settle balances.",
    };
  }

  return {
    reason: input.reason,
    intent: "generic",
    answer:
      "I can help with Splitora only. Ask me about groups, bills, balances, settlements, analytics, or any task flow inside Splitora.",
  };
}
