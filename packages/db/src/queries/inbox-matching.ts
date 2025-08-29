import type { Database } from "@db/client";
import { inbox, transactionMatchSuggestions } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { createActivity } from "./activities";
import { matchTransaction, updateInbox } from "./inbox";
import {
  type MatchResult,
  createMatchSuggestion,
  findMatches,
} from "./transaction-matching";

// Calculate and store suggestions for an inbox item
export async function calculateInboxSuggestions(
  db: Database,
  params: { teamId: string; inboxId: string },
): Promise<{
  action: "auto_matched" | "suggestion_created" | "no_match_yet";
  suggestion?: MatchResult;
}> {
  const { teamId, inboxId } = params;

  // Set status to analyzing while we process
  await updateInbox(db, {
    id: inboxId,
    teamId,
    status: "analyzing",
  });

  // Find the best match using our matching algorithm
  const bestMatch = await findMatches(db, { teamId, inboxId });

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

  // Check if this should be auto-matched (very strict criteria)
  const shouldAutoMatch = bestMatch.matchType === "auto_matched";

  if (shouldAutoMatch) {
    // Store the auto-match record for tracking
    await createMatchSuggestion(db, {
      teamId,
      inboxId,
      transactionId: bestMatch.transactionId,
      confidenceScore: bestMatch.confidenceScore,
      amountScore: bestMatch.amountScore,
      currencyScore: bestMatch.currencyScore,
      dateScore: bestMatch.dateScore,
      embeddingScore: bestMatch.embeddingScore,
      matchType: "auto_matched",
      status: "confirmed", // Already confirmed by system
      matchDetails: {
        autoMatched: true,
        calculatedAt: new Date().toISOString(),
        criteria: {
          confidence: bestMatch.confidenceScore,
          amount: bestMatch.amountScore,
          currency: bestMatch.currencyScore,
          date: bestMatch.dateScore,
        },
      },
    });

    // Perform the actual match
    await matchTransaction(db, {
      id: inboxId,
      transactionId: bestMatch.transactionId,
      teamId,
    });

    return {
      action: "auto_matched",
      suggestion: bestMatch,
    };
  }

  // Create suggestion and update inbox status to 'suggested_match'
  await createMatchSuggestion(db, {
    teamId,
    inboxId,
    transactionId: bestMatch.transactionId,
    confidenceScore: bestMatch.confidenceScore,
    amountScore: bestMatch.amountScore,
    currencyScore: bestMatch.currencyScore,
    dateScore: bestMatch.dateScore,
    embeddingScore: bestMatch.embeddingScore,
    matchType: bestMatch.matchType,
    status: "pending",
    matchDetails: {
      calculatedAt: new Date().toISOString(),
      scores: {
        amount: bestMatch.amountScore,
        currency: bestMatch.currencyScore,
        date: bestMatch.dateScore,
        embedding: bestMatch.embeddingScore,
      },
    },
  });

  // Update inbox status to indicate suggestion is available
  await updateInbox(db, {
    id: inboxId,
    teamId,
    status: "suggested_match",
  });

  return {
    action: "suggestion_created",
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
    userId: string;
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
    userId,
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
    userId: string;
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
      | "deleted";
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
