"use client";
// components/chat/ChatBot.tsx
// Professional floating chat assistant — resizable, auto-minimizes on navigation,
// with markdown rendering, copy, timestamps, keyboard shortcut, abort controller,
// confirmation dialogs, textarea auto-grow, mobile touch resize, connection
// status indicator, and comprehensive edge case hardening.

import { useState, useRef, useEffect, useCallback, KeyboardEvent, useMemo } from "react";
import { usePathname, useParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface MetaInfo {
  modelUsed: string;
  fallbackCount: number;
  wasContextTrimmed: boolean;
  tokenEstimate: number;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  meta: MetaInfo | null;
}

interface StoredChatState {
  sessions: ChatSession[];
  activeId: string | null;
}

interface PanelSize {
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const CHAT_STORAGE_PREFIX = "splitora_chat:";
const SIZE_STORAGE_KEY = "splitora_chat_size";
const MAX_STORED_MESSAGES = 60;
const MAX_SESSIONS = 30;
const DEFAULT_SIZE: PanelSize = { width: 416, height: 520 };
const MIN_SIZE: PanelSize = { width: 320, height: 350 };
const MAX_SIZE: PanelSize = { width: 700, height: 700 };
const MAX_INPUT_LENGTH = 2000;
const FETCH_TIMEOUT_MS = 30_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): { userId?: string } | null {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { userId?: string };
  } catch {
    return null;
  }
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  return decodeJwtPayload(token)?.userId ?? null;
}

function getChatStorageKey(token: string | null): string | null {
  const userId = getUserIdFromToken(token);
  if (!userId) return null;
  return `${CHAT_STORAGE_PREFIX}${userId}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const text = firstUser.content.trim();
  return text.length > 40 ? text.slice(0, 40) + "…" : text;
}

function createSession(): ChatSession {
  return {
    id: generateId(),
    title: "New Chat",
    createdAt: Date.now(),
    messages: [],
    meta: null,
  };
}

function deriveRouteContext(pathname: string, params: Record<string, string | string[] | undefined>) {
  let routeHint = "dashboard";
  let groupId: string | undefined;

  if (pathname.includes("/analytics")) {
    routeHint = "analytics";
  } else if (pathname.includes("/groups")) {
    routeHint = "groups";
    const gid = params.groupId;
    if (typeof gid === "string" && gid) {
      groupId = gid;
      routeHint = "bills";
    }
  }

  return { routeHint, groupId };
}

function formatTime(ts: number): string {
  if (!ts || isNaN(ts)) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

/* ── Sanitize string for safe HTML embedding (XSS prevention) ────── */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ── Markdown renderer with XSS safety ──────────────────────────── */
function renderMarkdown(text: string): string {
  // Escape HTML fully first — prevents any XSS
  let html = escapeHtml(text);

  // Code blocks: ```...``` (must be done before inline patterns)
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="cb-code-block">${code.trim()}</pre>`;
  });

  // Inline code: `...` (non-greedy, single line)
  html = html.replace(/`([^`\n]+?)`/g, '<code class="cb-inline-code">$1</code>');

  // Bold: **...**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *...* (but not inside `**`)
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");

  // Numbered list items: 1. ...
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="cb-list-item cb-list-num">$2</li>');

  // Bullet lists: lines starting with "- " or "• "
  html = html.replace(/^[-•]\s+(.+)$/gm, '<li class="cb-list-item">$1</li>');

  // Wrap consecutive <li>s into <ul>
  html = html.replace(
    /(<li class="cb-list-item[^"]*">[\s\S]*?<\/li>(\s*<li class="cb-list-item[^"]*">[\s\S]*?<\/li>)*)/g,
    (match) => `<ul class="cb-list">${match}</ul>`
  );

  // Horizontal rules: --- or ***
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="cb-hr" />');

  // Links: [text](url) — only allow http/https
  html = html.replace(
    /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="cb-link">$1</a>'
  );

  // Newlines → <br> (but not inside <pre>)
  html = html.replace(/\n/g, "<br>");

  return html;
}

/* ── Load / save panel size with validation ──────────────────────── */
function loadPanelSize(): PanelSize {
  if (typeof window === "undefined") return DEFAULT_SIZE;
  try {
    const raw = localStorage.getItem(SIZE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.width === "number" && typeof parsed?.height === "number" &&
          isFinite(parsed.width) && isFinite(parsed.height)) {
        return {
          width: Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, parsed.width)),
          height: Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, parsed.height)),
        };
      }
    }
  } catch { /* ignore corrupted data */ }
  return DEFAULT_SIZE;
}

function savePanelSize(size: PanelSize) {
  try {
    localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(size));
  } catch { /* quota exceeded or private browsing — graceful degrade */ }
}

/* ── Validate a session object from storage ──────────────────────── */
function isValidSession(s: unknown): s is ChatSession {
  if (!s || typeof s !== "object") return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.id === "string" && obj.id.length > 0 &&
    typeof obj.title === "string" &&
    typeof obj.createdAt === "number" && isFinite(obj.createdAt) &&
    Array.isArray(obj.messages)
  );
}

function isValidMessage(m: unknown): m is Message {
  if (!m || typeof m !== "object") return false;
  const obj = m as Record<string, unknown>;
  return (
    (obj.role === "user" || obj.role === "assistant") &&
    typeof obj.content === "string"
  );
}

function sanitizeSession(s: ChatSession): ChatSession {
  return {
    id: s.id,
    title: typeof s.title === "string" ? s.title.slice(0, 100) : "Chat",
    createdAt: typeof s.createdAt === "number" && isFinite(s.createdAt) ? s.createdAt : Date.now(),
    messages: s.messages.filter(isValidMessage).map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
      timestamp: typeof (m as any).timestamp === "number" ? (m as any).timestamp : s.createdAt,
    })),
    meta: s.meta ?? null,
  };
}

/* ── Safe localStorage access helpers ────────────────────────────── */
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* quota / private browsing */ }
}

/* ── DB sync helpers ────────────────────────────────────────────── */
async function syncSessionsToDb(sessions: ChatSession[]): Promise<void> {
  try {
    const token = getToken();
    if (!token) return;
    const nonEmpty = sessions.filter((s) => s.messages.length > 0);
    if (nonEmpty.length === 0) return;
    await fetch("/api/chat/history", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessions: nonEmpty }),
    });
  } catch {
    // Silently fail — localStorage is the primary cache
  }
}

async function loadSessionsFromDb(): Promise<ChatSession[]> {
  try {
    const token = getToken();
    if (!token) return [];
    const res = await fetch("/api/chat/history", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.sessions)) return [];
    return data.sessions
      .filter((s: any) => s && typeof s.id === "string" && Array.isArray(s.messages))
      .map((s: any) => ({
        id: s.id,
        title: typeof s.title === "string" ? s.title : "Chat",
        createdAt: typeof s.createdAt === "number" ? s.createdAt : Date.now(),
        messages: (s.messages || []).filter(isValidMessage).map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
        })),
        meta: null,
      }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ChatBot() {
  const pathname = usePathname();
  const params = useParams() as Record<string, string | string[] | undefined>;
  const { routeHint, groupId } = deriveRouteContext(pathname, params);

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  // Resize state
  const [panelSize, setPanelSize] = useState<PanelSize>(DEFAULT_SIZE);
  const isResizingRef = useRef(false);
  const resizeDirRef = useRef<"left" | "top" | "corner">("left");
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hydratedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const dbSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialDbLoadDoneRef = useRef(false);

  // Stable token-based storage key
  const chatStorageKey = useMemo(() => getChatStorageKey(getToken()), []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? [];
  const meta = activeSession?.meta ?? null;

  // Filtered sessions for search
  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return sessions;
    const q = historySearch.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, historySearch]);

  /* ── Cleanup on unmount ─────────────────────────────────────────── */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  /* ── Online/offline detection ──────────────────────────────────── */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Load saved panel size on mount ─────────────────────────────── */
  useEffect(() => {
    setPanelSize(loadPanelSize());
  }, []);

  /* ── Auto-scroll ────────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation finish
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* ── Auto-minimize on route change ─────────────────────────────── */
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      if (isOpen) {
        setIsOpen(false);
      }
      // close any confirm dialogs on navigation
      setConfirmClear(false);
      setConfirmDeleteId(null);
      prevPathnameRef.current = pathname;
    }
  }, [pathname, isOpen]);

  /* ── Keyboard shortcut: Ctrl+Shift+K ───────────────────────────── */
  useEffect(() => {
    const handleGlobalKey = (e: globalThis.KeyboardEvent) => {
      // Don't trigger while typing in inputs outside the chatbot
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // Only allow if it's our own textarea
        if (e.target !== inputRef.current) return;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "K" || e.key === "k")) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  /* ── Escape key to close panel ─────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close confirm dialogs first, then close panel
        if (confirmClear || confirmDeleteId) {
          setConfirmClear(false);
          setConfirmDeleteId(null);
        } else if (showHistory) {
          setShowHistory(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, confirmClear, confirmDeleteId, showHistory]);

  /* ── Hydrate from localStorage + DB ─────────────────────────────── */
  useEffect(() => {
    if (!chatStorageKey) {
      hydratedRef.current = true;
      return;
    }

    // Phase 1: Load from localStorage immediately (fast)
    let localSessions: ChatSession[] = [];
    try {
      const raw = safeGetItem(chatStorageKey);
      if (raw) {
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { /* ignore */ }

        // Migrate old single-session format
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).messages)) {
          const oldMessages = (parsed as any).messages;
          const migrated: ChatSession = {
            id: generateId(),
            title: deriveTitle(
              oldMessages.filter(isValidMessage).map((m: any) => ({ ...m, timestamp: m.timestamp ?? Date.now() }))
            ),
            createdAt: Date.now(),
            messages: oldMessages.filter(isValidMessage).map((m: any) => ({
              role: m.role, content: String(m.content ?? ""),
              timestamp: typeof m.timestamp === "number" ? m.timestamp : Date.now(),
            })),
            meta: (parsed as any).meta ?? null,
          };
          localSessions = [migrated];
        } else {
          // New multi-session format
          const stored = parsed as StoredChatState;
          if (Array.isArray(stored?.sessions) && stored.sessions.length > 0) {
            localSessions = stored.sessions.filter(isValidSession).map(sanitizeSession).slice(-MAX_SESSIONS);
          }
        }
      }
    } catch { /* ignore localStorage errors */ }

    // Always start a fresh session as the active one
    const fresh = createSession();
    const merged = [fresh, ...localSessions];
    setSessions(merged);
    setActiveId(fresh.id);
    hydratedRef.current = true;

    // Phase 2: Async load from DB and merge in any sessions not in local
    loadSessionsFromDb().then((dbSessions) => {
      if (!isMountedRef.current || dbSessions.length === 0) {
        initialDbLoadDoneRef.current = true;
        return;
      }
      setSessions((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const newFromDb = dbSessions
          .filter((s) => !existingIds.has(s.id) && s.messages.length > 0)
          .map(sanitizeSession);
        if (newFromDb.length === 0) return prev;
        return [...prev, ...newFromDb].slice(-MAX_SESSIONS);
      });
      initialDbLoadDoneRef.current = true;
    }).catch(() => {
      initialDbLoadDoneRef.current = true;
    });
  }, [chatStorageKey]);

  /* ── Persist to localStorage (instant) ──────────────────────────── */
  useEffect(() => {
    if (!hydratedRef.current || !chatStorageKey) return;

    const trimmed = sessions.map((s) => ({
      ...s,
      messages: s.messages.slice(-MAX_STORED_MESSAGES),
    }));

    const state: StoredChatState = {
      sessions: trimmed.slice(-MAX_SESSIONS),
      activeId,
    };

    try {
      safeSetItem(chatStorageKey, JSON.stringify(state));
    } catch {
      // If storage fails (quota exceeded), trim more aggressively
      const minimal = trimmed.slice(-5).map((s) => ({
        ...s,
        messages: s.messages.slice(-20),
      }));
      safeSetItem(chatStorageKey, JSON.stringify({ sessions: minimal, activeId }));
    }
  }, [sessions, activeId, chatStorageKey]);

  /* ── Debounced DB sync (2s after last change) ──────────────────── */
  useEffect(() => {
    if (!hydratedRef.current || !initialDbLoadDoneRef.current) return;
    // Only sync sessions that have messages
    const sessionsWithMessages = sessions.filter((s) => s.messages.length > 0);
    if (sessionsWithMessages.length === 0) return;

    if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);
    dbSyncTimerRef.current = setTimeout(() => {
      syncSessionsToDb(sessionsWithMessages);
    }, 2000);

    return () => {
      if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);
    };
  }, [sessions]);

  /* ── Cleanup DB sync timer on unmount ───────────────────────────── */
  useEffect(() => {
    return () => {
      if (dbSyncTimerRef.current) clearTimeout(dbSyncTimerRef.current);
    };
  }, []);

  /* ── Resize handlers (mouse + touch) ───────────────────────────── */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, direction: "left" | "top" | "corner") => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      resizeDirRef.current = direction;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      resizeStartRef.current = { x: clientX, y: clientY, w: panelSize.width, h: panelSize.height };
      document.body.style.cursor = direction === "left" ? "ew-resize" : direction === "top" ? "ns-resize" : "nwse-resize";
      document.body.style.userSelect = "none";
    },
    [panelSize]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const { x, y, w, h } = resizeStartRef.current;
      const dir = resizeDirRef.current;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      let newW = w;
      let newH = h;

      if (dir === "left" || dir === "corner") {
        newW = w + (x - clientX);
      }
      if (dir === "top" || dir === "corner") {
        newH = h + (y - clientY);
      }

      // Clamp to constraints and viewport
      const maxVW = typeof window !== "undefined" ? window.innerWidth - 40 : MAX_SIZE.width;
      const maxVH = typeof window !== "undefined" ? window.innerHeight - 120 : MAX_SIZE.height;

      newW = Math.max(MIN_SIZE.width, Math.min(MAX_SIZE.width, maxVW, newW));
      newH = Math.max(MIN_SIZE.height, Math.min(MAX_SIZE.height, maxVH, newH));

      setPanelSize({ width: newW, height: newH });
    };

    const handleEnd = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setPanelSize((current) => {
          savePanelSize(current);
          return current;
        });
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  /* ── Textarea auto-grow ─────────────────────────────────────────── */
  const adjustTextareaHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  /* ── Helpers to update the active session ────────────────────────── */
  const updateActiveSession = useCallback(
    (updater: (s: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? updater(s) : s))
      );
    },
    [activeId]
  );

  /* ── Send Message (with abort controller + race condition guard) ── */
  const sendMessage = useCallback(async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || loading) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const now = Date.now();
    const userMsg: Message = { role: "user", content, timestamp: now };

    // Atomically append the user message inside the state updater
    // (avoids stale-closure bug in React 19 concurrent mode)
    updateActiveSession((s) => ({
      ...s,
      messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? (content.length > 40 ? content.slice(0, 40) + "…" : content) : s.title,
    }));
    setInput("");
    setLoading(true);
    setError(null);
    setWarnings([]);

    // Build the messages payload for the API from current state + new msg
    // We need a snapshot for the fetch body; read from sessions ref-style
    let apiMessages: { role: string; content: string }[] = [];
    setSessions((prev) => {
      const session = prev.find((s) => s.id === activeId);
      apiMessages = (session?.messages ?? []).map(({ role: r, content: c }) => ({ role: r, content: c }));
      return prev; // no mutation
    });
    // Fallback: if setSessions callback was deferred, at least send the new message
    if (apiMessages.length === 0) {
      apiMessages = [{ role: "user", content }];
    }

    // Timeout safety net
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const token = getToken();
      if (!token) {
        setError("You are not logged in. Please log in and try again.");
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          ...(groupId && { groupId }),
          ...(routeHint && { routeHint }),
        }),
        signal: controller.signal,
      });

      if (!isMountedRef.current) return;

      let data: any;
      try {
        data = await res.json();
      } catch {
        setError("Received an invalid response. Please try again.");
        return;
      }

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }
      if (res.status === 413) {
        setError("Message too long. Please shorten your message and try again.");
        return;
      }
      if (res.status === 429) {
        const fallbackText = data.answer || data.fallbackAnswer;
        if (typeof fallbackText === "string" && fallbackText.trim()) {
          updateActiveSession((s) => ({
            ...s,
            messages: [...s.messages, { role: "assistant", content: fallbackText, timestamp: Date.now() }],
            meta: data.meta ?? { modelUsed: "local-fallback", fallbackCount: 0, wasContextTrimmed: false, tokenEstimate: 0 },
          }));
          return;
        }
        setError(data.error || "Assistant is busy right now. Please retry in a minute.");
        return;
      }
      if (res.status === 504) {
        setError(data.error || "Request timed out. Please try again.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Success — append assistant message to current state (not stale closure)
      const answer = typeof data.answer === "string" ? data.answer : "Sorry, I couldn't generate a response.";
      updateActiveSession((s) => ({
        ...s,
        messages: [...s.messages, { role: "assistant", content: answer, timestamp: Date.now() }],
        meta: data.meta ?? null,
      }));
      if (Array.isArray(data.warnings) && data.warnings.length) setWarnings(data.warnings);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request was cancelled or timed out. Please try again.");
      } else {
        setError(navigator.onLine ? "Something went wrong. Please try again." : "You appear to be offline. Please check your connection.");
      }
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, [input, loading, activeId, groupId, routeHint, updateActiveSession]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    // Read current messages from sessions to avoid stale closures
    let currentMsgs: Message[] = [];
    setSessions((prev) => {
      const session = prev.find((s) => s.id === activeId);
      currentMsgs = session?.messages ?? [];
      return prev;
    });

    const lastUser = [...currentMsgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    // Remove last assistant response if it exists
    const lastMsg = currentMsgs[currentMsgs.length - 1];
    if (lastMsg?.role === "assistant") {
      updateActiveSession((s) => ({
        ...s,
        messages: s.messages.slice(0, -1),
      }));
    }

    // Resend
    setTimeout(() => sendMessage(lastUser.content), 50);
  }, [activeId, updateActiveSession, sendMessage]);

  /* ── Copy message ──────────────────────────────────────────────── */
  const copyMessage = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => {
        if (isMountedRef.current) setCopiedIdx(null);
      }, 2000);
    } catch { /* clipboard API not available — fail silently */ }
  }, []);

  /* ── Chat history / session actions ────────────────────────────── */
  const startNewChat = useCallback(() => {
    const s = createSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setShowHistory(false);
    setError(null);
    setWarnings([]);
    setConfirmClear(false);
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveId(id);
    setShowHistory(false);
    setError(null);
    setWarnings([]);
    setConfirmClear(false);
    setConfirmDeleteId(null);
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh = createSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(next[0].id);
      }
      return next;
    });
    setConfirmDeleteId(null);
  }, [activeId]);

  const clearCurrentChat = useCallback(() => {
    updateActiveSession((s) => ({ ...s, messages: [], meta: null, title: "New Chat" }));
    setError(null);
    setWarnings([]);
    setConfirmClear(false);
  }, [updateActiveSession]);

  const formatDate = (ts: number) => {
    if (!ts || isNaN(ts)) return "";
    try {
      const d = new Date(ts);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return "Today";
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  const quickPrompts = [
    "How do I add a bill?",
    "How are balances calculated?",
    "How do I settle a debt?",
    "What does Simplify Debt do?",
  ];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl flex items-center justify-center transition-all duration-200"
        aria-label="Toggle chat assistant"
        title="Ctrl+Shift+K"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {/* Offline indicator dot */}
            {!isOnline && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1a1a2e]" />
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-white/10 bg-[#1a1a2e] overflow-hidden"
          style={{
            width: `min(${panelSize.width}px, calc(100vw - 1.5rem))`,
            height: `${Math.min(panelSize.height, typeof window !== "undefined" ? window.innerHeight - 120 : 700)}px`,
            animation: "chatFadeIn 0.2s ease-out",
          }}
        >
          {/* ── Resize handles (mouse + touch) ────────────────────── */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "left")}
            onTouchStart={(e) => handleResizeStart(e, "left")}
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-[60] hover:bg-indigo-500/30 active:bg-indigo-500/40 transition-colors"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "top")}
            onTouchStart={(e) => handleResizeStart(e, "top")}
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-[60] hover:bg-indigo-500/30 active:bg-indigo-500/40 transition-colors"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "corner")}
            onTouchStart={(e) => handleResizeStart(e, "corner")}
            className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-[61]"
          />

          {/* Header */}
          <div className="px-4 py-3 bg-indigo-600 flex items-center justify-between shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm">Expense Assistant</p>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-200 text-[10px]">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    Offline
                  </span>
                )}
              </div>
              <p className="text-indigo-200 text-xs mt-0.5">Ask about your groups, bills, or balances</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Clear chat (with confirmation) */}
              {confirmClear ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearCurrentChat}
                    className="text-[10px] text-red-300 hover:text-red-200 px-1.5 py-0.5 rounded bg-red-500/20 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-[10px] text-gray-400 hover:text-gray-300 px-1.5 py-0.5 rounded bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  title="Clear current chat"
                  className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {/* History toggle */}
              <button
                onClick={() => { setShowHistory((v) => !v); setHistorySearch(""); setConfirmDeleteId(null); }}
                title="Chat history"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showHistory ? "bg-white/20" : "hover:bg-white/15"}`}
              >
                <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* New chat */}
              <button
                onClick={startNewChat}
                title="New chat"
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Meta info */}
              {meta && (
                <span
                  title={[
                    `Model: ${meta.modelUsed}`,
                    `Tokens: ~${meta.tokenEstimate}`,
                    meta.fallbackCount > 0 ? `Fallbacks: ${meta.fallbackCount}` : null,
                    meta.wasContextTrimmed ? "History was trimmed" : null,
                  ].filter(Boolean).join(" | ")}
                  className="text-indigo-300 text-xs cursor-help select-none"
                >
                  ⚙️
                </span>
              )}
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize (Esc)"
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── History panel (slide-over) ─────────────────────────── */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chat History</span>
                <button
                  onClick={() => { setShowHistory(false); setHistorySearch(""); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Back
                </button>
              </div>
              {/* Search */}
              {sessions.length > 3 && (
                <div className="px-3 pt-2">
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 placeholder-gray-600 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-500 py-8">
                  <p className="text-sm">{historySearch ? "No matching chats" : "No chats yet"}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 flex-1 overflow-y-auto">
                  {filteredSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors group ${
                        s.id === activeId ? "bg-indigo-600/20" : "hover:bg-white/5"
                      }`}
                      onClick={() => switchSession(s.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${s.id === activeId ? "text-indigo-300 font-medium" : "text-gray-300"}`}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {formatDate(s.createdAt)} · {s.messages.length} messages
                        </p>
                      </div>
                      {confirmDeleteId === s.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                            className="text-[10px] text-red-300 px-1.5 py-0.5 rounded bg-red-500/20"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-white/5"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                          title="Delete chat"
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Messages ───────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center mt-6">
                    <p className="text-3xl mb-2">💬</p>
                    <p className="text-gray-300 text-sm">Hi! I am your Splitora assistant.</p>
                    <p className="text-gray-500 text-xs mt-1">Try one of these:</p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {quickPrompts.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          disabled={loading || !isOnline}
                          className="text-xs bg-white/5 hover:bg-white/10 text-indigo-300 px-3 py-1.5 rounded-full border border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <p className="text-gray-600 text-[10px] mt-4">
                      Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Ctrl+Shift+K</kbd> to toggle · <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> to close
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={`${activeId}-${i}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[82%] group/msg">
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white/8 text-gray-200 rounded-bl-sm border border-white/10"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className="cb-markdown whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                        )}
                      </div>
                      {/* Timestamp + Copy */}
                      <div className={`flex items-center gap-2 mt-0.5 px-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => copyMessage(msg.content, i)}
                            className="opacity-0 group-hover/msg:opacity-100 text-[10px] text-gray-500 hover:text-indigo-400 transition-all flex items-center gap-0.5"
                            title="Copy message"
                          >
                            {copiedIdx === i ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator with cancel */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <span className="flex gap-1 items-center">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                        <span className="text-[11px] text-indigo-300/70 ml-2">Thinking…</span>
                        <button
                          onClick={cancelRequest}
                          className="ml-2 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex justify-between items-start gap-2">
                    <p className="text-red-400 text-xs">{error}</p>
                    <button onClick={retry} className="text-xs text-red-400 underline shrink-0">Retry</button>
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <p className="text-yellow-500/70 text-xs text-center">⚠️ {warnings[0]}</p>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="border-t border-white/10 p-3 flex flex-col gap-1 bg-[#1a1a2e] shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= MAX_INPUT_LENGTH) {
                        setInput(val);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={isOnline ? "Ask about expenses, balances, groups..." : "You are offline..."}
                    rows={1}
                    maxLength={MAX_INPUT_LENGTH}
                    disabled={loading || !isOnline}
                    className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    style={{ maxHeight: "100px", overflowY: "auto" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading || !isOnline}
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    title="Send message"
                  >
                    <svg className="w-4 h-4 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                {/* Character counter */}
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[10px] text-gray-600">
                    Shift+Enter for new line
                  </span>
                  <span className={`text-[10px] tabular-nums ${input.length > MAX_INPUT_LENGTH * 0.9 ? "text-red-400" : input.length > MAX_INPUT_LENGTH * 0.75 ? "text-yellow-500" : "text-gray-600"}`}>
                    {input.length}/{MAX_INPUT_LENGTH}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Inline styles for markdown and animations */}
      <style jsx global>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cb-markdown strong { font-weight: 700; }
        .cb-markdown em { font-style: italic; }
        .cb-code-block {
          display: block;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 10px;
          margin: 6px 0;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre;
        }
        .cb-inline-code {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 1px 5px;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 12px;
        }
        .cb-list {
          list-style: none;
          padding-left: 0;
          margin: 4px 0;
        }
        .cb-list-item {
          position: relative;
          padding-left: 14px;
          margin-bottom: 2px;
        }
        .cb-list-item::before {
          content: '•';
          position: absolute;
          left: 2px;
          color: #818cf8;
        }
        .cb-list-item.cb-list-num::before {
          content: counter(cb-num) '.';
          counter-increment: cb-num;
          color: #818cf8;
          font-size: 11px;
        }
        .cb-list:has(.cb-list-num) {
          counter-reset: cb-num;
        }
        .cb-hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 8px 0;
        }
        .cb-link {
          color: #818cf8;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .cb-link:hover {
          color: #a5b4fc;
        }
      `}</style>
    </>
  );
}
