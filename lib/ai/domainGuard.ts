const DOMAIN_KEYWORDS = [
  "splitora",
  "website",
  "app",
  "dashboard",
  "group",
  "groups",
  "member",
  "members",
  "invite",
  "bill",
  "expense",
  "transaction",
  "settlement",
  "settle",
  "balance",
  "owed",
  "owe",
  "analytics",
  "chart",
  "treemap",
  "heatmap",
  "monthly",
  "simplify debt",
  "receipt",
  "upload",
  "login",
  "signup",
  "password",
  "reset",
  "how do i",
  "how to",
  "what can you do",
  "what is this",
  // Finance / math / accounting — common for a bill-splitting app
  "divide",
  "split",
  "calculate",
  "per person",
  "each person",
  "share",
  "total",
  "sum",
  "amount",
  "cost",
  "price",
  "payment",
  "pay",
  "paid",
  "money",
  "rupee",
  "dollar",
  "percent",
  "percentage",
  "average",
  "debt",
  "credit",
  "debit",
  "refund",
  "reimburse",
  "contribution",
  "how much",
  "remaining",
  "outstanding",
  "budget",
  "spending",
  "saving",
  "income",
  "tax",
  "tip",
  "discount",
  "subtotal",
  "grand total",
  "equal",
  "unequal",
  "ratio",
  "proportion",
  "fee",
  "charge",
  "interest",
  "loan",
  "borrow",
  "lend",
];

const OUT_OF_SCOPE_KEYWORDS = [
  "write code",
  "generate code",
  "python",
  "java",
  "javascript",
  "typescript",
  "react code",
  "leetcode",
  "algorithm",
  "debug my code",
  "homework",
  "assignment",
  "joke",
  "poem",
  "story",
  "news",
  "weather",
  "stock",
  "crypto",
  "recipe",
  "translate",
  "movie",
  "song",
  "general knowledge"
];

const GREETING_RE = /^(hi|hii|hello|hey|yo|hola)\b[!.\s]*$/i;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

export function isGreeting(message: string): boolean {
  return GREETING_RE.test(normalize(message));
}

export function isLikelyDomainQuestion(message: string): boolean {
  const q = normalize(message);
  if (!q) return false;
  return includesAny(q, DOMAIN_KEYWORDS);
}

export function isOutOfScopeQuestion(message: string): boolean {
  const q = normalize(message);
  if (!q) return false;

  const looksOutOfScope = includesAny(q, OUT_OF_SCOPE_KEYWORDS);
  const looksDomain = isLikelyDomainQuestion(q);

  return looksOutOfScope && !looksDomain;
}

export function buildGreetingReply(): string {
  return "Hey! Great to see you. What can I help you with in Splitora right now?";
}

export function buildOutOfScopeReply(): string {
  return "I am here to help with Splitora only - things like groups, bills, balances, settlements, and feature guidance. I cannot take general requests like writing code.";
}
