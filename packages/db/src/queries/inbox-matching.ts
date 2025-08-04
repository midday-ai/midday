import type { Database } from "@db/client";
import { inbox } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { matchTransaction } from "./inbox";
import {
  type InboxMatchResult,
  type MatchResult,
  createMatchSuggestion,
  findInboxMatches,
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

  // Find the best match using our matching algorithm
  const bestMatch = await findMatches(db, { teamId, inboxId });

  if (!bestMatch) {
    // Update inbox status to pending - we'll keep looking when new transactions arrive
    // The no_match status is only set by the scheduler after 90 days
    await db
      .update(inbox)
      .set({ status: "pending" })
      .where(eq(inbox.id, inboxId));

    return { action: "no_match_yet" };
  }

  // Check if this should be auto-matched (very strict criteria)
  const shouldAutoMatch = bestMatch.matchType === "auto_matched";

  if (shouldAutoMatch) {
    // Store the auto-match record for tracking
    const suggestion = await createMatchSuggestion(db, {
      teamId,
      inboxId,
      transactionId: bestMatch.transactionId,
      confidenceScore: bestMatch.confidenceScore,
      amountScore: bestMatch.amountScore,
      currencyScore: bestMatch.currencyScore,
      dateScore: bestMatch.dateScore,
      embeddingScore: bestMatch.embeddingScore,
      nameScore: bestMatch.nameScore,
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
    nameScore: bestMatch.nameScore,
    matchType: bestMatch.matchType,
    status: "pending",
    matchDetails: {
      calculatedAt: new Date().toISOString(),
      scores: {
        amount: bestMatch.amountScore,
        currency: bestMatch.currencyScore,
        date: bestMatch.dateScore,
        embedding: bestMatch.embeddingScore,
        name: bestMatch.nameScore,
      },
    },
  });

  // Update inbox status to indicate suggestion is available
  await db
    .update(inbox)
    .set({ status: "suggested_match" })
    .where(eq(inbox.id, inboxId));

  return {
    action: "suggestion_created",
    suggestion: bestMatch,
  };
}

// Calculate and store suggestions for a transaction (reverse matching)
export async function calculateTransactionSuggestions(
  db: Database,
  params: { teamId: string; transactionId: string },
): Promise<{
  action: "auto_matched" | "suggestion_created" | "no_match";
  suggestion?: InboxMatchResult;
}> {
  const { teamId, transactionId } = params;

  // Find the best inbox match for this transaction
  const bestMatch = await findInboxMatches(db, { teamId, transactionId });

  if (!bestMatch) {
    return { action: "no_match" };
  }

  // Check if this should be auto-matched
  const shouldAutoMatch = bestMatch.matchType === "auto_matched";

  if (shouldAutoMatch) {
    // Store the auto-match record
    await createMatchSuggestion(db, {
      teamId,
      inboxId: bestMatch.inboxId,
      transactionId,
      confidenceScore: bestMatch.confidenceScore,
      amountScore: bestMatch.amountScore,
      currencyScore: bestMatch.currencyScore,
      dateScore: bestMatch.dateScore,
      embeddingScore: bestMatch.embeddingScore,
      nameScore: bestMatch.nameScore,
      matchType: "auto_matched",
      status: "confirmed",
      matchDetails: {
        autoMatched: true,
        trigger: "transaction_created",
        calculatedAt: new Date().toISOString(),
      },
    });

    // Perform the actual match
    await matchTransaction(db, {
      id: bestMatch.inboxId,
      transactionId,
      teamId,
    });

    return {
      action: "auto_matched",
      suggestion: bestMatch,
    };
  }

  // Create suggestion and update inbox status
  await createMatchSuggestion(db, {
    teamId,
    inboxId: bestMatch.inboxId,
    transactionId,
    confidenceScore: bestMatch.confidenceScore,
    amountScore: bestMatch.amountScore,
    currencyScore: bestMatch.currencyScore,
    dateScore: bestMatch.dateScore,
    embeddingScore: bestMatch.embeddingScore,
    nameScore: bestMatch.nameScore,
    matchType: bestMatch.matchType,
    status: "pending",
    matchDetails: {
      trigger: "transaction_created",
      calculatedAt: new Date().toISOString(),
    },
  });

  // Update inbox status to suggest match
  await db
    .update(inbox)
    .set({ status: "suggested_match" })
    .where(eq(inbox.id, bestMatch.inboxId));

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

  // Update suggestion status
  await db
    .update(inbox)
    .set({
      status: "confirmed",
      userActionAt: new Date().toISOString(),
      userId,
    })
    .where(eq(inbox.id, suggestionId));

  // Perform the actual match (this will update inbox status to 'done')
  const result = await matchTransaction(db, {
    id: inboxId,
    transactionId,
    teamId,
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
  },
) {
  const { suggestionId, inboxId, userId } = params;

  // Update suggestion status
  await db
    .update(inbox)
    .set({
      status: "declined",
      userActionAt: new Date().toISOString(),
      userId,
    })
    .where(eq(inbox.id, suggestionId));

  // Update inbox status back to 'pending' since suggestion was declined
  await db
    .update(inbox)
    .set({ status: "pending" })
    .where(eq(inbox.id, inboxId));
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

  const query = db
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
    .from(inbox)
    .where(eq(inbox.teamId, teamId));

  if (status) {
    query.where(and(eq(inbox.teamId, teamId), eq(inbox.status, status)));
  }

  return query.orderBy(inbox.createdAt);
}
