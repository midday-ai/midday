# Collections Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full collections workflow module for managing at-risk MCA deals with configurable stages, auto-escalation, SLA tracking, external agency hand-off, and merchant-level visibility.

**Architecture:** Separate `collection_cases` table references deals. Configurable workflow stages per team with auto-escalation rules (time + event based). Hybrid notes system. In-app notifications. External agency management. Full detail pages at `/collections/[id]`.

**Tech Stack:** Next.js App Router, tRPC, Drizzle ORM, PostgreSQL (Supabase), Trigger.dev (cron jobs), Radix UI + Tailwind CSS.

**Design Doc:** `docs/plans/2026-02-26-collections-module-design.md`

---

## Phase 1: Database Layer

### Task 1: Add Collections Enums to Schema

**Files:**
- Modify: `packages/db/src/schema.ts` (after line ~3533, after `mcaDealStatusEnum`)

**Step 1: Add the new enum definitions**

Add after the existing `mcaDealStatusEnum`:

```typescript
export const collectionPriorityEnum = pgEnum("collection_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const collectionOutcomeEnum = pgEnum("collection_outcome", [
  "paid_in_full",
  "settled",
  "payment_plan",
  "defaulted",
  "written_off",
  "sent_to_agency",
]);

export const collectionContactMethodEnum = pgEnum("collection_contact_method", [
  "phone",
  "email",
  "text",
  "in_person",
  "other",
]);

export const collectionNotificationTypeEnum = pgEnum("collection_notification_type", [
  "follow_up_due",
  "sla_breach",
  "escalation",
  "assignment",
]);

export const collectionEscalationTriggerEnum = pgEnum("collection_escalation_trigger", [
  "time_based",
  "event_based",
]);

export const collectionSlaMetricEnum = pgEnum("collection_sla_metric", [
  "time_in_stage",
  "response_time",
  "resolution_time",
]);
```

**Step 2: Verify the file still parses**

Run: `cd /c/Users/suphi/dev/abacus && bun run --filter @midday/db build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add collections enum definitions"
```

---

### Task 2: Add `collection_stages` Table

**Files:**
- Modify: `packages/db/src/schema.ts` (add after `mcaDeals` table, ~line 3647)

**Step 1: Add the table definition**

```typescript
export const collectionStages = pgTable(
  "collection_stages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    position: integer().notNull(),
    color: text().default("#6B7280"),
    isDefault: boolean("is_default").default(false),
    isTerminal: boolean("is_terminal").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_stages_team_id_idx").on(table.teamId),
    unique("collection_stages_team_slug_unique").on(table.teamId, table.slug),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_stages_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage collection stages", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
```

**Step 2: Add relations** (after existing relations block, ~line 4187)

```typescript
export const collectionStagesRelations = relations(collectionStages, ({ one }) => ({
  team: one(teams, {
    fields: [collectionStages.teamId],
    references: [teams.id],
  }),
}));
```

**Step 3: Verify build**

Run: `cd /c/Users/suphi/dev/abacus && bun run --filter @midday/db build`

**Step 4: Commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add collection_stages table"
```

---

### Task 3: Add `collection_agencies` Table

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add table definition** (after `collectionStages`)

```typescript
export const collectionAgencies = pgTable(
  "collection_agencies",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    name: text().notNull(),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    notes: text(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_agencies_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_agencies_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage collection agencies", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
```

**Step 2: Add relations**

```typescript
export const collectionAgenciesRelations = relations(collectionAgencies, ({ one }) => ({
  team: one(teams, {
    fields: [collectionAgencies.teamId],
    references: [teams.id],
  }),
}));
```

**Step 3: Verify build, commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add collection_agencies table"
```

---

### Task 4: Add `collection_cases` Table

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add table definition**

```typescript
export const collectionCases = pgTable(
  "collection_cases",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    dealId: uuid("deal_id").notNull(),
    stageId: uuid("stage_id").notNull(),
    assignedTo: uuid("assigned_to"),
    priority: collectionPriorityEnum().default("medium"),
    outcome: collectionOutcomeEnum(),
    agencyId: uuid("agency_id"),
    nextFollowUp: timestamp("next_follow_up", { withTimezone: true, mode: "string" }),
    stageEnteredAt: timestamp("stage_entered_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
    enteredCollectionsAt: timestamp("entered_collections_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow(),
  },
  (table) => [
    index("collection_cases_team_id_idx").on(table.teamId),
    index("collection_cases_deal_id_idx").on(table.dealId),
    index("collection_cases_stage_id_idx").on(table.stageId),
    index("collection_cases_assigned_to_idx").on(table.assignedTo),
    unique("collection_cases_deal_id_unique").on(table.dealId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_cases_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.dealId],
      foreignColumns: [mcaDeals.id],
      name: "collection_cases_deal_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.stageId],
      foreignColumns: [collectionStages.id],
      name: "collection_cases_stage_id_fkey",
    }),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [users.id],
      name: "collection_cases_assigned_to_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [collectionAgencies.id],
      name: "collection_cases_agency_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage collection cases", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
```

**Step 2: Add relations**

```typescript
export const collectionCasesRelations = relations(collectionCases, ({ one, many }) => ({
  team: one(teams, {
    fields: [collectionCases.teamId],
    references: [teams.id],
  }),
  deal: one(mcaDeals, {
    fields: [collectionCases.dealId],
    references: [mcaDeals.id],
  }),
  stage: one(collectionStages, {
    fields: [collectionCases.stageId],
    references: [collectionStages.id],
  }),
  assignedUser: one(users, {
    fields: [collectionCases.assignedTo],
    references: [users.id],
  }),
  agency: one(collectionAgencies, {
    fields: [collectionCases.agencyId],
    references: [collectionAgencies.id],
  }),
  notes: many(collectionNotes),
}));
```

**Step 3: Verify build, commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add collection_cases table with agency support"
```

---

### Task 5: Add `collection_notes` Table

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add table definition**

```typescript
export const collectionNotes = pgTable(
  "collection_notes",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    caseId: uuid("case_id").notNull(),
    authorId: uuid("author_id").notNull(),
    contactName: text("contact_name"),
    contactMethod: collectionContactMethodEnum("contact_method"),
    followUpDate: timestamp("follow_up_date", { withTimezone: true, mode: "string" }),
    summary: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_notes_case_id_idx").on(table.caseId),
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [collectionCases.id],
      name: "collection_notes_case_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [users.id],
      name: "collection_notes_author_id_fkey",
    }),
    pgPolicy("Team members can manage collection notes", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(case_id IN ( SELECT cc.id FROM collection_cases cc WHERE cc.team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user)))`,
    }),
  ],
);
```

**Step 2: Add relations**

```typescript
export const collectionNotesRelations = relations(collectionNotes, ({ one }) => ({
  case: one(collectionCases, {
    fields: [collectionNotes.caseId],
    references: [collectionCases.id],
  }),
  author: one(users, {
    fields: [collectionNotes.authorId],
    references: [users.id],
  }),
}));
```

**Step 3: Verify build, commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add collection_notes table"
```

---

### Task 6: Add Escalation Rules, SLA Configs, and Notifications Tables

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Add `collection_escalation_rules`**

```typescript
export const collectionEscalationRules = pgTable(
  "collection_escalation_rules",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    triggerType: collectionEscalationTriggerEnum("trigger_type").notNull(),
    fromStageId: uuid("from_stage_id").notNull(),
    toStageId: uuid("to_stage_id").notNull(),
    condition: jsonb().notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_escalation_rules_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_escalation_rules_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.fromStageId],
      foreignColumns: [collectionStages.id],
      name: "collection_escalation_rules_from_stage_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.toStageId],
      foreignColumns: [collectionStages.id],
      name: "collection_escalation_rules_to_stage_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage escalation rules", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
```

**Step 2: Add `collection_sla_configs`**

```typescript
export const collectionSlaConfigs = pgTable(
  "collection_sla_configs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    stageId: uuid("stage_id"),
    metric: collectionSlaMetricEnum().notNull(),
    thresholdMinutes: integer("threshold_minutes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_sla_configs_team_id_idx").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_sla_configs_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.stageId],
      foreignColumns: [collectionStages.id],
      name: "collection_sla_configs_stage_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage SLA configs", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);
```

**Step 3: Add `collection_notifications`**

```typescript
export const collectionNotifications = pgTable(
  "collection_notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    teamId: uuid("team_id").notNull(),
    userId: uuid("user_id").notNull(),
    caseId: uuid("case_id").notNull(),
    type: collectionNotificationTypeEnum().notNull(),
    message: text().notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("collection_notifications_user_id_idx").on(table.userId),
    index("collection_notifications_case_id_idx").on(table.caseId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "collection_notifications_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "collection_notifications_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [collectionCases.id],
      name: "collection_notifications_case_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Users can view their own notifications", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(user_id = auth.uid())`,
    }),
  ],
);
```

**Step 4: Add relations for all three**

```typescript
export const collectionEscalationRulesRelations = relations(collectionEscalationRules, ({ one }) => ({
  team: one(teams, { fields: [collectionEscalationRules.teamId], references: [teams.id] }),
  fromStage: one(collectionStages, { fields: [collectionEscalationRules.fromStageId], references: [collectionStages.id], relationName: "fromStage" }),
  toStage: one(collectionStages, { fields: [collectionEscalationRules.toStageId], references: [collectionStages.id], relationName: "toStage" }),
}));

export const collectionSlaConfigsRelations = relations(collectionSlaConfigs, ({ one }) => ({
  team: one(teams, { fields: [collectionSlaConfigs.teamId], references: [teams.id] }),
  stage: one(collectionStages, { fields: [collectionSlaConfigs.stageId], references: [collectionStages.id] }),
}));

export const collectionNotificationsRelations = relations(collectionNotifications, ({ one }) => ({
  team: one(teams, { fields: [collectionNotifications.teamId], references: [teams.id] }),
  user: one(users, { fields: [collectionNotifications.userId], references: [users.id] }),
  case: one(collectionCases, { fields: [collectionNotifications.caseId], references: [collectionCases.id] }),
}));
```

**Step 5: Verify build, commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add escalation rules, SLA configs, and notifications tables"
```

---

### Task 7: Add `hasCollectionsPermission` to Team Members

**Files:**
- Modify: `packages/db/src/schema.ts` (find `usersOnTeam` table, ~line 2365)

**Step 1: Add field to `usersOnTeam` table**

Find the `usersOnTeam` table definition and add after the existing fields:

```typescript
hasCollectionsPermission: boolean("has_collections_permission").default(false),
```

**Step 2: Verify build, commit**

```bash
git add packages/db/src/schema.ts
git commit -m "feat(db): add hasCollectionsPermission to team members"
```

---

### Task 8: Generate and Apply Migration

**Step 1: Generate migration diff**

Run: `cd /c/Users/suphi/dev/abacus && bunx supabase db diff --schema public -f add_collections_module`

**Step 2: Review the generated SQL migration file**

Read the generated file in `packages/supabase/migrations/` and verify it contains:
- All new enums
- All 7 new tables with correct columns, indexes, foreign keys, and RLS policies
- The `has_collections_permission` column on `users_on_team`

**Step 3: Apply migration locally**

Run: `cd /c/Users/suphi/dev/abacus && bunx supabase db push`
Expected: Migration applies successfully

**Step 4: Regenerate TypeScript types**

Run: `cd /c/Users/suphi/dev/abacus && bunx supabase gen types typescript --local > packages/supabase/src/types/db.ts`

**Step 5: Commit**

```bash
git add packages/supabase/migrations/ packages/supabase/src/types/
git commit -m "feat(db): apply collections module migration and regenerate types"
```

---

### Task 9: Add Schema Exports

**Files:**
- Modify: `packages/db/src/index.ts` (or wherever schema is re-exported)

**Step 1: Export all new tables and enums**

Verify that all new tables (`collectionStages`, `collectionAgencies`, `collectionCases`, `collectionNotes`, `collectionEscalationRules`, `collectionSlaConfigs`, `collectionNotifications`) and their enums are exported from the `@midday/db` package entry point.

**Step 2: Verify build**

Run: `cd /c/Users/suphi/dev/abacus && bun run --filter @midday/db build`

**Step 3: Commit**

```bash
git add packages/db/src/
git commit -m "feat(db): export collections schema types"
```

---

## Phase 2: Query Layer

### Task 10: Create Collections Cases Queries

**Files:**
- Create: `packages/db/src/queries/collections.ts`

**Step 1: Write the queries file**

Follow the pattern from `packages/db/src/queries/mca-deals.ts`. Include:

- `getCollectionCases(db, { teamId, status, stageId, assignedTo, priority, cursor, pageSize, sort })` — list with cursor pagination, joins to `mcaDeals`, `merchants`, `collectionStages`, `users`
- `getCollectionCaseById(db, { id, teamId })` — single case with all related data (deal, merchant, stage, assigned user, agency, notes)
- `createCollectionCase(db, { teamId, dealId, stageId, priority })` — creates a new case
- `updateCollectionCase(db, { id, teamId, stageId?, assignedTo?, priority?, outcome?, agencyId?, nextFollowUp?, resolvedAt? })` — partial update
- `getCollectionStats(db, { teamId })` — returns counts for summary cards (active cases, total balance, upcoming follow-ups, recovery rate, unassigned)
- `getCandidateDeals(db, { teamId, cursor, pageSize })` — deals with `late`/`defaulted`/`in_collections` status that don't have a `collection_cases` row yet

**Step 2: Verify build**

Run: `cd /c/Users/suphi/dev/abacus && bun run --filter @midday/db build`

**Step 3: Commit**

```bash
git add packages/db/src/queries/collections.ts
git commit -m "feat(db): add collection cases query functions"
```

---

### Task 11: Create Collections Notes Queries

**Files:**
- Create: `packages/db/src/queries/collection-notes.ts`

**Step 1: Write the queries file**

- `getCollectionNotes(db, { caseId, cursor, pageSize })` — list notes for a case, joined to `users` for author name, ordered by `createdAt` desc
- `createCollectionNote(db, { caseId, authorId, contactName?, contactMethod?, followUpDate?, summary })` — creates note, optionally updates `nextFollowUp` on the parent case

**Step 2: Verify build, commit**

```bash
git add packages/db/src/queries/collection-notes.ts
git commit -m "feat(db): add collection notes query functions"
```

---

### Task 12: Create Collections Config Queries (Stages, Rules, SLAs, Agencies)

**Files:**
- Create: `packages/db/src/queries/collection-config.ts`

**Step 1: Write the queries file**

- `getCollectionStages(db, { teamId })` — ordered by position
- `upsertCollectionStage(db, { id?, teamId, name, slug, position, color, isDefault, isTerminal })`
- `deleteCollectionStage(db, { id, teamId })`
- `seedDefaultStages(db, { teamId })` — creates the 7 default stages for a new team
- `getCollectionAgencies(db, { teamId })` — list active agencies
- `upsertCollectionAgency(db, { id?, teamId, name, contactName?, contactEmail?, contactPhone?, notes?, isActive? })`
- `deleteCollectionAgency(db, { id, teamId })`
- `getEscalationRules(db, { teamId })` — list rules with stage names joined
- `upsertEscalationRule(db, { id?, teamId, triggerType, fromStageId, toStageId, condition, isActive })`
- `deleteEscalationRule(db, { id, teamId })`
- `getSlaConfigs(db, { teamId })` — list configs with stage names joined
- `upsertSlaConfig(db, { id?, teamId, stageId?, metric, thresholdMinutes })`
- `deleteSlaConfig(db, { id, teamId })`

**Step 2: Verify build, commit**

```bash
git add packages/db/src/queries/collection-config.ts
git commit -m "feat(db): add collection config query functions"
```

---

### Task 13: Create Collections Notifications Queries

**Files:**
- Create: `packages/db/src/queries/collection-notifications.ts`

**Step 1: Write the queries file**

- `getUnreadNotifications(db, { userId, teamId })` — unread notifications ordered by createdAt desc
- `getNotificationCount(db, { userId, teamId })` — count of unread
- `createNotification(db, { teamId, userId, caseId, type, message })`
- `markNotificationRead(db, { id, userId })`
- `markAllNotificationsRead(db, { userId, teamId })`

**Step 2: Verify build, commit**

```bash
git add packages/db/src/queries/collection-notifications.ts
git commit -m "feat(db): add collection notifications query functions"
```

---

## Phase 3: API Layer (tRPC)

### Task 14: Create Collections Router

**Files:**
- Create: `apps/api/src/trpc/routers/collections.ts`
- Modify: `apps/api/src/trpc/routers/_app.ts` (~line 50 for import, ~line 97 for registration)

**Step 1: Write the collections router**

Follow the pattern from `apps/api/src/trpc/routers/merchants.ts`. Include procedures:

- `get` (protectedProcedure) — list cases with filters
- `getById` (protectedProcedure) — single case with full data
- `getStats` (protectedProcedure) — summary card data
- `getCandidates` (protectedProcedure) — candidate deals
- `create` (memberProcedure) — create a case from a candidate deal
- `update` (memberProcedure) — update case (stage, assignee, priority, etc.)
- `resolve` (memberProcedure) — resolve case with outcome + optional agencyId
- `getNotes` (protectedProcedure) — list notes for a case
- `addNote` (memberProcedure) — add a note to a case
- `getNotifications` (protectedProcedure) — user's unread notifications
- `getNotificationCount` (protectedProcedure) — unread count
- `markNotificationRead` (protectedProcedure) — mark one read
- `markAllNotificationsRead` (protectedProcedure) — mark all read

**Step 2: Register in `_app.ts`**

Add import and registration following existing pattern.

**Step 3: Verify build**

Run: `cd /c/Users/suphi/dev/abacus && bun run --filter @api build`

**Step 4: Commit**

```bash
git add apps/api/src/trpc/routers/collections.ts apps/api/src/trpc/routers/_app.ts
git commit -m "feat(api): add collections tRPC router"
```

---

### Task 15: Create Collections Config Router

**Files:**
- Create: `apps/api/src/trpc/routers/collection-config.ts`
- Modify: `apps/api/src/trpc/routers/_app.ts`

**Step 1: Write the config router**

Procedures (all admin-only via `adminProcedure` except reads):

- `getStages` (protectedProcedure) — list stages
- `upsertStage` (adminProcedure) — create/update stage
- `deleteStage` (adminProcedure) — delete stage
- `getAgencies` (protectedProcedure) — list agencies
- `upsertAgency` (adminProcedure) — create/update agency
- `deleteAgency` (adminProcedure) — delete agency
- `getRules` (protectedProcedure) — list escalation rules
- `upsertRule` (adminProcedure) — create/update rule
- `deleteRule` (adminProcedure) — delete rule
- `getSlaConfigs` (protectedProcedure) — list SLA configs
- `upsertSlaConfig` (adminProcedure) — create/update SLA config
- `deleteSlaConfig` (adminProcedure) — delete SLA config

**Step 2: Register in `_app.ts`**

**Step 3: Verify build, commit**

```bash
git add apps/api/src/trpc/routers/collection-config.ts apps/api/src/trpc/routers/_app.ts
git commit -m "feat(api): add collection config tRPC router"
```

---

## Phase 4: Frontend — Navigation & Icons

### Task 16: Add Collections Icon

**Files:**
- Modify: `packages/ui/src/components/icons.tsx` (around line 700)

**Step 1: Import and add icon**

Add `MdOutlineAssignmentLate` from `react-icons/md` and register it as `Collections` in the Icons object.

**Step 2: Commit**

```bash
git add packages/ui/src/components/icons.tsx
git commit -m "feat(ui): add Collections icon"
```

---

### Task 17: Add Collections to Sidebar Navigation

**Files:**
- Modify: `apps/dashboard/src/components/main-menu.tsx`

**Step 1: Add icon mapping** (~line 14-26 in `icons` object)

```typescript
"/collections": () => <Icons.Collections size={20} />,
```

**Step 2: Add menu item** (in `allItems` array, after the reconciliation entry ~line 107)

```typescript
{
  path: "/collections",
  name: "Collections",
  children: [
    { path: "/collections/settings", name: "Settings" },
  ],
},
```

**Step 3: Add to `KNOWN_MENU_PATHS`** (~line 123-134)

Add `"/collections"` to the array.

**Step 4: Verify dev server renders correctly**

Run: `cd /c/Users/suphi/dev/abacus && bun dev --filter dashboard`
Check: Collections appears in sidebar between Reconciliation and Settings.

**Step 5: Commit**

```bash
git add apps/dashboard/src/components/main-menu.tsx
git commit -m "feat(dashboard): add Collections to sidebar navigation"
```

---

## Phase 5: Frontend — Main Collections Page

### Task 18: Create Collections Summary Cards Component

**Files:**
- Create: `apps/dashboard/src/components/collections/collections-summary.tsx`

**Step 1: Write the component**

Follow the pattern from existing summary card grids (e.g., merchant detail page). 5-column grid showing:
1. Total Active Cases (count, with icon)
2. Total Outstanding Balance (formatted currency)
3. Upcoming Follow-ups (count, due today/this week)
4. Recovery Rate (percentage with progress indicator)
5. Unassigned Cases (count, highlighted if > 0)

Uses `trpc.collections.getStats.useQuery()`.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/
git commit -m "feat(dashboard): add collections summary cards component"
```

---

### Task 19: Create Collections Data Table

**Files:**
- Create: `apps/dashboard/src/components/tables/collections/columns.tsx`
- Create: `apps/dashboard/src/components/tables/collections/data-table.tsx`

**Step 1: Define columns**

Follow the pattern from existing data tables (e.g., merchants data table). Columns:
- Deal Code (link to deal)
- Merchant Name
- Balance (formatted currency)
- Stage (colored badge)
- Assigned To (avatar + name, or "Unassigned")
- Priority (colored badge)
- Next Follow-up (date, highlighted if overdue)
- Days in Stage (calculated)
- SLA Status (green/yellow/red indicator)

**Step 2: Write the data table component**

Uses `trpc.collections.get.useInfiniteQuery()` with cursor pagination. Row click navigates to `/collections/[id]`.

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/tables/collections/
git commit -m "feat(dashboard): add collections data table"
```

---

### Task 20: Create Collections Header with Tab Filters

**Files:**
- Create: `apps/dashboard/src/components/collections/collections-header.tsx`

**Step 1: Write the component**

Tabs: "Candidates", "Active", "Resolved". Uses `useQueryState` from nuqs for URL-driven tab state. "Candidates" tab shows deals without cases. "Move to Collections" button on candidate rows.

Filter controls: stage dropdown, assignee dropdown, priority dropdown.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/collections-header.tsx
git commit -m "feat(dashboard): add collections header with tab filters"
```

---

### Task 21: Create Collections Main Page

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/page.tsx`

**Step 1: Write the page**

Follow the pattern from `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/page.tsx`. Server component that prefetches data and renders:
1. `CollectionsSummary` (summary cards)
2. `CollectionsHeader` (tabs + filters)
3. `DataTable` (collections data table)

**Step 2: Verify in browser**

Navigate to `/collections`. Should show summary cards, tabs, and empty table (no data yet).

**Step 3: Commit**

```bash
git add apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/
git commit -m "feat(dashboard): add collections main page"
```

---

## Phase 6: Frontend — Detail Page

### Task 22: Create Activity Timeline Component

**Files:**
- Create: `apps/dashboard/src/components/collections/activity-timeline.tsx`

**Step 1: Write the component**

Chronological list of notes and system events. Each entry shows:
- Author avatar + name
- Timestamp
- Structured fields (contact name, method, follow-up date) displayed as tags/badges
- Free-text summary
- System events (stage changes, escalations) styled differently (lighter, with icon)

Uses `trpc.collections.getNotes.useQuery({ caseId })`.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/activity-timeline.tsx
git commit -m "feat(dashboard): add collections activity timeline component"
```

---

### Task 23: Create Add Note Form Component

**Files:**
- Create: `apps/dashboard/src/components/collections/add-note-form.tsx`

**Step 1: Write the component**

React Hook Form + Zod validation. Fields:
- Contact Name (text input, optional)
- Contact Method (select: phone/email/text/in_person/other, optional)
- Follow-up Date (date picker, optional)
- Summary (textarea, required)
- Submit button

On submit calls `trpc.collections.addNote.useMutation()`. On success, invalidates notes query and resets form. If `followUpDate` is set, also updates `nextFollowUp` on the case.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/add-note-form.tsx
git commit -m "feat(dashboard): add collections note form component"
```

---

### Task 24: Create Case Detail Sidebar Cards

**Files:**
- Create: `apps/dashboard/src/components/collections/case-deal-summary.tsx`
- Create: `apps/dashboard/src/components/collections/case-merchant-info.tsx`
- Create: `apps/dashboard/src/components/collections/case-sla-indicators.tsx`

**Step 1: Write Deal Summary Card**

Shows: funded amount, payback amount, current balance, total paid, factor rate, funded date, deal status. Data from the case's joined deal.

**Step 2: Write Merchant Info Card**

Shows: merchant name, contact info, link to `/merchants/[id]`, collections history badge (e.g., "2 deals in collections").

**Step 3: Write SLA Indicators Card**

Shows: time in current stage (with threshold bar), response time (overdue indicator), total resolution time. Green/yellow/red based on SLA configs.

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/collections/case-*.tsx
git commit -m "feat(dashboard): add collection case detail sidebar cards"
```

---

### Task 25: Create Case Detail Header

**Files:**
- Create: `apps/dashboard/src/components/collections/case-detail-header.tsx`

**Step 1: Write the component**

Back link to `/collections`. Deal code + merchant name as title. Stage badge with dropdown to change stage. Assign/reassign button (dropdown of team members with collections permission). Priority selector. "Resolve" button that opens a dialog with outcome options — "Sent to Agency" option shows an agency picker dropdown.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/case-detail-header.tsx
git commit -m "feat(dashboard): add collection case detail header"
```

---

### Task 26: Create Collection Detail Page

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/[id]/page.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/[id]/collection-detail-content.tsx`

**Step 1: Write the page.tsx**

Server component that prefetches the case data, 404s if not found, and renders `CollectionDetailContent`.

**Step 2: Write CollectionDetailContent**

Two-column layout:
- Left (60%): `CaseDetailHeader`, `AddNoteForm`, `ActivityTimeline`
- Right (40%): `CaseDealSummary`, `CaseMerchantInfo`, `CaseSlaIndicators`

**Step 3: Verify in browser**

Navigate to `/collections/[id]` (will need test data). Should render the full detail page.

**Step 4: Commit**

```bash
git add apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/[id]/
git commit -m "feat(dashboard): add collection detail page"
```

---

## Phase 7: Frontend — Settings

### Task 27: Create Collections Settings — Stages Tab

**Files:**
- Create: `apps/dashboard/src/components/collections/settings/stages-settings.tsx`

**Step 1: Write the component**

Drag-to-reorder list (use existing DnD patterns or `@dnd-kit`). Each row: color picker, name input, slug (auto-generated), default toggle, terminal toggle, delete button. "Add Stage" button at bottom. Validation: at least one default and one terminal stage. Uses `trpc.collectionConfig.upsertStage` and `trpc.collectionConfig.deleteStage`.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/settings/stages-settings.tsx
git commit -m "feat(dashboard): add collection stages settings component"
```

---

### Task 28: Create Collections Settings — Agencies Tab

**Files:**
- Create: `apps/dashboard/src/components/collections/settings/agencies-settings.tsx`

**Step 1: Write the component**

List of agencies with add/edit/deactivate. Each row: name, contact name, email, phone, notes, active toggle. "Add Agency" button opens inline form or dialog.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/collections/settings/agencies-settings.tsx
git commit -m "feat(dashboard): add collection agencies settings component"
```

---

### Task 29: Create Collections Settings — Escalation Rules & SLA Tabs

**Files:**
- Create: `apps/dashboard/src/components/collections/settings/escalation-rules-settings.tsx`
- Create: `apps/dashboard/src/components/collections/settings/sla-settings.tsx`

**Step 1: Write Escalation Rules component**

Table of rules. Add button opens form: trigger type (time/event), from stage, to stage, condition (days or event type), active toggle.

**Step 2: Write SLA Settings component**

Per-stage thresholds table. Each row: stage name, metric (time_in_stage/response_time/resolution_time), threshold input (hours/days). Global resolution time threshold separate.

**Step 3: Commit**

```bash
git add apps/dashboard/src/components/collections/settings/
git commit -m "feat(dashboard): add escalation rules and SLA settings components"
```

---

### Task 30: Create Collections Settings Pages

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/settings/page.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/collections/page.tsx`

**Step 1: Write both pages**

Both render the same tabbed settings component with 4 tabs: Stages, Agencies, Escalation Rules, SLA Thresholds. The `/collections/settings` page has a back link to `/collections`. The `/settings/collections` page fits within the existing settings layout.

**Step 2: Commit**

```bash
git add apps/dashboard/src/app/[locale]/(app)/(sidebar)/collections/settings/ apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/collections/
git commit -m "feat(dashboard): add collections settings pages"
```

---

## Phase 8: Merchant-Level Collections Visibility

### Task 31: Add Collections Section to Merchant Detail Page

**Files:**
- Create: `apps/dashboard/src/components/collections/merchant-collections-section.tsx`
- Modify: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/` (the merchant detail content component)

**Step 1: Write the component**

Shows for a given merchant:
- Count of active collections cases
- List of past and current cases with: deal code, stage, outcome, agency (if sent), dates
- Overall risk indicator (e.g., "2 of 5 deals in collections")
- Link to each case's detail page

Uses a new query: `trpc.collections.getByMerchantId.useQuery({ merchantId })`.

**Step 2: Add the query to collections router**

Add `getByMerchantId` procedure that queries collection_cases joined to mca_deals where `mca_deals.merchantId` matches.

**Step 3: Add the section to merchant detail page**

Insert `MerchantCollectionsSection` into the merchant detail content, after existing sections.

**Step 4: Commit**

```bash
git add apps/dashboard/src/components/collections/merchant-collections-section.tsx apps/api/src/trpc/routers/collections.ts apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/
git commit -m "feat(dashboard): add collections section to merchant detail page"
```

---

## Phase 9: Background Jobs & Automation

### Task 32: Create Escalation Cron Job

**Files:**
- Create: `apps/worker/src/jobs/collections/auto-escalate.ts`
- Modify: `apps/worker/src/` (register the job)

**Step 1: Write the job**

Trigger.dev scheduled task that runs daily. For each team:
1. Fetch active escalation rules
2. For time-based rules: find cases in `fromStage` where `stageEnteredAt + daysInStage` has passed
3. Transition matching cases to `toStage`, update `stageEnteredAt`
4. Create a system note on each transitioned case
5. Create notifications for assigned users and admins

**Step 2: Register the job in the worker**

**Step 3: Commit**

```bash
git add apps/worker/src/jobs/collections/
git commit -m "feat(worker): add collections auto-escalation cron job"
```

---

### Task 33: Create SLA Breach Check Cron Job

**Files:**
- Create: `apps/worker/src/jobs/collections/sla-check.ts`

**Step 1: Write the job**

Trigger.dev scheduled task that runs daily. For each team:
1. Fetch SLA configs
2. For each active case, check each applicable metric against thresholds
3. Create notifications for breached SLAs (avoid duplicates — check if notification already sent today)

**Step 2: Register the job**

**Step 3: Commit**

```bash
git add apps/worker/src/jobs/collections/sla-check.ts
git commit -m "feat(worker): add SLA breach check cron job"
```

---

### Task 34: Create Follow-up Reminder Cron Job

**Files:**
- Create: `apps/worker/src/jobs/collections/follow-up-reminders.ts`

**Step 1: Write the job**

Trigger.dev scheduled task that runs daily. Finds cases where `nextFollowUp` is today or overdue. Creates notifications for assigned users.

**Step 2: Register the job, commit**

```bash
git add apps/worker/src/jobs/collections/follow-up-reminders.ts
git commit -m "feat(worker): add follow-up reminder cron job"
```

---

### Task 35: Hook Event-Based Escalation into Payment Processing

**Files:**
- Modify: Payment processing code (likely in `packages/ach/` or the MCA payments router)

**Step 1: Find the payment failure/NSF handler**

Search for where `nsf` or payment `returned`/`failed` status is set on `mcaPayments`.

**Step 2: Add event-based escalation trigger**

After a payment failure, check if the deal has an active collection case. If so, check for event-based escalation rules matching `missed_payment` or `nsf_returned`. If a rule matches, transition the case.

If the deal doesn't have a collection case but the deal status gets changed to `late`/`defaulted`, it will appear in candidates automatically (no action needed).

**Step 3: Commit**

```bash
git add packages/ach/ apps/api/src/trpc/routers/
git commit -m "feat: hook event-based collection escalation into payment processing"
```

---

## Phase 10: Notification Bell Integration

### Task 36: Add Collections Notification Bell

**Files:**
- Modify: `apps/dashboard/src/components/notification-center/notification-center.tsx` (or create new component if needed)

**Step 1: Integrate collections notifications**

Add collections notification count to the existing notification bell. When clicked, show collections notifications in a section/tab. Each notification links to the relevant case detail page.

Uses `trpc.collections.getNotificationCount.useQuery()` and `trpc.collections.getNotifications.useQuery()`.

**Step 2: Commit**

```bash
git add apps/dashboard/src/components/notification-center/
git commit -m "feat(dashboard): integrate collections notifications into notification center"
```

---

## Phase 11: Default Stage Seeding

### Task 37: Seed Default Stages on Team Creation

**Files:**
- Modify: Team creation flow (likely in the team creation mutation or a Trigger.dev job)

**Step 1: Find where teams are created**

Search for team creation mutation.

**Step 2: Add seedDefaultStages call**

After a team is created, call `seedDefaultStages(db, { teamId })` to create the 7 default collection stages.

**Step 3: Create a one-time migration/script for existing teams**

Write a script that seeds default stages for all existing teams that don't have any yet.

**Step 4: Commit**

```bash
git add apps/api/ packages/db/
git commit -m "feat: seed default collection stages on team creation"
```

---

## Phase 12: Final Integration & Polish

### Task 38: Add Zod Validation Schemas

**Files:**
- Create: `packages/db/src/schemas/collections.ts`

**Step 1: Write Zod schemas**

Create Zod schemas for all input types used by the tRPC routers. Export from the package.

**Step 2: Update tRPC routers to use shared schemas**

Replace inline `z.object(...)` definitions with the shared schemas.

**Step 3: Commit**

```bash
git add packages/db/src/schemas/collections.ts apps/api/src/trpc/routers/
git commit -m "feat: add shared Zod validation schemas for collections"
```

---

### Task 39: End-to-End Smoke Test

**Step 1: Start dev environment**

Run: `cd /c/Users/suphi/dev/abacus && bun dev`

**Step 2: Verify navigation**

- Collections appears in sidebar
- Clicking navigates to `/collections`

**Step 3: Verify settings**

- Navigate to `/collections/settings` and `/settings/collections`
- Default stages are visible
- Can add/edit/delete stages, agencies, rules, SLA configs

**Step 4: Verify candidate surfacing**

- Create a deal with `late` status (via seed data or API)
- It appears in the "Candidates" tab

**Step 5: Verify case creation and detail page**

- Click "Move to Collections" on a candidate
- Case appears in "Active" tab
- Click to open detail page
- Add a note with contact info and follow-up date
- Change stage, assign to self, set priority

**Step 6: Verify resolution with agency**

- Click "Resolve" → "Sent to Agency" → select agency
- Case moves to Resolved tab with agency recorded

**Step 7: Verify merchant detail**

- Navigate to the merchant's detail page
- Collections section shows the case with its outcome

**Step 8: Commit any fixes**

```bash
git commit -m "fix: address smoke test issues in collections module"
```
