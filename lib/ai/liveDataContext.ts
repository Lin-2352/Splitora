import mongoose from "mongoose";
import createMongoConnection from "@/middleware/mongoDB";
import Group from "@/models/groupSchema";
import Transaction from "@/models/TransactionSchema";
import Settlement from "@/models/settleSchema";
import "@/models/userSchema";

interface LiveContextInput {
  userId: string;
  groupId?: string;
  routeHint?: string;
  lastUserMessage: string;
}

interface LiveContextResult {
  snapshotText?: string;
  strictNoGuessNote?: string;
}

interface GroupMemberLike {
  user: { _id?: mongoose.Types.ObjectId; userName?: string } | mongoose.Types.ObjectId | string;
  role?: string;
}

interface GroupDocLike {
  groupName?: string;
  members?: GroupMemberLike[];
}

interface NormalizedMember {
  id: string;
  name: string;
  role: string;
}

const QUANT_QUERY_PATTERNS = [
  /how many/i,
  /number of/i,
  /count/i,
  /total/i,
  /amount/i,
  /balance/i,
  /owe|owed|owes/i,
  /who is|who are/i,
  /list/i,
  /names?/i,
];

function needsLiveNumbers(query: string): boolean {
  return QUANT_QUERY_PATTERNS.some((pattern) => pattern.test(query));
}

function isGroupCountQuery(query: string): boolean {
  const lower = query.toLowerCase();
  const mentionsGroups = lower.includes("group") || lower.includes("groups");
  const asksCount = /(how many|ho many|number|count|total|many)/i.test(lower);
  return mentionsGroups && asksCount;
}

function buildNetBalances(
  memberIds: string[],
  transactions: Array<{ payer: mongoose.Types.ObjectId; splits: Array<{ user: mongoose.Types.ObjectId; amount: number }> }>,
  settlements: Array<{ fromUser: mongoose.Types.ObjectId; toUser: mongoose.Types.ObjectId; amount: number }>
): Array<{ from: string; to: string; amount: number }> {
  const balanceMap: Record<string, Record<string, number>> = {};

  for (const memberId of memberIds) {
    balanceMap[memberId] = {};
  }

  for (const tx of transactions) {
    const payer = tx.payer.toString();

    for (const split of tx.splits ?? []) {
      const user = split.user.toString();
      if (user === payer) continue;
      if (!balanceMap[payer]) balanceMap[payer] = {};
      if (!balanceMap[payer][user]) balanceMap[payer][user] = 0;
      balanceMap[payer][user] += Number(split.amount ?? 0);
    }
  }

  for (const st of settlements) {
    const from = st.fromUser.toString();
    const to = st.toUser.toString();
    if (!balanceMap[to]) balanceMap[to] = {};
    if (!balanceMap[to][from]) balanceMap[to][from] = 0;
    balanceMap[to][from] -= Number(st.amount ?? 0);
  }

  const result: Array<{ from: string; to: string; amount: number }> = [];
  const visited = new Set<string>();

  for (const userA of Object.keys(balanceMap)) {
    for (const userB of Object.keys(balanceMap[userA] ?? {})) {
      const key = `${userA}:${userB}`;
      const reverse = `${userB}:${userA}`;
      if (visited.has(key) || visited.has(reverse)) continue;

      const aToB = balanceMap[userA][userB] ?? 0;
      const bToA = balanceMap[userB]?.[userA] ?? 0;
      const net = aToB - bToA;

      if (net > 0) {
        result.push({ from: userB, to: userA, amount: Number(net.toFixed(2)) });
      } else if (net < 0) {
        result.push({ from: userA, to: userB, amount: Number(Math.abs(net).toFixed(2)) });
      }

      visited.add(key);
      visited.add(reverse);
    }
  }

  return result;
}

export async function buildLiveDataContext(input: LiveContextInput): Promise<LiveContextResult> {
  const query = input.lastUserMessage.trim();
  if (!query) return {};

  if (!needsLiveNumbers(query)) {
    return {
      strictNoGuessNote:
        "If the user asks for exact numbers or names, only answer using VERIFIED DATA SNAPSHOT. If no snapshot value exists, explicitly say the value is unavailable right now and ask the user to open the relevant group/page.",
    };
  }

  if (!input.groupId) {
    const canUseGroupsSnapshot = isGroupCountQuery(query) || (input.routeHint ?? "").toLowerCase() === "groups";

    if (!canUseGroupsSnapshot) {
      return {
        strictNoGuessNote:
          "The user asked for potentially dynamic values but no groupId is available. Do not guess any number/name. Ask them to open a specific group first.",
      };
    }

    await createMongoConnection();

    const userGroups = (await Group.find({ "members.user": input.userId })
      .select("groupName members")
      .lean()) as unknown as GroupDocLike[];

    const groupsSnapshot = {
      generatedAt: new Date().toISOString(),
      userGroupCount: userGroups.length,
      groups: userGroups.map((group) => ({
        groupName: group.groupName ?? "Unnamed Group",
        memberCount: group.members?.length ?? 0,
      })),
    };

    return {
      snapshotText: JSON.stringify(groupsSnapshot),
      strictNoGuessNote:
        "Use only VERIFIED DATA SNAPSHOT for exact counts and names. If a value is missing, clearly say it is unavailable instead of guessing.",
    };
  }

  if (!mongoose.Types.ObjectId.isValid(input.groupId)) {
    return {
      strictNoGuessNote:
        "groupId is invalid. Do not guess values. Ask the user to reopen the group and retry.",
    };
  }

  await createMongoConnection();

  const groupDoc = await Group.findOne({
    _id: input.groupId,
    "members.user": input.userId,
  })
    .populate("members.user", "userName")
    .select("groupName members");

  if (!groupDoc) {
    return {
      strictNoGuessNote:
        "Group is not accessible for this user. Do not provide dynamic values.",
    };
  }

  const transactions = (await Transaction.find({ groupMongooseId: input.groupId })
    .select("payer amount splits.user splits.amount")
    .lean()) as unknown as Array<{ payer: mongoose.Types.ObjectId; amount: number; splits: Array<{ user: mongoose.Types.ObjectId; amount: number }> }>;

  const settlements = (await Settlement.find({ groupMongooseId: input.groupId })
    .select("fromUser toUser amount")
    .lean()) as unknown as Array<{ fromUser: mongoose.Types.ObjectId; toUser: mongoose.Types.ObjectId; amount: number }>;

  const groupLike = groupDoc.toObject() as unknown as GroupDocLike;
  const members: NormalizedMember[] = (groupLike.members ?? []).map((member) => {
    const userValue = member.user;

    if (typeof userValue === "string") {
      return {
        id: userValue,
        name: "Unknown",
        role: member.role ?? "member",
      };
    }

    if (userValue instanceof mongoose.Types.ObjectId) {
      return {
        id: userValue.toString(),
        name: "Unknown",
        role: member.role ?? "member",
      };
    }

    return {
      id: userValue._id?.toString() ?? "",
      name: userValue.userName ?? "Unknown",
      role: member.role ?? "member",
    };
  });

  const memberIds = members.map((m) => m.id).filter(Boolean);

  const netBalances = buildNetBalances(
    memberIds,
    transactions as Array<{ payer: mongoose.Types.ObjectId; splits: Array<{ user: mongoose.Types.ObjectId; amount: number }> }>,
    settlements as Array<{ fromUser: mongoose.Types.ObjectId; toUser: mongoose.Types.ObjectId; amount: number }>
  );

  const totalExpense = (transactions ?? []).reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
  const totalSettled = (settlements ?? []).reduce((sum, st) => sum + Number(st.amount ?? 0), 0);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    groupId: input.groupId,
    groupName: groupLike.groupName ?? "Unknown",
    memberCount: members.length,
    members: members.map((m) => ({ name: m.name, role: m.role })),
    transactionCount: transactions.length,
    settlementCount: settlements.length,
    totalExpense: Number(totalExpense.toFixed(2)),
    totalSettled: Number(totalSettled.toFixed(2)),
    netBalances,
  };

  return {
    snapshotText: JSON.stringify(snapshot),
    strictNoGuessNote:
      "Use only VERIFIED DATA SNAPSHOT for exact numbers, balances, and names. If a requested value is not present in snapshot, clearly say data is unavailable instead of guessing.",
  };
}
