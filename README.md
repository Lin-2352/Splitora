# Splitora

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-microservices-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

Production-style expense sharing platform for groups, with automated receipt scanning, AI-driven insights, and a context-aware in-app assistant.

## Table of Contents

- [Overview](#overview)
- [Feature Set](#feature-set)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Operational Commands](#operational-commands)
- [API Surface](#api-surface)
- [Chatbot (In-App Assistant)](#chatbot-in-app-assistant)
- [Security and Reliability Notes](#security-and-reliability-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

Splitora consists of three coordinated services:

- **Web Platform (`Next.js`)**: Auth, group management, expenses, balances, settlements, analytics, and chatbot UI.
- **Receipt Scanner (`backend/`)**: FastAPI OCR pipeline for extracting structured bill data from uploaded images.
- **Recommendation Engine (`ml-service/`)**: FastAPI hybrid classifier + spending recommendation service.

The platform is optimized for group expense workflows and includes resilient fallbacks for AI-assisted features.

## Feature Set

- JWT-based authentication: signup, login, forgot password, reset password
- Group lifecycle operations: create, join by invite code, member management, leave, delete
- Flexible expense splitting: `equal`, `exact`, `percentage`, `shares`
- Group balances + debt minimization (`simplify-debt`)
- Settlement lifecycle: create, list, delete, bulk settle
- Bill image upload + OCR extraction pipeline integration
- Dashboard and analytics visualizations (`recharts`)
- Built-in AI assistant with:
  - domain guardrails
  - model routing with fallback strategy
  - route/group grounding context
  - persisted multi-session chat history

## Architecture

```text
Client (Next.js App Router)
  -> Next.js Route Handlers (/api/*)
      -> MongoDB (Mongoose models)
      -> Groq API (chat completion, with fallback handling)
      -> Receipt Scanner Service (FastAPI OCR)
      -> Recommendation Service (FastAPI ML)
```

## Repository Layout

```text
Splitora/
  app/                # Next.js pages and API route handlers
  components/         # UI components (auth, dashboard, groups, chat)
  lib/ai/             # AI context, routing, fallback, guardrails
  middleware/         # Mongo, auth, imagekit, mail transport
  models/             # Mongoose schemas
  backend/            # Receipt OCR FastAPI service
  ml-service/         # ML recommendation FastAPI service
```

## Technology Stack

- **Frontend/API**: Next.js 16, React 19, TypeScript
- **Styling/UI**: Tailwind CSS v4, Framer Motion, Recharts
- **Data**: MongoDB + Mongoose
- **Security/Auth**: JWT + bcrypt
- **Email**: Nodemailer (Gmail transport)
- **Media**: ImageKit
- **AI Chat**: Groq API
- **OCR Service**: FastAPI + OpenCV + Tesseract pipeline
- **ML Service**: FastAPI + transformers + torch

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Python 3.10+
- MongoDB connection string
- (Recommended) Tesseract installed and on PATH for local OCR quality

### 1) Web app

```bash
npm install
npm run dev
```

Web URL: `http://localhost:3000`

### 2) Receipt scanner (`backend/`)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`

### 3) ML recommendation service (`ml-service/`)

```bash
cd ml-service
pip install -r requirements.txt
python -m uvicorn src.main:app --host 0.0.0.0 --port 8001
```

Health check: `http://localhost:8001/health`

## Environment Configuration

Your current workspace `.env.local` already includes core runtime keys for app + chat:

```env
MONGODB_URI=
JWT_SECRET=

GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL_PRIORITY=llama-3.3-70b-versatile,llama-3.1-8b-instant,deepseek-r1-distill-llama-70b
GROQ_TIMEOUT_MS=30000

CHAT_MAX_INPUT_CHARS=2000
CHAT_MAX_HISTORY_TURNS=20
CHAT_RESERVED_OUTPUT_TOKENS=1024
CHAT_DEFAULT_SYSTEM_PROMPT=
```

For complete local feature coverage, add:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
EMAIL=
EMAIL_PASS=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

RECEIPT_SCANNER_URL=http://localhost:8000
ML_SERVICE_URL=http://localhost:8001
```

### Variable reference

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection for all app data |
| `JWT_SECRET` | Yes | Token signing and verification |
| `GROQ_API_KEY` | Yes (chat) | AI assistant inference |
| `GROQ_BASE_URL` | No | Groq API endpoint override |
| `GROQ_MODEL_PRIORITY` | No | Model failover order |
| `GROQ_TIMEOUT_MS` | No | Upstream timeout for Groq calls |
| `CHAT_MAX_INPUT_CHARS` | No | Max user input size in chat API |
| `CHAT_MAX_HISTORY_TURNS` | No | Chat history cap sent to model |
| `CHAT_RESERVED_OUTPUT_TOKENS` | No | Completion token budget reserve |
| `CHAT_DEFAULT_SYSTEM_PROMPT` | No | Additional system prompt override |
| `NEXT_PUBLIC_BASE_URL` | Required for reset email links | URL used in password reset emails |
| `EMAIL`, `EMAIL_PASS` | Required for forgot-password emails | SMTP credentials |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | Required for bill upload | Image storage/upload integration |
| `RECEIPT_SCANNER_URL` | Recommended | OCR endpoint base URL |
| `ML_SERVICE_URL` | Required for recommendation endpoint | ML recommendation service URL |

## Operational Commands

From repository root:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## API Surface

All application routes are served under `/api/*`. Folder route groups like `(group)` and `(login)` are organizational only and do not appear in URLs.

### Authentication

- `POST /api/register`
- `POST /api/login`
- `POST /api/forget-password`
- `POST /api/reset-password`
- `GET /api/verify-reset-token?token=...`

### Group Management

- `POST /api/createGroup`
- `POST /api/join`
- `GET /api/getMyGroups`
- `GET /api/getSingleGroup/:groupId`
- `DELETE /api/removeMembers`
- `DELETE /api/leaveGroup/:groupId`
- `DELETE /api/deleteGroup/:groupId`

### Transactions and Balances

- `POST /api/:groupId/createTransactions`
- `GET /api/:groupId/getGroupTransactions`
- `DELETE /api/:groupId/deleteTransactions/:transactionId`
- `GET /api/:groupId/activity`
- `GET /api/:groupId/balance`
- `POST /api/:groupId/simplify-debt`

### Settlements

- `POST /api/:groupId/createSettlement`
- `GET /api/:groupId/getSettlement`
- `POST /api/:groupId/bulk`
- `DELETE /api/:groupId/deleteSettlement/:settleId`

### Bills and OCR

- `POST /api/:groupId/bill/upload`
- `GET /api/:groupId/bill/bills`
- `POST /api/:groupId/bill/process`
- `POST /api/:groupId/bill/:billId/convert`
- `POST /api/:groupId/scan-receipt`

### Dashboard and AI

- `GET /api/user/dashboard/treemap`
- `GET /api/user/dashboard/big-graph`
- `POST /api/:groupId/recommendations`
- `POST /api/chat`
- `GET /api/chat/history`
- `POST /api/chat/history`

### External service endpoints

- Receipt scanner (`backend/`): `POST /scan-receipt`, `GET /health`
- ML service (`ml-service/`): `GET /health`, `POST /classify`, `POST /bulk-classify`, `POST /recommend`

## Chatbot (In-App Assistant)

The chatbot is a first-class product feature, implemented in `components/chat/ChatBot.tsx` and mounted in `app/dashboard/layout.tsx`.

### Availability and scope

- Available across authenticated dashboard surfaces (`/dashboard`, `/dashboard/groups`, `/dashboard/analytics`).
- Not mounted on public/auth pages.
- Requests are authorized with the same JWT flow used across the app (`Authorization: Bearer <token>`).

### UX capabilities (implemented)

- Floating toggle button + backdrop click-to-close behavior.
- Desktop resizable panel (`left`, `top`, `corner` handles) with persisted panel size.
- Mobile bottom-sheet mode (`~65dvh`) with responsive behavior.
- Session management: new chat, switch chat, search history, delete chat, clear current chat.
- Copy assistant responses, message timestamps, quick prompts, retry, and in-flight cancel.
- Network-aware UI: offline indicator and input disable while offline.

### Keyboard shortcuts

- `Ctrl + Shift + K`: Toggle chatbot
- `Escape`: Close confirmations/history/panel in sequence
- `Enter`: Send message
- `Shift + Enter`: Insert newline

### Persistence model

- Primary local cache in `localStorage` using a user-scoped key (`splitora_chat:<userId>`).
- Multi-session state persisted locally and synced to MongoDB via `POST /api/chat/history`.
- DB hydration on startup via `GET /api/chat/history`.
- Current caps enforced in code/schema:
  - up to `30` sessions
  - up to `60` messages per session
  - message content capped to `4000` chars on server-side history persistence
- Debounced DB sync (`~2s`) and graceful local fallback on storage/quota issues.

### Request lifecycle (`/api/chat`)

```text
ChatBot UI
  -> JWT auth check
  -> /api/chat payload sanitize + turn caps
  -> domain guard (greeting / out-of-scope / domain redirect)
  -> live grounding context (user/group snapshot when needed)
  -> model router (Groq priority list + retry/fallback)
  -> response + meta (modelUsed, fallbackCount, tokenEstimate, warnings)
```

### Guardrails and safety

- Strict domain guard to keep answers Splitora-specific (`lib/ai/domainGuard.ts`).
- Client-side markdown rendering with explicit HTML escaping before formatting.
- Client blocks/handles oversized input (`MAX_INPUT_LENGTH=2000`) and request timeout (`30s`).
- Server-side payload guard (`64 KB`) and role sanitization (`user`/`assistant` only, strips client `system`).

### Fallback behavior

- Model routing uses `GROQ_MODEL_PRIORITY` order and can trim context when needed.
- Rate-limit handling includes single retry with backoff per model before switching.
- If upstream fails, local fallback responses are generated by intent (add bill, settle, balances, analytics, etc.).
- Chat metadata exposes fallback/context-trim signals for observability in UI.

### Chat-specific environment knobs

- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GROQ_MODEL_PRIORITY`
- `GROQ_TIMEOUT_MS`
- `CHAT_MAX_INPUT_CHARS`
- `CHAT_MAX_HISTORY_TURNS`
- `CHAT_RESERVED_OUTPUT_TOKENS`
- `CHAT_DEFAULT_SYSTEM_PROMPT`

### Chat APIs

- `POST /api/chat`: Generate assistant reply (authenticated)
- `GET /api/chat`: Returns `405` (method not allowed)
- `GET /api/chat/history`: Fetch persisted sessions for current user
- `POST /api/chat/history`: Upsert sanitized sessions for current user

## Security and Reliability Notes

- JWT is required for protected APIs; token is expected via `Authorization: Bearer ...`.
- Chat payload size and message history are bounded in `/api/chat`.
- Chat history persistence sanitizes and caps sessions/messages server-side.
- OCR calls and external AI calls include timeout logic and fallback behavior.
- Never commit real credentials. Use placeholders in docs and rotate any exposed secrets.

## Troubleshooting

- **Port already in use (3000/8000/8001)**: stop existing processes, then restart services.
- **Mongo connection issues**: verify `MONGODB_URI` and network/whitelist settings.
- **Chat not responding**: check `GROQ_API_KEY`, model list, and timeout settings.
- **Bill upload failures**: verify ImageKit keys and endpoint.
- **Recommendations unavailable**: ensure `ML_SERVICE_URL` points to a running service.

## Contributing

1. Fork and create a feature branch.
2. Keep changes scoped and documented.
3. Run lint/build checks before opening PR.
4. Include API or behavior notes when modifying routes/services.

## Roadmap

- CI workflow for lint/build/test matrix
- Dockerized local orchestration for all services
- Enhanced role/permission model for groups
- Expanded analytics and recommendation explainability
- Stronger observability (structured logs + health dashboards)

## License

No license file is currently present in this repository.
