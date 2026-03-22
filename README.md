# 💬 Splitora — Expense Assistant (Chatbot)

A professional-grade, floating AI chat assistant built into the Splitora expense-splitting dashboard. Context-aware, resizable, persistent, and hardened against edge cases.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [How It Works](#how-it-works)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Edge Case Handling](#edge-case-handling)
- [Extending for New Features](#extending-for-new-features)
- [FAQ](#faq)

---

## Overview

The Expense Assistant is a floating chatbot widget rendered inside the dashboard layout (`app/dashboard/layout.tsx`). It helps users understand and navigate Splitora's features — groups, expenses, bills, balances, settlements, analytics, and more.

**Key properties:**
- 🧠 **Context-aware** — automatically detects the current page (Dashboard, Groups, Analytics, Bills) and sends route context to the AI
- 💾 **Persistent** — chat sessions survive page navigation, browser refresh, and even logout/login (synced to MongoDB)
- 🔄 **Multi-session** — supports multiple named chat sessions with full history
- 📐 **Resizable** — drag-to-resize from left edge, top edge, or corner
- ⚡ **Auto-minimize** — closes on page navigation, restores exactly where you left off
- 🛡️ **Hardened** — comprehensive edge case handling (XSS, offline, corrupted storage, timeouts, etc.)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Layout                      │
│   ┌──────────┐  ┌────────────────────┐  ┌────────────┐ │
│   │ Sidebar  │  │   Page Content     │  │  ChatBot   │ │
│   │          │  │   (children)       │  │  (floating) │ │
│   └──────────┘  └────────────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                                      │
         └──── Page navigation ────────────────▶│ auto-minimize
                                                │
              ┌─────────────────────────────────┤
              │                                 │
   ┌──────────▼──────────┐         ┌────────────▼─────────┐
   │  /api/chat (POST)   │         │ /api/chat/history    │
   ├─────────────────────┤         ├──────────────────────┤
   │ 1. Auth (JWT)       │         │ GET  — load sessions │
   │ 2. Domain Guard     │         │ POST — save sessions │
   │ 3. Live Data Context│         │ Auth + Validation    │
   │ 4. System Prompt    │         │ MongoDB (per-user)   │
   │ 5. AI Model Router  │         └──────────────────────┘
   │ 6. Fallback Handler │
   └─────────────────────┘
```

### Data Flow

1. **User types a message** → `ChatBot.tsx` sends POST to `/api/chat`
2. **API authenticates** via JWT from `localStorage`
3. **Domain guard** filters greetings, out-of-scope requests, and non-Splitora questions
4. **Live data context** fetches relevant user/group data from MongoDB
5. **System prompt** is built with app documentation + user context + route hint
6. **Model router** tries Groq AI models with automatic fallback between model variants
7. **Response** is returned with metadata (model used, token count, etc.)
8. **ChatBot renders** the response with markdown formatting
9. **DB sync** — 2 seconds after the last session change, sessions with messages are saved to MongoDB via `/api/chat/history`

### Persistence Flow

```
On mount:  localStorage (instant) ──▶ render ──▶ async fetch from MongoDB ──▶ merge new sessions
On change: update state ──▶ write localStorage ──▶ debounced POST to /api/chat/history (2s)
On login:  localStorage empty ──▶ fetch from MongoDB ──▶ restore all history
```

---

## Features

### Core Chat
| Feature | Description |
|---------|-------------|
| **AI-powered responses** | Context-aware answers about Splitora features and workflows |
| **Multi-session history** | Create, switch, search, and delete chat sessions |
| **Route context** | Automatically sends current page (Dashboard/Groups/Analytics/Bills) to the AI |
| **Group context** | When inside a specific group, the AI knows which group you're referencing |
| **Quick prompts** | One-click starter questions for new users |
| **Session persistence** | Hybrid: `localStorage` for instant access + MongoDB for cross-session durability (survives logout/login) |
| **Server-side history** | Chat sessions synced to MongoDB via `/api/chat/history` with debounced background writes |

### UI/UX
| Feature | Description |
|---------|-------------|
| **Drag-to-resize** | Left edge, top edge, and top-left corner handles (mouse + touch) |
| **Size persistence** | Panel dimensions saved to `localStorage` |
| **Auto-minimize** | Panel closes automatically when navigating between pages |
| **State preservation** | Draft text, messages, and scroll position all preserved across minimize/restore |
| **Fade-in animation** | Smooth scale + opacity animation on open |
| **Escape key** | Closes confirmation dialogs → history → panel (priority order) |
| **Close/minimize button** | Down-arrow button in the header |

### Professional Features
| Feature | Description |
|---------|-------------|
| **Markdown rendering** | Bold, italic, code blocks, inline code, numbered & bullet lists, horizontal rules, links |
| **Message timestamps** | HH:MM timestamp on every message bubble |
| **Copy button** | Hover any assistant reply → copy icon → ✓ feedback for 2 seconds |
| **Character counter** | `{n}/2000` with color-coded warnings (yellow at 75%, red at 90%) |
| **Textarea auto-grow** | Input field expands as you type multi-line messages |
| **Cancel request** | ✕ button next to "Thinking…" indicator to abort in-flight requests |
| **Confirmation dialogs** | Clear chat and delete session require confirmation |
| **Session search** | Search bar in history panel to filter sessions by title or content |
| **Online/offline indicator** | Red dot on FAB + "Offline" badge in header + disabled input |
| **Meta info tooltip** | ⚙️ icon shows model used, token count, fallback info |
| **Shift+Enter hint** | Helper text below textarea |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + K` | Toggle chatbot open/closed |
| `Escape` | Close current dialog / history / panel |
| `Enter` | Send message |
| `Shift + Enter` | New line in textarea |

---

## How It Works

### Auto-Minimize on Navigation

When the user navigates (e.g., from Dashboard to Groups), a `useEffect` watching `pathname` detects the change and sets `isOpen = false`. Since all state lives in `useState` hooks at the layout level (not inside the panel's conditional render), **nothing is lost**. Clicking the FAB restores the exact conversation state, including draft text in the textarea.

```tsx
useEffect(() => {
  if (prevPathnameRef.current !== pathname) {
    if (isOpen) setIsOpen(false);
    prevPathnameRef.current = pathname;
  }
}, [pathname, isOpen]);
```

### Resizable Panel

Three invisible drag handles (left, top, corner) capture `mousedown`/`touchstart` events.  
During drag, `mousemove`/`touchmove` listeners compute the delta and update `panelSize` state.  
On release, the final size is clamped to `[320×350, 700×700]` and persisted to `localStorage`.

### Session Management

Sessions are stored as a `StoredChatState` object in `localStorage`:

```typescript
interface StoredChatState {
  sessions: ChatSession[];  // max 30 sessions
  activeId: string | null;
}

interface ChatSession {
  id: string;
  title: string;        // derived from first user message
  createdAt: number;
  messages: Message[];   // max 60 messages per session
  meta: MetaInfo | null;
}
```

### Domain Guard (Server-side)

The API performs three checks before calling the AI model:

1. **Greeting detection** — "hi", "hello", "hey" → instant local reply
2. **Out-of-scope detection** — coding, jokes, weather, crypto → polite refusal
3. **Domain keyword matching** — must contain Splitora-related keywords to proceed

This saves API credits and provides instant responses for common inputs.

### Fallback System

If all AI models fail (rate limit, timeout, config error), the server returns a **local fallback response** based on keyword matching of the user's question. This ensures the chatbot **never leaves the user without an answer**.

---

## File Structure

```
components/
└── chat/
    └── ChatBot.tsx              ← Main component (all UI + logic + DB sync)

models/
└── chatHistorySchema.ts         ← Mongoose schema for per-user chat history

app/
├── api/
│   └── chat/
│       ├── route.ts             ← Chat API endpoint (auth, guard, AI routing)
│       └── history/
│           └── route.ts         ← Chat history API (GET load / POST save)
└── dashboard/
    └── layout.tsx               ← Renders <ChatBot /> once for all dashboard pages

lib/
└── ai/
    ├── domainGuard.ts           ← Greeting/scope keyword filters
    ├── projectContext.ts        ← System prompt builder with app documentation
    ├── liveDataContext.ts       ← Fetches real user/group data from DB
    ├── modelRouter.ts           ← Multi-model AI routing with fallback
    ├── groq.ts                  ← Groq API client
    ├── fallbackResponder.ts     ← Local keyword-based fallback answers
    └── contextManager.ts       ← Context trimming utilities
```

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key for primary AI model | — |
| `GROQ_MODEL_PRIORITY` | Comma-separated model priority list | `llama-3.3-70b-versatile,llama-3.1-8b-instant,deepseek-r1-distill-llama-70b` |
| `MONGODB_URI` | MongoDB connection string (required for chat history) | — |
| `JWT_SECRET` | JWT signing secret (required for auth) | — |
| `CHAT_MAX_INPUT_CHARS` | Max characters per user message | `2000` |
| `CHAT_MAX_HISTORY_TURNS` | Max conversation turns sent to AI | `20` |
| `CHAT_DEFAULT_SYSTEM_PROMPT` | Additional system prompt instructions | — |

### Storage

| Location | Key / Collection | Description |
|----------|-------------------|-------------|
| `localStorage` | `splitora_chat:{userId}` | Instant-access cache of chat sessions |
| `localStorage` | `splitora_chat_size` | Panel width/height dimensions |
| MongoDB | `chathistories` collection | Durable per-user chat history (max 30 sessions × 60 messages) |

---

## Edge Case Handling

The chatbot is hardened against the following scenarios:

| Category | Edge Case | How It's Handled |
|----------|-----------|------------------|
| **Security** | XSS via markdown | Full HTML entity escaping (`&`, `<`, `>`, `"`, `'`) before rendering |
| **Security** | System prompt injection | Server-side: client-sent `system` role messages are stripped |
| **Network** | Fetch hangs | 30-second timeout via `AbortController` |
| **Network** | User goes offline | Online/offline detection, input disabled, visual indicator |
| **Network** | Rapid double-send | `AbortController` cancels in-flight request before new one |
| **State** | Stale closure on messages | Messages read from `setSessions` callback, not stale variable |
| **State** | State update after unmount | `isMountedRef` guard on all async callbacks |
| **Storage** | Corrupted JSON in localStorage | `try/catch` with validation, falls back to fresh session |
| **Storage** | Invalid session objects | `isValidSession`, `isValidMessage`, `sanitizeSession` validators |
| **Storage** | localStorage quota exceeded | Graceful fallback: trim to 5 sessions × 20 messages |
| **Storage** | Private browsing mode | All storage access wrapped in `safeGetItem` / `safeSetItem` |
| **UX** | Accidental clear/delete | Confirmation dialogs with "Confirm" / "Cancel" |
| **UX** | Panel exceeds viewport | Clamped to `window.innerWidth - 40` / `window.innerHeight - 120` |
| **UX** | No token (logged out) | Clear error: "You are not logged in. Please log in and try again." |
| **UX** | Invalid API response body | `try/catch` on `res.json()` with user-friendly error |
| **UI** | React key collisions | Stable keys using `${sessionId}-${messageIndex}` |
| **API** | Payload too large (413) | User-friendly error: "Message too long" |
| **API** | Session expired (401) | Error: "Session expired. Please log in again." |

---

## Extending for New Features

When new features are added to Splitora, the chatbot can be extended at three levels:

### 1. Domain Guard — `lib/ai/domainGuard.ts`

Add keywords for the new feature so the chatbot recognizes related questions:

```typescript
const DOMAIN_KEYWORDS = [
  // ... existing keywords
  "budget",           // ← new feature keyword
  "spending limit",   // ← new feature keyword
];
```

### 2. System Prompt — `lib/ai/projectContext.ts`

Add documentation about the new feature in `APP_OVERVIEW`:

```typescript
const APP_OVERVIEW = `
  ...
  - **Budgets**: Users can set monthly spending limits per group.
    When spending exceeds the budget, a warning alert is shown on the dashboard.
`;
```

Add a route hint if the feature has its own page:

```typescript
const ROUTE_HINTS: Record<string, string> = {
  // ... existing hints
  budgets: "The user is on the Budgets page. They may ask about setting or viewing spending limits.",
};
```

### 3. Fallback Responder — `lib/ai/fallbackResponder.ts`

Add a keyword-matched fallback answer for when AI models are unavailable:

```typescript
if (includesAny(q, ["budget", "spending limit", "limit"])) {
  return {
    reason: input.reason,
    intent: "budget",
    answer: "To set a budget: go to Dashboard → Budget card → Set Budget → enter your monthly limit.",
  };
}
```

### 4. Route Context — `components/chat/ChatBot.tsx`

If the new feature has a dedicated route, update `deriveRouteContext`:

```typescript
function deriveRouteContext(pathname, params) {
  // ... existing logic
  if (pathname.includes("/budgets")) {
    routeHint = "budgets";
  }
}
```

---

## FAQ

**Q: Does the chatbot require its own backend server?**  
A: No. It uses a Next.js API route (`/api/chat`) — same server, same deployment.

**Q: What AI models does it use?**  
A: Configurable via environment variables. Uses Groq with automatic fallback between model variants. If all models fail, a local keyword matcher provides answers.

**Q: Does it store data on a server?**  
A: Yes. Chat history is synced to MongoDB via `/api/chat/history`. `localStorage` serves as a fast cache, while MongoDB provides durable cross-session persistence. Sessions are synced to the server 2 seconds after any change.

**Q: What happens if localStorage is full?**  
A: It gracefully trims to 5 sessions with 20 messages each. If that still fails, it continues working with DB-only persistence.

**Q: What happens if MongoDB is unavailable?**  
A: The chatbot falls back to `localStorage`-only mode. DB sync failures are silently ignored — the user experience is unaffected.

**Q: Can the chatbot answer questions about other topics?**  
A: No. The domain guard and system prompt strictly limit it to Splitora-related topics only.

**Q: How do I disable the chatbot?**  
A: Remove `<ChatBot />` from `app/dashboard/layout.tsx`.

**Q: Does it work on mobile?**  
A: Yes. Resize handles support touch events, the panel respects viewport bounds, and the UI is fully responsive.

---

*Built with React 19, Next.js 16, TypeScript, Tailwind CSS 4, Mongoose 8, and MongoDB.*
