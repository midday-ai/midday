#!/usr/bin/env bun
/**
 * Bulk-cancel every Polar subscription as part of the Midday wind-down.
 *
 * By default the script schedules cancellations at the end of the current
 * billing period (`cancelAtPeriodEnd: true`) so paying customers keep what
 * they already paid for. Use `--revoke` to terminate access immediately.
 *
 * Usage:
 *   POLAR_ACCESS_TOKEN=... POLAR_ENVIRONMENT=production \
 *     bun run apps/api/scripts/cancel-all-polar-subscriptions.ts --dry-run
 *
 *   POLAR_ACCESS_TOKEN=... POLAR_ENVIRONMENT=production \
 *     bun run apps/api/scripts/cancel-all-polar-subscriptions.ts
 *
 *   POLAR_ACCESS_TOKEN=... POLAR_ENVIRONMENT=production \
 *     bun run apps/api/scripts/cancel-all-polar-subscriptions.ts --revoke
 *
 * Flags:
 *   --dry-run   List actions without making any API calls.
 *   --revoke    Immediately revoke instead of canceling at period end.
 *   --env=ENV   Override POLAR_ENVIRONMENT (production|sandbox).
 *   --yes       Skip the production confirmation pause.
 */

import { Polar } from "@polar-sh/sdk";

type SubscriptionLike = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  customer?: { email?: string | null } | null;
  metadata?: Record<string, unknown> | null;
};

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const getValue = (prefix: string) =>
  args.find((a) => a.startsWith(prefix))?.slice(prefix.length);

const DRY_RUN = has("--dry-run");
const REVOKE = has("--revoke");
const SKIP_CONFIRM = has("--yes");
const ENVIRONMENT_OVERRIDE = getValue("--env=");

const accessToken = process.env.POLAR_ACCESS_TOKEN;
if (!accessToken) {
  console.error("POLAR_ACCESS_TOKEN must be set");
  process.exit(1);
}

const server = (ENVIRONMENT_OVERRIDE ?? process.env.POLAR_ENVIRONMENT) as
  | "production"
  | "sandbox"
  | undefined;

if (server !== "production" && server !== "sandbox") {
  console.error(
    "POLAR_ENVIRONMENT must be 'production' or 'sandbox' (or pass --env=production|sandbox)",
  );
  process.exit(1);
}

const polar = new Polar({ accessToken, server });

console.log("=== Polar bulk subscription cancellation ===");
console.log(`Environment : ${server}`);
console.log(
  `Mode        : ${REVOKE ? "REVOKE (immediate)" : "cancel_at_period_end"}`,
);
console.log(`Dry run     : ${DRY_RUN ? "yes" : "no"}`);
console.log("");

if (server === "production" && !DRY_RUN && !SKIP_CONFIRM) {
  console.log(
    "Production target detected. Sleeping 10 seconds before continuing — Ctrl+C to abort.",
  );
  console.log(
    "Pass --yes to skip this pause, or --dry-run to preview without changes.",
  );
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

let totalSeen = 0;
let totalActionable = 0;
let totalSucceeded = 0;
let totalSkippedAlreadyScheduled = 0;
let totalSkippedTerminal = 0;
const failures: Array<{ id: string; error: string }> = [];

const iterator = await polar.subscriptions.list({ limit: 100 });

for await (const page of iterator) {
  const items = (page.result.items ?? []) as unknown as SubscriptionLike[];

  for (const sub of items) {
    totalSeen++;

    const isLive =
      sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "past_due";

    if (!isLive) {
      totalSkippedTerminal++;
      continue;
    }

    // When canceling at period end, skip subs already scheduled.
    // When revoking, we still revoke even if scheduled (force terminate).
    if (!REVOKE && sub.cancelAtPeriodEnd) {
      totalSkippedAlreadyScheduled++;
      continue;
    }

    totalActionable++;

    const teamId =
      (sub.metadata?.teamId as string | undefined) ?? "(no teamId)";
    const email = sub.customer?.email ?? "(no email)";
    const label = `${sub.id} status=${sub.status} cancelAtPeriodEnd=${sub.cancelAtPeriodEnd} teamId=${teamId} email=${email}`;

    if (DRY_RUN) {
      console.log(
        `[dry-run] would ${REVOKE ? "revoke" : "cancel-at-period-end"} ${label}`,
      );
      continue;
    }

    try {
      if (REVOKE) {
        await polar.subscriptions.revoke({ id: sub.id });
      } else {
        await polar.subscriptions.update({
          id: sub.id,
          subscriptionUpdate: {
            cancelAtPeriodEnd: true,
            customerCancellationReason: "other",
            customerCancellationComment:
              "Midday is shutting down. Your access continues until the end of the current billing period.",
          },
        });
      }
      totalSucceeded++;
      console.log(`OK  ${label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ id: sub.id, error: msg });
      console.error(`ERR ${label} :: ${msg}`);
    }
  }
}

console.log("\n=== Summary ===");
console.log(`Subscriptions seen          : ${totalSeen}`);
console.log(`Already terminal (skipped)  : ${totalSkippedTerminal}`);
console.log(`Already scheduled (skipped) : ${totalSkippedAlreadyScheduled}`);
console.log(`Matched for action          : ${totalActionable}`);

if (!DRY_RUN) {
  console.log(
    `Successfully ${REVOKE ? "revoked" : "scheduled"}    : ${totalSucceeded}`,
  );
  console.log(`Failed                      : ${failures.length}`);

  if (failures.length) {
    console.log("\nFailures:");
    for (const failure of failures) {
      console.log(`  ${failure.id}: ${failure.error}`);
    }
  }
}

process.exit(failures.length ? 1 : 0);
