// lib/ai/groq.ts
// Groq HTTP client - server-side only

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GroqRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface GroqResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface GroqError {
  status: number;
  message: string;
  isRateLimit: boolean;
  isServerError: boolean;
  isContextOverflow: boolean;
  retryAfterMs?: number;
}

const BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const TIMEOUT_MS = parseInt(process.env.GROQ_TIMEOUT_MS ?? "30000", 10);

const CONTEXT_OVERFLOW_PATTERNS = [
  "context_length_exceeded",
  "maximum context",
  "too many tokens",
  "context window",
  "prompt is too long",
];

function isContextOverflow(body: string): boolean {
  const lower = body.toLowerCase();
  return CONTEXT_OVERFLOW_PATTERNS.some((p) => lower.includes(p));
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;

  const asSeconds = Number(value);
  if (!Number.isNaN(asSeconds) && asSeconds >= 0) {
    return Math.floor(asSeconds * 1000);
  }

  const asDateMs = Date.parse(value);
  if (!Number.isNaN(asDateMs)) {
    const delta = asDateMs - Date.now();
    return delta > 0 ? delta : 0;
  }

  return undefined;
}

export async function callGroq(req: GroqRequest): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        max_tokens: req.max_tokens ?? 1024,
        temperature: req.temperature ?? 0.7,
      }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    throw {
      status: isAbort ? 408 : 503,
      message: isAbort ? "Request timed out" : "Network error reaching Groq",
      isRateLimit: false,
      isServerError: true,
      isContextOverflow: false,
      retryAfterMs: undefined,
    } as GroqError;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw {
      status: res.status,
      message: `Groq ${res.status}: ${body.slice(0, 300)}`,
      isRateLimit: res.status === 429,
      isServerError: res.status >= 500,
      isContextOverflow: isContextOverflow(body),
      retryAfterMs: parseRetryAfterMs(res.headers.get("retry-after")),
    } as GroqError;
  }

  return res.json() as Promise<GroqResponse>;
}

