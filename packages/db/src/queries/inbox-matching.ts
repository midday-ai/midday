import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { inbox, transactionMatchSuggestions } from "../schema";
import { createActivity } from "./activities";
import { matchTransaction, updateInbox } from "./inbox";
import {
  createMatchSuggestion,
  findMatches,
  type MatchResult,
} from "./transaction-matching";

// Type guard to check if result has a suggestion
export function hasSuggestion(result: {
  action: "auto_matched" | "suggestion_created" | "no_match_yet";
  suggestion?: MatchResult;
}): result is {
  action: "auto_matched" | "suggestion_created";
  suggestion: MatchResult;
} {
  return result.action !== "no_match_yet" && result.suggestion !== undefined;
}

type PersistInboxSuggestionCandidate = Pick<
  MatchResult,
  | "transactionId"
  | "confidenceScore"
  | "amountScore"
  | "currencyScore"
  | "dateScore"
  | "nameScore"
  | "matchType"
>;

export async function persistInboxSuggestionWorkflow(
  db: Database,
  params: {
    teamId: string;
    inboxId: string;
    candidate: PersistInboxSuggestionCandidate;
    source?: string;
  },
): Promise<{
  action: "auto_matched" | "suggestion_created";
}> {
  const { teamId, inboxId, candidate, source } = params;
  const shouldAutoMatch = candidate.matchType === "auto_matched";

  if (shouldAutoMatch) {
    await createMatchSuggestion(db, {
      teamId,
      inboxId,
      transactionId: candidate.transactionId,
      confidenceScore: candidate.confidenceScore,
      amountScore: candidate.amountScore,
      currencyScore: candidate.currencyScore,
      dateScore: candidate.dateScore,
      nameScore: candidate.nameScore,
      matchType: "auto_matched",
      status: "confirmed",
      matchDetails: {
        autoMatched: true,
        calculatedAt: new Date().toISOString(),
        ...(source ? { source } : {}),
        criteria: {
          confidence: candidate.confidenceScore,
          amount: candidate.amountScore,
          currency: candidate.currencyScore,
          date: candidate.dateScore,
        },
      },
    });

    await matchTransaction(db, {
      id: inboxId,
      transactionId: candidate.transactionId,
      teamId,
    });

    return { action: "auto_matched" };
  }

  await createMatchSuggestion(db, {
    teamId,
    inboxId,
    transactionId: candidate.transactionId,
    confidenceScore: candidate.confidenceScore,
    amountScore: candidate.amountScore,
    currencyScore: candidate.currencyScore,
    dateScore: candidate.dateScore,
    nameScore: candidate.nameScore,
    matchType: candidate.matchType,
    status: "pending",
    matchDetails: {
      calculatedAt: new Date().toISOString(),
      ...(source ? { source } : {}),
      scores: {
        amount: candidate.amountScore,
        currency: candidate.currencyScore,
        date: candidate.dateScore,
        name: candidate.nameScore,
      },
    },
  });

  await updateInbox(db, {
    id: inboxId,
    teamId,
    status: "suggested_match",
  });

  return { action: "suggestion_created" };
}

// Calculate and store suggestions for an inbox item
export async function calculateInboxSuggestions(
  db: Database,
  params: {
    teamId: string;
    inboxId: string;
    excludeTransactionIds?: Set<string>;
  },
): Promise<{
  action: "auto_matched" | "suggestion_created" | "no_match_yet";
  suggestion?: MatchResult;
}> {
  const { teamId, inboxId, excludeTransactionIds } = params;

  // Set status to analyzing while we process
  await updateInbox(db, {
    id: inboxId,
    teamId,
    status: "analyzing",
  });

  // Find the best match using our matching algorithm
  const bestMatch = await findMatches(db, {
    teamId,
    inboxId,
    excludeTransactionIds,
  });

  if (!bestMatch) {
    // Update inbox status to pending - we'll keep looking when new transactions arrive
    // The no_match status is only set by the scheduler after 90 days
    await updateInbox(db, {
      id: inboxId,
      teamId,
      status: "pending",
    });

    return { action: "no_match_yet" };
  }

  const { action } = await persistInboxSuggestionWorkflow(db, {
    teamId,
    inboxId,
    candidate: bestMatch,
  });

  return {
    action,
    suggestion: bestMatch,
  };
}

// Confirm a suggested match
export async function confirmSuggestedMatch(
  db: Database,
  params: {
    teamId: string;
    suggestionId: string;
    inboxId: string;
    transactionId: string;
    userId?: string | null;
  },
) {
  const { teamId, suggestionId, inboxId, transactionId, userId } = params;

  // Update suggestion status in transactionMatchSuggestions table
  const [suggestion] = await db
    .update(transactionMatchSuggestions)
    .set({
      status: "confirmed",
      userActionAt: new Date().toISOString(),
      userId,
    })
    .where(
      and(
        eq(transactionMatchSuggestions.id, suggestionId),
        eq(transactionMatchSuggestions.teamId, teamId),
      ),
    )
    .returning();

  // Perform the actual match (this will update inbox status to 'done')
  const result = await matchTransaction(db, {
    id: inboxId,
    transactionId,
    teamId,
  });

  createActivity(db, {
    teamId,
    userId: userId ?? undefined,
    type: "inbox_match_confirmed",
    source: "user",
    priority: 7,
    metadata: {
      inboxId,
      transactionId: result?.transactionId,
      documentName: result?.displayName,
      amount: result?.amount,
      currency: result?.currency,
      confidenceScore: Number(suggestion?.confidenceScore),
    },
  });

  return result;
}

// Decline a suggested match
export async function declineSuggestedMatch(
  db: Database,
  params: {
    suggestionId: string;
    inboxId: string;
    userId?: string | null;
    teamId: string;
  },
) {
  const { suggestionId, inboxId, userId, teamId } = params;

  // Update suggestion status in transactionMatchSuggestions table
  await db
    .update(transactionMatchSuggestions)
    .set({
      status: "declined",
      userActionAt: new Date().toISOString(),
      userId,
    })
    .where(
      and(
        eq(transactionMatchSuggestions.id, suggestionId),
        eq(transactionMatchSuggestions.teamId, teamId),
      ),
    );

  // Update inbox status back to 'pending' since suggestion was declined
  await updateInbox(db, {
    id: inboxId,
    teamId,
    status: "pending",
  });
}

// Get inbox items by status for easier querying
export async function getInboxByStatus(
  db: Database,
  params: {
    teamId: string;
    status?:
      | "processing"
      | "pending"
      | "archived"
      | "new"
      | "analyzing"
      | "suggested_match"
      | "no_match"
      | "done"
      | "deleted"
      | "other";
  },
) {
  const { teamId, status } = params;

  const baseQuery = db
    .select({
      id: inbox.id,
      displayName: inbox.displayName,
      amount: inbox.amount,
      currency: inbox.currency,
      date: inbox.date,
      status: inbox.status,
      createdAt: inbox.createdAt,
      transactionId: inbox.transactionId,
    })
    .from(inbox);

  if (status) {
    return baseQuery
      .where(and(eq(inbox.teamId, teamId), eq(inbox.status, status)))
      .orderBy(desc(inbox.createdAt));
  }

  return baseQuery
    .where(eq(inbox.teamId, teamId))
    .orderBy(desc(inbox.createdAt));
}

// Type for pending inbox items available for matching
export type PendingInboxItem = {
  id: string;
  amount: number | null;
  date: string | null;
  currency: string | null;
  createdAt: string;
};

// Get pending inbox items that are available for matching
export async function getPendingInboxForMatching(
  db: Database,
  params: {
    teamId: string;
    limit?: number;
  },
): Promise<PendingInboxItem[]> {
  const { teamId, limit = 100 } = params;

  return db
    .select({
      id: inbox.id,
      amount: inbox.amount,
      date: inbox.date,
      currency: inbox.currency,
      createdAt: inbox.createdAt,
    })
    .from(inbox)
    .where(
      and(
        eq(inbox.teamId, teamId),
        eq(inbox.status, "pending"), // Only pending items
        // Only items that haven't been matched yet
        sql`${inbox.transactionId} IS NULL`,
      ),
    )
    .orderBy(desc(inbox.createdAt)) // Newest first - prioritize recent items
    .limit(limit);
}

// Get a suggestion by inbox and transaction IDs
export async function getSuggestionByInboxAndTransaction(
  db: Database,
  params: {
    inboxId: string;
    transactionId: string;
    teamId: string;
  },
) {
  const { inboxId, transactionId, teamId } = params;

  const [result] = await db
    .select({
      id: transactionMatchSuggestions.id,
      inboxId: transactionMatchSuggestions.inboxId,
      transactionId: transactionMatchSuggestions.transactionId,
      status: transactionMatchSuggestions.status,
      confidenceScore: transactionMatchSuggestions.confidenceScore,
      matchType: transactionMatchSuggestions.matchType,
    })
    .from(transactionMatchSuggestions)
    .where(
      and(
        eq(transactionMatchSuggestions.inboxId, inboxId),
        eq(transactionMatchSuggestions.transactionId, transactionId),
        eq(transactionMatchSuggestions.teamId, teamId),
        eq(transactionMatchSuggestions.status, "pending"),
      ),
    )
    .limit(1);

  return result || null;
}
