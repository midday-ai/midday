import type { Session } from "@api/utils/auth";
import type { Database } from "@midday/db/client";
import { isTeamEligible } from "@midday/utils/check-team-eligibility";
import { TRPCError } from "@trpc/server";

type TeamData = {
  id: string;
  plan: "trial" | "starter" | "pro";
  createdAt: string;
  canceledAt: string | null;
};

/**
 * Mutations that are always allowed, even with expired trials.
 * These are critical for account management and billing.
 */
const EXEMPT_MUTATIONS = new Set([
  // User account management
  "user.update",
  "user.delete",

  // Team management (users should be able to leave/delete team)
  "team.delete",
  "team.leave",
  "team.updateMember",

  // Billing & subscription management (critical for upgrading)
  "billing.createCheckoutSession",
  "billing.createCustomerPortalSession",

  // Invites (accepting/declining shouldn't be blocked)
  "team.acceptInvite",
  "team.declineInvite",
  "team.removeInvite",

  // Bank connections & accounts cleanup
  "bankAccounts.delete",
  "bankConnections.delete",
]);

/**
 * Middleware that checks if a team is eligible to perform mutations.
 * Throws PAYMENT_REQUIRED error if the team's plan is invalid or expired.
 *
 * Only applies to mutations - queries (read operations) are allowed regardless of plan.
 *
 * This ensures that:
 * - Pro and starter plans can always perform mutations
 * - Trial teams can only perform mutations within 14 days of creation
 * - Canceled/expired subscriptions cannot perform mutations
 * - Read access is preserved for all plans (allows users to view data and billing settings)
 * - Critical mutations (billing, account deletion) are always allowed
 *
 * Note: Team data is passed through context from team-permission middleware, avoiding extra DB queries.
 */
export const withPlanEligibility = async <TReturn>(opts: {
  ctx: {
    session: Session | null;
    db: Database;
    teamId?: string | null;
    team?: TeamData;
  };
  type: "query" | "mutation" | "subscription";
  path?: string;
  next: (opts: {
    ctx: {
      session: Session | null;
      db: Database;
      teamId?: string | null;
      team?: TeamData;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, type, path, next } = opts;

  // Skip validation for queries - allow read access regardless of plan
  if (type !== "mutation") {
    return next({ ctx });
  }

  // Skip validation for exempt mutations (billing, account deletion, etc.)
  if (path && EXEMPT_MUTATIONS.has(path)) {
    return next({ ctx });
  }

  // If no team data, skip eligibility check (user has no team assigned)
  if (!ctx.team) {
    return next({ ctx });
  }

  // Check if team is eligible for mutations using data from context
  const eligible = isTeamEligible({
    plan: ctx.team.plan,
    created_at: ctx.team.createdAt,
    canceled_at: ctx.team.canceledAt,
  });

  if (!eligible) {
    throw new TRPCError({
      code: "PAYMENT_REQUIRED",
    });
  }

  return next({ ctx });
};
