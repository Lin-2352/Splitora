// lib/ai/projectContext.ts
// Builds the system prompt grounded in YOUR actual app structure.
// Based on real models: userSchema, groupSchema, TransactionSchema, settleSchema, billSchema

export interface ContextOptions {
  groupId?: string;
  userName?: string;
  routeHint?: string; // "dashboard" | "groups" | "bills" | "settlements" | "analytics"
  verifiedSnapshot?: string;
  strictNoGuessNote?: string;
}

// ---------------------------------------------------------------------------
// Grounded app description (matches your actual Mongoose schemas)
// ---------------------------------------------------------------------------
const APP_OVERVIEW = `
You are a support assistant for Splitora only.

## Scope (Allowed)
- Help users understand Splitora's purpose, features, pages, and workflows.
- Explain how to do tasks inside Splitora: creating groups, joining via invite code, adding expenses, settlements, balances, analytics, and bill upload flow.
- Help troubleshoot user confusion about steps inside Splitora.

## Scope (Not Allowed)
- Do NOT answer generic requests outside Splitora (coding help, essays, jokes, weather, general knowledge, etc.).
- If user asks out-of-scope things, refuse briefly and redirect to Splitora topics.

## App Features
- **Groups**: Users create or join groups (e.g. "Goa Trip", "Roommates"). Each group has members with roles (admin/member).
- **Transactions (Expenses)**: Members add expenses to a group. Each transaction has a payer, a total amount, a description, a category, and a splits array — each split has a user and the amount they owe.
- **Settlements**: When someone pays a debt, it's recorded as a settlement (fromUser -> toUser, amount). Settlements reduce balances.
- **Bills**: Users can upload receipt images. Splitora uses OCR to extract bill data and suggest how to split it.
- **Balances**: Splitora calculates net balance per user in a group by summing transactions and settlements.
- **Analytics / Dashboard**: Users see charts - credit vs spending over time, group treemap, heatmaps, monthly summaries.
- **Simplify Debt**: Groups can simplify debts to minimize the number of transactions needed.

## Hallucination Safety Rules
- Never invent endpoints, field names, features, numbers, balances, names, or counts.
- If user asks for exact values, use VERIFIED DATA SNAPSHOT only.
- If snapshot is missing required value, clearly say data is unavailable right now and ask user to open/select the relevant page/group.
- Keep answers short, natural, and actionable.
- Never ask for or repeat passwords, tokens, or secrets.
`.trim();

const ROUTE_HINTS: Record<string, string> = {
  dashboard:
    "The user is on the main Dashboard. They may ask about their overall balance, recent activity, or charts.",
  groups:
    "The user is on the Groups page. They may ask about creating groups, inviting members, or viewing group lists.",
  bills:
    "The user is on the Bills/Expenses section. They may ask about adding expenses, uploading receipts, or how splits work.",
  settlements:
    "The user is on the Settlements page. They may ask about settling debts, marking payments, or understanding who owes whom.",
  analytics:
    "The user is on the Analytics page. They may ask about spending charts, credit vs spending, group treemaps, or heatmaps.",
};

export function buildSystemPrompt(options: ContextOptions = {}): string {
  const parts: string[] = [APP_OVERVIEW];

  if (options.userName) {
    parts.push(`\n## Current User\nThe user's name is ${options.userName}.`);
  }

  if (options.routeHint) {
    const hint = ROUTE_HINTS[options.routeHint.toLowerCase()];
    if (hint) parts.push(`\n## Current Page\n${hint}`);
  }

  if (options.groupId) {
    parts.push(
      `\n## Group Scope\nThe user is currently viewing a specific group (ID: ${options.groupId}). When they say "this group", "our expenses", etc., they mean this group.`
    );
  }

  if (options.strictNoGuessNote) {
    parts.push(`\n## Strict Data Rule\n${options.strictNoGuessNote}`);
  }

  if (options.verifiedSnapshot) {
    parts.push(`\n## VERIFIED DATA SNAPSHOT\n${options.verifiedSnapshot}`);
  }

  const custom = process.env.CHAT_DEFAULT_SYSTEM_PROMPT;
  if (custom) parts.push(`\n## Extra Instructions\n${custom}`);

  return parts.join("\n");
}
