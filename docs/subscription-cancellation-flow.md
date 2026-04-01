# Subscription Cancellation Flow

Internal documentation covering how trial and paid subscription cancellation works with Polar webhooks, the full event lifecycle, and how each scenario is handled.

---

## Polar Webhook Lifecycle

Polar sends different webhook event sequences depending on how a subscription is canceled. This is documented at https://polar.sh/docs/integrate/webhooks/events.

### End-of-Period Cancellation (our default)

When `cancelAtPeriodEnd: true` is used (which is what our `cancelSubscription` TRPC mutation does):

**Phase 1 -- fires IMMEDIATELY when user clicks cancel:**

```
subscription.updated   (status: active/trialing, cancel_at_period_end: true)
subscription.canceled  (status: active/trialing, cancel_at_period_end: true)
```

The subscription is still active/trialing at this point. The user has not lost access on Polar's side. These events signal that cancellation has been **scheduled**, not executed.

**Phase 2 -- fires at the END of the billing period (or trial end date):**

```
subscription.updated   (status: canceled)
subscription.revoked   (status: canceled)
```

This is when the subscription is definitively over. Benefits are revoked and billing stops.

### Immediate Revocation (admin/merchant force-cancel)

All events fire at once:

```
subscription.updated   (status: canceled)
subscription.canceled  (status: canceled)
subscription.revoked   (status: canceled)
```

### Reactivation (user un-cancels before period end)

```
subscription.updated   (status: active/trialing, cancel_at_period_end: false)
subscription.uncanceled
```

---

## Our Webhook Handlers

### `subscription.created` (status: trialing)

Sets `plan` from product, `subscriptionStatus: "trialing"`, clears `canceledAt`. This fires when a user completes the Polar checkout during onboarding with a trial.

### `subscription.active`

Sets `plan` from product, `subscriptionStatus: "active"`, clears `canceledAt`. This fires when a trial converts to paid, or when a user subscribes directly without a trial.

### `subscription.canceled`

Only records that cancellation has been scheduled. Sets `canceledAt` on the team. Does **not** change `plan` or `subscriptionStatus` because the subscription is still active/trialing on Polar's side at this point. Also triggers the personal outreach cancellation email ("Thanks for being a customer...") and schedules the 3-day follow-up.

### `subscription.revoked`

Handles the actual end of a subscription:
- If `status === "past_due"`: keeps the plan active, marks `subscriptionStatus: "past_due"` (payment issue -- user keeps access while fixing payment method)
- Otherwise: downgrades to `plan: "trial"`, clears `subscriptionStatus`, sets `canceledAt`

### `subscription.past_due`

Sets `subscriptionStatus: "past_due"` without changing the plan. Triggers payment issue email.

### `subscription.uncanceled`

Not currently handled. The in-app reactivation path uses the TRPC `reactivateSubscription` mutation which directly clears `canceledAt` and sets `cancelAtPeriodEnd: false` on Polar.

---

## End-to-End Flow

```
User clicks "Cancel subscription" in dashboard
  |
  v
TRPC cancelSubscription mutation
  |-- Calls Polar API: subscriptions.update({ cancelAtPeriodEnd: true })
  |-- Updates DB: team.canceledAt = now
  |
  v
Polar fires subscription.canceled IMMEDIATELY
  |
  v
Webhook handler:
  |-- Sets canceledAt = now (plan and subscriptionStatus left intact)
  |-- Sends cancellation outreach email + schedules 3-day follow-up
  |
  v
User's next page load:
  |-- Server fetches user.me -> plan is still "starter"/"pro"
  |-- User keeps full access to dashboard
  |-- Billing page shows "Reactivate subscription" button
  |-- Copy: "Your subscription/trial has been canceled and will end
  |    at the end of your billing/trial period."
  |
  v
[Days/weeks pass -- user has access through remaining period]
  |
  v
Polar fires subscription.revoked (at actual period end)
  |
  v
Webhook handler:
  |-- Sets plan = "trial"
  |-- Sets subscriptionStatus = null
  |-- Sets canceledAt = now
  |
  v
User's next page load:
  |-- Server fetches user.me -> plan is "trial", canceledAt is set
  |-- Layout skips onboarding redirect (canceledAt is set, so this
  |   is a returning user, not a fresh signup)
  |-- TrialGuard shows UpgradeContent ("Continue with Midday" + plans)
  |-- User can subscribe as a paying customer (no trial)
```

---

## Scenario Matrix

### Scenario 1: Trial user cancels during 14-day trial

| Step | DB State After | User Access |
|------|---------------|-------------|
| Signs up, starts trial | plan=starter, status=trialing, canceledAt=null | Full access |
| Clicks cancel | plan=starter, status=trialing, canceledAt=now | Full access |
| `subscription.canceled` fires | plan=starter, status=trialing, canceledAt=now | Full access |
| During remaining trial days | (unchanged) | Full access |
| Trial ends, `subscription.revoked` fires | plan=trial, status=null, canceledAt=now | UpgradeContent |
| User re-subscribes (paid, no trial) | plan=starter/pro, status=active, canceledAt=null | Full access |

### Scenario 2: Paid (active) user cancels mid-billing-cycle

| Step | DB State After | User Access |
|------|---------------|-------------|
| Active subscriber | plan=pro, status=active, canceledAt=null | Full access |
| Clicks cancel | plan=pro, status=active, canceledAt=now | Full access |
| `subscription.canceled` fires | plan=pro, status=active, canceledAt=now | Full access |
| During remaining billing period | (unchanged) | Full access |
| Billing period ends, `subscription.revoked` fires | plan=trial, status=null, canceledAt=now | UpgradeContent |

### Scenario 3: Merchant/admin immediately revokes

| Step | DB State After | User Access |
|------|---------------|-------------|
| Admin revokes from Polar dashboard | -- | -- |
| `subscription.canceled` fires | canceledAt=now (plan/status unchanged) | Full access (briefly) |
| `subscription.revoked` fires (simultaneously) | plan=trial, status=null, canceledAt=now | UpgradeContent |

Both events fire at once. The `revoked` handler performs the downgrade. Immediate loss of access as expected for forced revocation.

### Scenario 4: User cancels, then reactivates before period end

| Step | DB State After | User Access |
|------|---------------|-------------|
| Clicks cancel | plan=starter, status=trialing, canceledAt=now | Full access |
| `subscription.canceled` fires | plan=starter, status=trialing, canceledAt=now | Full access |
| Clicks "Reactivate" (TRPC mutation) | plan=starter, status=trialing, canceledAt=null | Full access |
| Polar: cancelAtPeriodEnd set back to false | -- | -- |

Reactivation works because the Polar-side subscription is still active/trialing. The `reactivateSubscription` TRPC mutation finds the subscription with `cancelAtPeriodEnd: true` and `status: active/trialing`, sets `cancelAtPeriodEnd: false`, and clears `canceledAt` in the DB.

### Scenario 5: Payment fails (past_due)

The `subscription.past_due` handler sets `subscriptionStatus: "past_due"` without changing the plan. User keeps access while fixing their payment method. If payment retries are exhausted, `subscription.revoked` fires with `status: "past_due"` and the plan stays active (separate handling).

### Scenario 6: Trial converts to paid (happy path, no cancellation)

When the trial ends and Polar charges the card, `subscription.active` fires. Handler sets `subscriptionStatus: "active"`, plan from product, clears `canceledAt`. No interaction with cancellation logic.

### Scenario 7: Re-subscription after cancellation/revocation

After revocation: team has `plan: "trial"`, `canceledAt: set`. User sees UpgradeContent with plan selection. The `Plans` component calls `createCheckout` without `requireTrial`, so the checkout proceeds as a regular paid subscription (no trial period, immediate charge). On success, `subscription.active` fires and restores full access.

Note: The user cannot get another free trial because trial eligibility requires `canceledAt == null`.

---

## Dependent Systems

### Bank sync eligibility (`apps/api/src/utils/check-team-eligibility.ts`)

Checks `plan === "pro" || plan === "starter"`. During the remaining period after cancellation, plan stays "starter"/"pro", so sync continues. After revocation, plan becomes "trial" and sync eligibility falls back to the 14-day-from-creation window.

### Email eligibility (`packages/jobs/src/utils/check-team-plan.ts`)

Checks `plan === "trial" || subscription_status === "trialing"`. During the remaining trial period after cancellation, `subscription_status` is still "trialing", so marketing emails continue as appropriate.

### Onboarding task -- trial expiring email (`packages/jobs/src/tasks/team/onboarding.ts`)

The day-12 "trial ends tomorrow" email checks:
```typescript
freshTeam?.subscription_status === "trialing" && !freshTeam.canceled_at
```

A user who canceled during their trial has `subscription_status = "trialing"` but `canceled_at` IS set. So `!freshTeam.canceled_at` is false, and the email is correctly **not sent** -- they already know they're leaving, no need to warn about upcoming billing.

### Layout onboarding redirect (`apps/dashboard/.../layout.tsx`)

Redirects `plan === "trial"` teams (created after the enforcement date) to `/onboarding?s=start-trial`, but only when `canceledAt` is null. Teams that previously had a subscription (canceledAt is set) skip this redirect and land on `TrialGuard`/`UpgradeContent` instead, where they can re-subscribe as paying customers.

### Billing settings page (`apps/dashboard/.../settings/billing/page.tsx`)

- `plan !== "trial"` -- shows `ManageSubscription` (with Reactivate button when `canceledAt` is set)
- `plan === "trial"` -- shows `Plans` component for re-subscription

### Cancellation dialog copy

- Trial users: "Your trial will remain active until it ends. You won't be charged."
- Paid users: "Your plan will remain active until the end of your current billing period. You won't be charged again."

### Manage subscription card copy

- Trial + canceled: "Your trial has been canceled and will end when your trial period expires. You won't be charged."
- Paid + canceled: "Your subscription has been canceled and will end at the end of your billing period."

---

## Key Design Decisions

### `subscription.canceled` does not downgrade

Because this event fires immediately (not at period end), we only record the cancellation intent (`canceledAt`). The plan and subscription status remain intact so the user keeps access through their paid/trial period.

### `subscription.revoked` performs the actual downgrade

This event fires at the actual end of the subscription period. This is where `plan` is set to `"trial"` and `subscriptionStatus` is cleared.

### Cancellation email fires on `subscription.canceled` (immediately)

The personal outreach email ("Thanks for being a customer, what didn't work?") is sent when the user cancels, not when the period ends. This is the right time for this kind of outreach -- while the decision is fresh. The 3-day follow-up checks `isTeamStillCanceled` before sending.

### Layout redirect guards on `canceledAt`

The onboarding enforcement redirect (`/onboarding?s=start-trial`) only applies to fresh teams that have never had a subscription. Teams with `canceledAt` set have already been through onboarding and are returning users who should see the upgrade page.

### Re-subscription skips trial

The `Plans` component (shown on UpgradeContent and billing settings) calls `createCheckout` without `requireTrial`. This means re-subscribing users pay immediately -- no second free trial. Trial eligibility also explicitly requires `canceledAt == null`.

---

## Risks and Mitigations

### `subscription.revoked` webhook not delivered

If Polar fails to deliver `subscription.revoked`, the team would keep access beyond their paid period. Polar has built-in webhook retry logic. This is the safer failure mode (temporary over-access vs. premature access loss). A periodic reconciliation job could be added later to check Polar's actual subscription state.

### `subscription.uncanceled` not handled

If a user reactivates from the Polar customer portal directly (not our dashboard), `subscription.uncanceled` fires but we don't process it. `canceledAt` would remain set, making the dashboard show "Reactivate" even though the subscription is no longer pending cancellation. The in-app reactivation path handles this correctly via the TRPC mutation.

### Race condition between TRPC mutation and webhook

The TRPC `cancelSubscription` mutation calls the Polar API, then updates `canceledAt` in the DB. The webhook could theoretically arrive between these two operations. Both the mutation and the webhook handler only set `canceledAt`, so processing order doesn't matter -- the result is the same regardless.

---

## Files Involved

| File | Role |
|------|------|
| `apps/api/src/rest/routers/webhooks/polar/index.ts` | Webhook handlers for all Polar subscription events |
| `apps/api/src/trpc/routers/billing.ts` | TRPC mutations: createCheckout, cancelSubscription, reactivateSubscription, getActiveSubscription |
| `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx` | Layout with onboarding redirect guard and TrialGuard wrapper |
| `apps/dashboard/src/utils/trial.ts` | Trial expiry calculation and upgrade content decision |
| `apps/dashboard/src/components/trial-guard.tsx` | Client component that shows UpgradeContent when trial is expired |
| `apps/dashboard/src/components/upgrade-content.tsx` | "Continue with Midday" page with plan selection |
| `apps/dashboard/src/components/cancellation-dialog.tsx` | Multi-step cancellation dialog with trial-specific copy |
| `apps/dashboard/src/components/manage-subscription.tsx` | Subscription card with cancel/reactivate and status copy |
| `apps/dashboard/src/components/plans.tsx` | Plan selection + Polar checkout (no requireTrial) |
| `packages/db/src/queries/users.ts` | `getUserById` query returning team data including subscriptionStatus |
| `packages/db/src/queries/teams.ts` | Team queries including `isTeamStillCanceled` |
| `apps/api/src/utils/check-team-eligibility.ts` | Bank sync eligibility based on plan |
| `packages/jobs/src/utils/check-team-plan.ts` | Email eligibility based on plan/status |
| `packages/jobs/src/tasks/team/onboarding.ts` | Onboarding task with trial-expiring email guard |
| `apps/worker/src/processors/teams/cancellation-emails.ts` | Immediate cancellation outreach email |
| `apps/worker/src/processors/teams/cancellation-email-followup.ts` | 3-day follow-up email with reactivation check |
