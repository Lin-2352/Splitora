// app/api/chat/history/route.ts
// GET  — load saved chat sessions for the authenticated user
// POST — save / upsert user's chat sessions to MongoDB

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth";
import createMongoConnection from "@/middleware/mongoDB";
import ChatHistory from "@/models/chatHistorySchema";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const MAX_SESSIONS = 30;
const MAX_MESSAGES_PER_SESSION = 60;

function getAuth(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) return null;
  return verifyToken(token);
}

/* ------------------------------------------------------------------ */
/*  GET /api/chat/history                                              */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await createMongoConnection();

    const doc: any = await ChatHistory.findOne({ userId: auth.userId })
      .select("sessions")
      .lean();

    if (!doc || !Array.isArray(doc.sessions) || doc.sessions.length === 0) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    // Convert Dates to epoch-ms for the client
    const sessions = doc.sessions.map((s: any) => ({
      id: s.sessionId,
      title: s.title ?? "Chat",
      createdAt: new Date(s.createdAt).getTime(),
      messages: (s.messages ?? []).map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).getTime(),
      })),
      meta: null,
    }));

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (err) {
    console.error("[/api/chat/history GET]", err);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat/history                                             */
/* ------------------------------------------------------------------ */
interface SessionPayload {
  id: string;
  title: string;
  createdAt: number;
  messages: {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }[];
}

function isValidPayload(body: unknown): body is { sessions: SessionPayload[] } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.sessions)) return false;
  return b.sessions.every(
    (s: any) =>
      typeof s.id === "string" &&
      typeof s.title === "string" &&
      typeof s.createdAt === "number" &&
      Array.isArray(s.messages)
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: "Invalid payload: expected { sessions: [...] }" },
      { status: 400 }
    );
  }

  // Cap and sanitize
  const sessions = body.sessions.slice(-MAX_SESSIONS).map((s) => ({
    sessionId: s.id,
    title: (s.title || "Chat").slice(0, 120),
    createdAt: new Date(s.createdAt),
    messages: s.messages
      .slice(-MAX_MESSAGES_PER_SESSION)
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length > 0
      )
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
        timestamp: new Date(m.timestamp || Date.now()),
      })),
  }));

  // Only save sessions that have at least one message
  const nonEmpty = sessions.filter((s) => s.messages.length > 0);

  try {
    await createMongoConnection();

    await ChatHistory.findOneAndUpdate(
      { userId: auth.userId },
      { $set: { sessions: nonEmpty } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[/api/chat/history POST]", err);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 }
    );
  }
}
