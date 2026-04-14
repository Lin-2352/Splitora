// app/api/chat/route.ts
// Matches your existing auth pattern exactly:
//   → token from: req.headers.get('Authorization')?.split(' ')[1]
//   → verified with: verifyToken(token) from @/middleware/auth

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth";
import { routeChat } from "@/lib/ai/modelRouter";
import { buildSystemPrompt } from "@/lib/ai/projectContext";
import { ChatMessage } from "@/lib/ai/groq";
import { buildFallbackResponse } from "@/lib/ai/fallbackResponder";
import {
  buildGreetingReply,
  buildOutOfScopeReply,
  isGreeting,
  isLikelyDomainQuestion,
  isOutOfScopeQuestion,
} from "@/lib/ai/domainGuard";
import { buildLiveDataContext } from "@/lib/ai/liveDataContext";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------
const MAX_INPUT_CHARS = parseInt(process.env.CHAT_MAX_INPUT_CHARS ?? "2000", 10);
const MAX_HISTORY_TURNS = parseInt(process.env.CHAT_MAX_HISTORY_TURNS ?? "20", 10);
const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatRequestBody {
  messages: { role: string; content: string }[];
  groupId?: string;
  routeHint?: string;
}

// ---------------------------------------------------------------------------
// Input sanitization — strips system messages from client, trims long content
// ---------------------------------------------------------------------------
function sanitizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const result: ChatMessage[] = [];
  for (const item of raw) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.role !== "string" ||
      typeof item.content !== "string"
    ) return null;

    // Block client-injected system messages — we build those server-side
    if (item.role === "system") continue;
    if (!["user", "assistant"].includes(item.role)) return null;

    result.push({
      role: item.role as "user" | "assistant",
      content: item.content.slice(0, MAX_INPUT_CHARS),
    });
  }

  return result.length > 0 ? result : null;
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth (identical pattern to your existing routes) ──────────────────────
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authData = verifyToken(token);
  if (!authData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Payload size guard ────────────────────────────────────────────────────
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Sanitize messages ─────────────────────────────────────────────────────
  const messages = sanitizeMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "messages must be a non-empty array of {role: 'user'|'assistant', content: string}" },
      { status: 400 }
    );
  }

  // ── Enforce history turn limit ────────────────────────────────────────────
  const capped = messages.slice(-(MAX_HISTORY_TURNS * 2));
  const lastUserMessage = [...capped].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";

  // ── Strict domain guardrail (before model call) ──────────────────────────
  if (isGreeting(lastUserMessage)) {
    return NextResponse.json(
      {
        answer: buildGreetingReply(),
        meta: {
          modelUsed: "local-guard",
          fallbackCount: 0,
          wasContextTrimmed: false,
          tokenEstimate: 0,
          fallbackIntent: "greeting",
        },
      },
      { status: 200 }
    );
  }

  if (isOutOfScopeQuestion(lastUserMessage)) {
    return NextResponse.json(
      {
        answer: buildOutOfScopeReply(),
        meta: {
          modelUsed: "local-guard",
          fallbackCount: 0,
          wasContextTrimmed: false,
          tokenEstimate: 0,
          fallbackIntent: "out_of_scope",
        },
      },
      { status: 200 }
    );
  }

  if (!isLikelyDomainQuestion(lastUserMessage)) {
    return NextResponse.json(
      {
        answer:
          "I am here to help with Splitora workflows only. Ask me about groups, expenses, bills, balances, settlements, analytics, or how to do a task in Splitora.",
        meta: {
          modelUsed: "local-guard",
          fallbackCount: 0,
          wasContextTrimmed: false,
          tokenEstimate: 0,
          fallbackIntent: "domain_redirect",
        },
      },
      { status: 200 }
    );
  }

  // ── Build live grounding context for dynamic values ───────────────────────
  const liveContext = await buildLiveDataContext({
    userId: authData.userId,
    groupId: body.groupId,
    routeHint: body.routeHint,
    lastUserMessage,
  });

  // ── Build system prompt with user + group context ─────────────────────────
  const systemPrompt = buildSystemPrompt({
    userName: authData.userName,   // from your verifyToken return value
    groupId: body.groupId,
    routeHint: body.routeHint,
    verifiedSnapshot: liveContext.snapshotText,
    strictNoGuessNote: liveContext.strictNoGuessNote,
  });

  // ── Route to AI with fallback ─────────────────────────────────────────────
  try {
    const result = await routeChat(capped, systemPrompt);

    return NextResponse.json({
      answer: result.answer,
      meta: {
        modelUsed: result.modelUsed,
        fallbackCount: result.fallbackCount,
        wasContextTrimmed: result.wasContextTrimmed,
        tokenEstimate: result.tokenEstimate,
      },
      ...(result.warnings.length > 0 && { warnings: result.warnings }),
    }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/chat] All models failed:", msg);

    const lowerMsg = msg.toLowerCase();
    const isRateLimited = lowerMsg.includes("429") || lowerMsg.includes("rate-limit") || lowerMsg.includes("rate limit");
    const isTimeout = lowerMsg.includes("timed out") || lowerMsg.includes("timeout") || lowerMsg.includes("408");
    const isConfigIssue =
      lowerMsg.includes("groq_api_key") ||
      lowerMsg.includes("not set");

    if (isRateLimited) {
      const lastUserMessage = [...capped].reverse().find((m) => m.role === "user")?.content ?? "";
      const fallback = buildFallbackResponse({
        lastUserMessage,
        routeHint: body.routeHint,
        reason: "rate_limit",
      });
      return NextResponse.json(
        {
          answer: fallback.answer,
          meta: {
            modelUsed: "local-fallback",
            fallbackCount: 0,
            wasContextTrimmed: false,
            tokenEstimate: 0,
            fallbackReason: fallback.reason,
            fallbackIntent: fallback.intent,
          },
          ...(process.env.NODE_ENV === "development" && { detail: msg }),
        },
        { status: 200 }
      );
    }

    if (isTimeout) {
      const lastUserMessage = [...capped].reverse().find((m) => m.role === "user")?.content ?? "";
      const fallback = buildFallbackResponse({
        lastUserMessage,
        routeHint: body.routeHint,
        reason: "timeout",
      });
      return NextResponse.json(
        {
          answer: fallback.answer,
          meta: {
            modelUsed: "local-fallback",
            fallbackCount: 0,
            wasContextTrimmed: false,
            tokenEstimate: 0,
            fallbackReason: fallback.reason,
            fallbackIntent: fallback.intent,
          },
          ...(process.env.NODE_ENV === "development" && { detail: msg }),
        },
        { status: 200 }
      );
    }

    if (isConfigIssue) {
      const lastUserMessage = [...capped].reverse().find((m) => m.role === "user")?.content ?? "";
      const fallback = buildFallbackResponse({
        lastUserMessage,
        routeHint: body.routeHint,
        reason: "config",
      });
      return NextResponse.json(
        {
          answer: fallback.answer,
          meta: {
            modelUsed: "local-fallback",
            fallbackCount: 0,
            wasContextTrimmed: false,
            tokenEstimate: 0,
            fallbackReason: fallback.reason,
            fallbackIntent: fallback.intent,
          },
          ...(process.env.NODE_ENV === "development" && { detail: msg }),
        },
        { status: 200 }
      );
    }

    const lastUserMessage = [...capped].reverse().find((m) => m.role === "user")?.content ?? "";
    const fallback = buildFallbackResponse({
      lastUserMessage,
      routeHint: body.routeHint,
      reason: "upstream_error",
    });

    return NextResponse.json(
      {
        answer: fallback.answer,
        meta: {
          modelUsed: "local-fallback",
          fallbackCount: 0,
          wasContextTrimmed: false,
          tokenEstimate: 0,
          fallbackReason: fallback.reason,
          fallbackIntent: fallback.intent,
        },
        ...(process.env.NODE_ENV === "development" && { detail: msg }),
      },
      { status: 200 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
