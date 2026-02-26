# Underwriting System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a merchant-level underwriting system with document upload, AI-assisted scoring, and team-configurable requirements that gates deal creation.

**Architecture:** Four new database tables (`underwriting_applications`, `underwriting_document_requirements`, `underwriting_documents`, `underwriting_scores`) with RLS. A new tRPC router handles all underwriting CRUD. A 3-step wizard UI for the underwriting flow. The merchant detail page gets a summary card. AI scoring combines rule-based buy box checks with Claude bank statement analysis.

**Tech Stack:** Drizzle ORM (schema), Supabase (Postgres + Storage), tRPC (API), React + Tailwind (UI), Zod (validation), Claude API via @anthropic-ai/sdk (AI scoring)

---

## Task 1: Database Migration — New Tables

**Files:**
- Create: `supabase/migrations/20260227300000_add_underwriting_tables.sql`
- Modify: `packages/db/src/schema.ts`

**Step 1: Write the SQL migration**

```sql
-- Migration: Add underwriting system tables
-- Created: 2026-02-27
-- Purpose: Create tables for underwriting applications, document requirements, documents, and scores

-- ============================================================================
-- PART 1: Enums
-- ============================================================================

CREATE TYPE underwriting_application_status AS ENUM (
  'pending_documents',
  'in_review',
  'scoring',
  'approved',
  'declined',
  'review_needed'
);

CREATE TYPE underwriting_decision AS ENUM (
  'approved',
  'declined',
  'review_needed'
);

CREATE TYPE underwriting_doc_processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE underwriting_recommendation AS ENUM (
  'approve',
  'decline',
  'review_needed'
);

CREATE TYPE underwriting_confidence AS ENUM (
  'high',
  'medium',
  'low'
);

-- ============================================================================
-- PART 2: underwriting_document_requirements (team-configurable checklist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.underwriting_document_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  required boolean NOT NULL DEFAULT true,
  applies_to_states text[] DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uw_doc_req_team_id ON public.underwriting_document_requirements(team_id);

ALTER TABLE public.underwriting_document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view underwriting doc requirements"
  ON public.underwriting_document_requirements FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can insert underwriting doc requirements"
  ON public.underwriting_document_requirements FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update underwriting doc requirements"
  ON public.underwriting_document_requirements FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team owners can delete underwriting doc requirements"
  ON public.underwriting_document_requirements FOR DELETE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = 'owner'));

-- ============================================================================
-- PART 3: underwriting_applications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.underwriting_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status underwriting_application_status NOT NULL DEFAULT 'pending_documents',

  -- Merchant profile snapshot
  requested_amount_min numeric(12, 2),
  requested_amount_max numeric(12, 2),
  use_of_funds text,
  fico_range text,
  time_in_business_months integer,

  -- Qualitative context
  broker_notes text,
  prior_mca_history text,

  -- Decision
  decision underwriting_decision,
  decision_date timestamp with time zone,
  decided_by uuid REFERENCES auth.users(id),
  decision_notes text,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uw_app_merchant_id ON public.underwriting_applications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_uw_app_team_id ON public.underwriting_applications(team_id);
CREATE INDEX IF NOT EXISTS idx_uw_app_status ON public.underwriting_applications(status);

ALTER TABLE public.underwriting_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view underwriting applications"
  ON public.underwriting_applications FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can insert underwriting applications"
  ON public.underwriting_applications FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update underwriting applications"
  ON public.underwriting_applications FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team owners can delete underwriting applications"
  ON public.underwriting_applications FOR DELETE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = 'owner'));

-- ============================================================================
-- PART 4: underwriting_documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.underwriting_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.underwriting_applications(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES public.underwriting_document_requirements(id) ON DELETE SET NULL,

  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  document_type text,

  processing_status underwriting_doc_processing_status NOT NULL DEFAULT 'pending',
  extraction_results jsonb,

  waived boolean NOT NULL DEFAULT false,
  waive_reason text,

  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uw_doc_application_id ON public.underwriting_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_uw_doc_team_id ON public.underwriting_documents(team_id);

ALTER TABLE public.underwriting_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view underwriting documents"
  ON public.underwriting_documents FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can insert underwriting documents"
  ON public.underwriting_documents FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update underwriting documents"
  ON public.underwriting_documents FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team owners can delete underwriting documents"
  ON public.underwriting_documents FOR DELETE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid() AND role = 'owner'));

-- ============================================================================
-- PART 5: underwriting_scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.underwriting_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.underwriting_applications(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  recommendation underwriting_recommendation,
  confidence underwriting_confidence,

  buy_box_results jsonb,
  bank_analysis jsonb,
  extracted_metrics jsonb,
  risk_flags jsonb,
  prior_mca_flags jsonb,
  ai_narrative text,

  scored_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uw_score_application_id ON public.underwriting_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_uw_score_team_id ON public.underwriting_scores(team_id);

ALTER TABLE public.underwriting_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view underwriting scores"
  ON public.underwriting_scores FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can insert underwriting scores"
  ON public.underwriting_scores FOR INSERT
  WITH CHECK (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

CREATE POLICY "Team members can update underwriting scores"
  ON public.underwriting_scores FOR UPDATE
  USING (team_id IN (SELECT team_id FROM public.users_on_team WHERE user_id = auth.uid()));

-- ============================================================================
-- PART 6: Add underwriting_enabled to teams + underwriting_application_id to mca_deals
-- ============================================================================

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS underwriting_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.mca_deals ADD COLUMN IF NOT EXISTS underwriting_application_id uuid
  REFERENCES public.underwriting_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mca_deals_uw_app_id ON public.mca_deals(underwriting_application_id);
```

Create this file at `supabase/migrations/20260227300000_add_underwriting_tables.sql`.

**Step 2: Add Drizzle schema definitions**

Add to `packages/db/src/schema.ts` after the existing `underwritingBuyBox` table definition (~line 4421). Follow the exact patterns used by `mcaDeals` and `underwritingBuyBox`:

```typescript
// ── Underwriting Enums ──────────────────────────────────────────────────────

export const underwritingApplicationStatusEnum = pgEnum(
  "underwriting_application_status",
  ["pending_documents", "in_review", "scoring", "approved", "declined", "review_needed"],
);

export const underwritingDecisionEnum = pgEnum("underwriting_decision", [
  "approved",
  "declined",
  "review_needed",
]);

export const underwritingDocProcessingStatusEnum = pgEnum(
  "underwriting_doc_processing_status",
  ["pending", "processing", "completed", "failed"],
);

export const underwritingRecommendationEnum = pgEnum(
  "underwriting_recommendation",
  ["approve", "decline", "review_needed"],
);

export const underwritingConfidenceEnum = pgEnum("underwriting_confidence", [
  "high",
  "medium",
  "low",
]);

// ── Underwriting Document Requirements ──────────────────────────────────────

export const underwritingDocumentRequirements = pgTable(
  "underwriting_document_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    required: boolean("required").notNull().default(true),
    appliesToStates: text("applies_to_states").array().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_uw_doc_req_team_id").on(table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "uw_doc_req_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage underwriting doc requirements", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const underwritingDocumentRequirementsRelations = relations(
  underwritingDocumentRequirements,
  ({ one }) => ({
    team: one(teams, {
      fields: [underwritingDocumentRequirements.teamId],
      references: [teams.id],
    }),
  }),
);

// ── Underwriting Applications ───────────────────────────────────────────────

export const underwritingApplications = pgTable(
  "underwriting_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id").notNull(),
    teamId: uuid("team_id").notNull(),
    status: underwritingApplicationStatusEnum().notNull().default("pending_documents"),

    requestedAmountMin: numericCasted("requested_amount_min", { precision: 12, scale: 2 }),
    requestedAmountMax: numericCasted("requested_amount_max", { precision: 12, scale: 2 }),
    useOfFunds: text("use_of_funds"),
    ficoRange: text("fico_range"),
    timeInBusinessMonths: integer("time_in_business_months"),

    brokerNotes: text("broker_notes"),
    priorMcaHistory: text("prior_mca_history"),

    decision: underwritingDecisionEnum(),
    decisionDate: timestamp("decision_date", { withTimezone: true, mode: "string" }),
    decidedBy: uuid("decided_by"),
    decisionNotes: text("decision_notes"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_uw_app_merchant_id").on(table.merchantId),
    index("idx_uw_app_team_id").on(table.teamId),
    index("idx_uw_app_status").on(table.status),
    foreignKey({
      columns: [table.merchantId],
      foreignColumns: [merchants.id],
      name: "uw_app_merchant_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "uw_app_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage underwriting applications", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const underwritingApplicationsRelations = relations(
  underwritingApplications,
  ({ one, many }) => ({
    merchant: one(merchants, {
      fields: [underwritingApplications.merchantId],
      references: [merchants.id],
    }),
    team: one(teams, {
      fields: [underwritingApplications.teamId],
      references: [teams.id],
    }),
    documents: many(underwritingDocuments),
    scores: many(underwritingScores),
  }),
);

// ── Underwriting Documents ──────────────────────────────────────────────────

export const underwritingDocuments = pgTable(
  "underwriting_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").notNull(),
    teamId: uuid("team_id").notNull(),
    requirementId: uuid("requirement_id"),

    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size"),
    documentType: text("document_type"),

    processingStatus: underwritingDocProcessingStatusEnum("processing_status")
      .notNull()
      .default("pending"),
    extractionResults: jsonb("extraction_results"),

    waived: boolean("waived").notNull().default(false),
    waiveReason: text("waive_reason"),

    uploadedAt: timestamp("uploaded_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_uw_doc_application_id").on(table.applicationId),
    index("idx_uw_doc_team_id").on(table.teamId),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [underwritingApplications.id],
      name: "uw_doc_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "uw_doc_team_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.requirementId],
      foreignColumns: [underwritingDocumentRequirements.id],
      name: "uw_doc_requirement_id_fkey",
    }).onDelete("set null"),
    pgPolicy("Team members can manage underwriting documents", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const underwritingDocumentsRelations = relations(
  underwritingDocuments,
  ({ one }) => ({
    application: one(underwritingApplications, {
      fields: [underwritingDocuments.applicationId],
      references: [underwritingApplications.id],
    }),
    team: one(teams, {
      fields: [underwritingDocuments.teamId],
      references: [teams.id],
    }),
    requirement: one(underwritingDocumentRequirements, {
      fields: [underwritingDocuments.requirementId],
      references: [underwritingDocumentRequirements.id],
    }),
  }),
);

// ── Underwriting Scores ─────────────────────────────────────────────────────

export const underwritingScores = pgTable(
  "underwriting_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id").notNull(),
    teamId: uuid("team_id").notNull(),

    recommendation: underwritingRecommendationEnum(),
    confidence: underwritingConfidenceEnum(),

    buyBoxResults: jsonb("buy_box_results"),
    bankAnalysis: jsonb("bank_analysis"),
    extractedMetrics: jsonb("extracted_metrics"),
    riskFlags: jsonb("risk_flags"),
    priorMcaFlags: jsonb("prior_mca_flags"),
    aiNarrative: text("ai_narrative"),

    scoredAt: timestamp("scored_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_uw_score_application_id").on(table.applicationId),
    index("idx_uw_score_team_id").on(table.teamId),
    foreignKey({
      columns: [table.applicationId],
      foreignColumns: [underwritingApplications.id],
      name: "uw_score_application_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "uw_score_team_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Team members can manage underwriting scores", {
      as: "permissive",
      for: "all",
      to: ["public"],
      using: sql`(team_id IN ( SELECT private.get_teams_for_authenticated_user() AS get_teams_for_authenticated_user))`,
    }),
  ],
);

export const underwritingScoresRelations = relations(
  underwritingScores,
  ({ one }) => ({
    application: one(underwritingApplications, {
      fields: [underwritingScores.applicationId],
      references: [underwritingApplications.id],
    }),
    team: one(teams, {
      fields: [underwritingScores.teamId],
      references: [teams.id],
    }),
  }),
);
```

Also add to the `mcaDeals` table definition the new FK column:

```typescript
// Add after existing columns in mcaDeals pgTable definition (~line 3640)
underwritingApplicationId: uuid("underwriting_application_id"),
```

And add to the `teams` table the toggle:

```typescript
// Add to teams pgTable definition
underwritingEnabled: boolean("underwriting_enabled").notNull().default(false),
```

**Step 3: Run the migration**

Run: `cd apps/dashboard && supabase db push` (or apply via Supabase MCP `apply_migration`)

**Step 4: Generate TypeScript types**

Run: `supabase gen types typescript --project-id <project-id> > packages/supabase/src/types/db.ts`

**Step 5: Commit**

```bash
git add supabase/migrations/20260227300000_add_underwriting_tables.sql packages/db/src/schema.ts
git commit -m "feat: add underwriting system database tables and schema"
```

---

## Task 2: Database Queries — Underwriting CRUD

**Files:**
- Create: `packages/db/src/queries/underwriting-applications.ts`
- Create: `packages/db/src/queries/underwriting-documents.ts`
- Create: `packages/db/src/queries/underwriting-scores.ts`
- Create: `packages/db/src/queries/underwriting-requirements.ts`
- Modify: `packages/db/src/queries/index.ts` (add exports)

**Step 1: Write underwriting-applications.ts**

Follow the pattern from `packages/db/src/queries/mca-deals.ts` and `packages/db/src/queries/underwriting.ts`:

```typescript
import type { Database } from "@db/client";
import {
  underwritingApplications,
  underwritingDocuments,
  underwritingScores,
  merchants,
} from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type GetUnderwritingApplicationParams = {
  id: string;
  teamId: string;
};

export const getUnderwritingApplicationById = async (
  db: Database,
  params: GetUnderwritingApplicationParams,
) => {
  const [result] = await db
    .select({
      id: underwritingApplications.id,
      merchantId: underwritingApplications.merchantId,
      teamId: underwritingApplications.teamId,
      status: underwritingApplications.status,
      requestedAmountMin: underwritingApplications.requestedAmountMin,
      requestedAmountMax: underwritingApplications.requestedAmountMax,
      useOfFunds: underwritingApplications.useOfFunds,
      ficoRange: underwritingApplications.ficoRange,
      timeInBusinessMonths: underwritingApplications.timeInBusinessMonths,
      brokerNotes: underwritingApplications.brokerNotes,
      priorMcaHistory: underwritingApplications.priorMcaHistory,
      decision: underwritingApplications.decision,
      decisionDate: underwritingApplications.decisionDate,
      decidedBy: underwritingApplications.decidedBy,
      decisionNotes: underwritingApplications.decisionNotes,
      createdAt: underwritingApplications.createdAt,
      updatedAt: underwritingApplications.updatedAt,
      merchantName: merchants.name,
      merchantEmail: merchants.email,
      merchantState: merchants.state,
      merchantIndustry: merchants.industry,
    })
    .from(underwritingApplications)
    .where(
      and(
        eq(underwritingApplications.id, params.id),
        eq(underwritingApplications.teamId, params.teamId),
      ),
    )
    .leftJoin(merchants, eq(merchants.id, underwritingApplications.merchantId));

  return result ?? null;
};

export type GetUnderwritingByMerchantParams = {
  merchantId: string;
  teamId: string;
};

export const getUnderwritingByMerchant = async (
  db: Database,
  params: GetUnderwritingByMerchantParams,
) => {
  const [result] = await db
    .select()
    .from(underwritingApplications)
    .where(
      and(
        eq(underwritingApplications.merchantId, params.merchantId),
        eq(underwritingApplications.teamId, params.teamId),
      ),
    )
    .orderBy(desc(underwritingApplications.createdAt))
    .limit(1);

  return result ?? null;
};

export type CreateUnderwritingApplicationParams = {
  merchantId: string;
  teamId: string;
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  useOfFunds?: string | null;
  ficoRange?: string | null;
  timeInBusinessMonths?: number | null;
  brokerNotes?: string | null;
  priorMcaHistory?: string | null;
};

export const createUnderwritingApplication = async (
  db: Database,
  params: CreateUnderwritingApplicationParams,
) => {
  const [result] = await db
    .insert(underwritingApplications)
    .values(params)
    .returning();

  return result;
};

export type UpdateUnderwritingApplicationParams = {
  id: string;
  teamId: string;
  status?: string;
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  useOfFunds?: string | null;
  ficoRange?: string | null;
  timeInBusinessMonths?: number | null;
  brokerNotes?: string | null;
  priorMcaHistory?: string | null;
  decision?: string | null;
  decisionDate?: string | null;
  decidedBy?: string | null;
  decisionNotes?: string | null;
};

export const updateUnderwritingApplication = async (
  db: Database,
  params: UpdateUnderwritingApplicationParams,
) => {
  const { id, teamId, ...updates } = params;

  const [result] = await db
    .update(underwritingApplications)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(underwritingApplications.id, id),
        eq(underwritingApplications.teamId, teamId),
      ),
    )
    .returning();

  return result;
};
```

**Step 2: Write underwriting-documents.ts**

```typescript
import type { Database } from "@db/client";
import { underwritingDocuments } from "@db/schema";
import { and, eq } from "drizzle-orm";

export type GetUnderwritingDocumentsParams = {
  applicationId: string;
  teamId: string;
};

export const getUnderwritingDocuments = async (
  db: Database,
  params: GetUnderwritingDocumentsParams,
) => {
  return db
    .select()
    .from(underwritingDocuments)
    .where(
      and(
        eq(underwritingDocuments.applicationId, params.applicationId),
        eq(underwritingDocuments.teamId, params.teamId),
      ),
    );
};

export type CreateUnderwritingDocumentParams = {
  applicationId: string;
  teamId: string;
  requirementId?: string | null;
  filePath: string;
  fileName: string;
  fileSize?: number | null;
  documentType?: string | null;
};

export const createUnderwritingDocument = async (
  db: Database,
  params: CreateUnderwritingDocumentParams,
) => {
  const [result] = await db
    .insert(underwritingDocuments)
    .values(params)
    .returning();

  return result;
};

export type UpdateUnderwritingDocumentParams = {
  id: string;
  teamId: string;
  processingStatus?: string;
  extractionResults?: unknown;
  waived?: boolean;
  waiveReason?: string | null;
};

export const updateUnderwritingDocument = async (
  db: Database,
  params: UpdateUnderwritingDocumentParams,
) => {
  const { id, teamId, ...updates } = params;

  const [result] = await db
    .update(underwritingDocuments)
    .set(updates)
    .where(
      and(
        eq(underwritingDocuments.id, id),
        eq(underwritingDocuments.teamId, teamId),
      ),
    )
    .returning();

  return result;
};
```

**Step 3: Write underwriting-scores.ts**

```typescript
import type { Database } from "@db/client";
import { underwritingScores } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

export type GetUnderwritingScoreParams = {
  applicationId: string;
  teamId: string;
};

export const getUnderwritingScore = async (
  db: Database,
  params: GetUnderwritingScoreParams,
) => {
  const [result] = await db
    .select()
    .from(underwritingScores)
    .where(
      and(
        eq(underwritingScores.applicationId, params.applicationId),
        eq(underwritingScores.teamId, params.teamId),
      ),
    )
    .orderBy(desc(underwritingScores.scoredAt))
    .limit(1);

  return result ?? null;
};

export type CreateUnderwritingScoreParams = {
  applicationId: string;
  teamId: string;
  recommendation?: string | null;
  confidence?: string | null;
  buyBoxResults?: unknown;
  bankAnalysis?: unknown;
  extractedMetrics?: unknown;
  riskFlags?: unknown;
  priorMcaFlags?: unknown;
  aiNarrative?: string | null;
};

export const createUnderwritingScore = async (
  db: Database,
  params: CreateUnderwritingScoreParams,
) => {
  const [result] = await db
    .insert(underwritingScores)
    .values(params)
    .returning();

  return result;
};
```

**Step 4: Write underwriting-requirements.ts**

```typescript
import type { Database } from "@db/client";
import { underwritingDocumentRequirements } from "@db/schema";
import { and, asc, eq } from "drizzle-orm";

export type GetDocRequirementsParams = {
  teamId: string;
};

export const getUnderwritingDocRequirements = async (
  db: Database,
  params: GetDocRequirementsParams,
) => {
  return db
    .select()
    .from(underwritingDocumentRequirements)
    .where(eq(underwritingDocumentRequirements.teamId, params.teamId))
    .orderBy(asc(underwritingDocumentRequirements.sortOrder));
};

export type UpsertDocRequirementParams = {
  id?: string;
  teamId: string;
  name: string;
  description?: string | null;
  required?: boolean;
  appliesToStates?: string[];
  sortOrder?: number;
};

export const upsertUnderwritingDocRequirement = async (
  db: Database,
  params: UpsertDocRequirementParams,
) => {
  if (params.id) {
    const { id, teamId, ...updates } = params;
    const [result] = await db
      .update(underwritingDocumentRequirements)
      .set(updates)
      .where(
        and(
          eq(underwritingDocumentRequirements.id, id),
          eq(underwritingDocumentRequirements.teamId, teamId),
        ),
      )
      .returning();
    return result;
  }

  const [result] = await db
    .insert(underwritingDocumentRequirements)
    .values(params)
    .returning();

  return result;
};

export type DeleteDocRequirementParams = {
  id: string;
  teamId: string;
};

export const deleteUnderwritingDocRequirement = async (
  db: Database,
  params: DeleteDocRequirementParams,
) => {
  await db
    .delete(underwritingDocumentRequirements)
    .where(
      and(
        eq(underwritingDocumentRequirements.id, params.id),
        eq(underwritingDocumentRequirements.teamId, params.teamId),
      ),
    );
};

export type SeedDefaultRequirementsParams = {
  teamId: string;
};

export const seedDefaultDocRequirements = async (
  db: Database,
  params: SeedDefaultRequirementsParams,
) => {
  const defaults = [
    { name: "Application Form", description: "Completed merchant application", required: true, sortOrder: 0 },
    { name: "Bank Statements (3 months)", description: "Last 3 months of business bank statements", required: true, sortOrder: 1 },
    { name: "Tax Returns", description: "Most recent business tax returns", required: true, sortOrder: 2 },
  ];

  return db
    .insert(underwritingDocumentRequirements)
    .values(defaults.map((d) => ({ ...d, teamId: params.teamId })))
    .returning();
};
```

**Step 5: Add exports to index.ts**

Add these lines to `packages/db/src/queries/index.ts`:

```typescript
export * from "./underwriting-applications";
export * from "./underwriting-documents";
export * from "./underwriting-scores";
export * from "./underwriting-requirements";
```

**Step 6: Commit**

```bash
git add packages/db/src/queries/underwriting-*.ts packages/db/src/queries/index.ts
git commit -m "feat: add underwriting database query functions"
```

---

## Task 3: tRPC Router — Underwriting API

**Files:**
- Create: `apps/api/src/trpc/routers/underwriting-applications.ts`
- Modify: `apps/api/src/trpc/routers/_app.ts` (register router)

**Step 1: Write the underwriting applications tRPC router**

Follow the pattern from `apps/api/src/trpc/routers/mca-deals.ts`:

```typescript
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
} from "@api/trpc/init";
import {
  createUnderwritingApplication,
  getUnderwritingApplicationById,
  getUnderwritingByMerchant,
  updateUnderwritingApplication,
} from "@db/queries/underwriting-applications";
import {
  getUnderwritingDocuments,
  createUnderwritingDocument,
  updateUnderwritingDocument,
} from "@db/queries/underwriting-documents";
import {
  getUnderwritingScore,
  createUnderwritingScore,
} from "@db/queries/underwriting-scores";
import {
  getUnderwritingDocRequirements,
  upsertUnderwritingDocRequirement,
  deleteUnderwritingDocRequirement,
  seedDefaultDocRequirements,
} from "@db/queries/underwriting-requirements";
import { getUnderwritingBuyBox } from "@db/queries/underwriting";
import { z } from "zod";

export const underwritingApplicationsRouter = createTRPCRouter({
  // ── Applications ────────────────────────────────────────────────────────
  getByMerchant: protectedProcedure
    .input(z.object({ merchantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getUnderwritingByMerchant(ctx.db, {
        merchantId: input.merchantId,
        teamId: ctx.teamId!,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getUnderwritingApplicationById(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });
    }),

  create: memberProcedure
    .input(
      z.object({
        merchantId: z.string().uuid(),
        requestedAmountMin: z.number().positive().optional(),
        requestedAmountMax: z.number().positive().optional(),
        useOfFunds: z.string().optional(),
        ficoRange: z.string().optional(),
        timeInBusinessMonths: z.number().int().positive().optional(),
        brokerNotes: z.string().optional(),
        priorMcaHistory: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createUnderwritingApplication(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  update: memberProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending_documents", "in_review", "scoring", "approved", "declined", "review_needed"]).optional(),
        requestedAmountMin: z.number().positive().nullable().optional(),
        requestedAmountMax: z.number().positive().nullable().optional(),
        useOfFunds: z.string().nullable().optional(),
        ficoRange: z.string().nullable().optional(),
        timeInBusinessMonths: z.number().int().positive().nullable().optional(),
        brokerNotes: z.string().nullable().optional(),
        priorMcaHistory: z.string().nullable().optional(),
        decision: z.enum(["approved", "declined", "review_needed"]).nullable().optional(),
        decisionNotes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, unknown> = { ...input };
      if (input.decision) {
        updates.decisionDate = new Date().toISOString();
        updates.decidedBy = ctx.session!.user.id;
      }
      return updateUnderwritingApplication(ctx.db, {
        ...updates,
        id: input.id,
        teamId: ctx.teamId!,
      } as Parameters<typeof updateUnderwritingApplication>[1]);
    }),

  // ── Documents ───────────────────────────────────────────────────────────
  getDocuments: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getUnderwritingDocuments(ctx.db, {
        applicationId: input.applicationId,
        teamId: ctx.teamId!,
      });
    }),

  uploadDocument: memberProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        requirementId: z.string().uuid().optional(),
        filePath: z.string(),
        fileName: z.string(),
        fileSize: z.number().int().optional(),
        documentType: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createUnderwritingDocument(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  updateDocument: memberProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        processingStatus: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        extractionResults: z.unknown().optional(),
        waived: z.boolean().optional(),
        waiveReason: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateUnderwritingDocument(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  // ── Scores ──────────────────────────────────────────────────────────────
  getScore: protectedProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getUnderwritingScore(ctx.db, {
        applicationId: input.applicationId,
        teamId: ctx.teamId!,
      });
    }),

  // ── Document Requirements ───────────────────────────────────────────────
  getRequirements: protectedProcedure.query(async ({ ctx }) => {
    return getUnderwritingDocRequirements(ctx.db, {
      teamId: ctx.teamId!,
    });
  }),

  upsertRequirement: memberProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        required: z.boolean().optional(),
        appliesToStates: z.array(z.string()).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return upsertUnderwritingDocRequirement(ctx.db, {
        ...input,
        teamId: ctx.teamId!,
      });
    }),

  deleteRequirement: memberProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return deleteUnderwritingDocRequirement(ctx.db, {
        id: input.id,
        teamId: ctx.teamId!,
      });
    }),

  seedDefaults: memberProcedure.mutation(async ({ ctx }) => {
    return seedDefaultDocRequirements(ctx.db, {
      teamId: ctx.teamId!,
    });
  }),
});
```

**Step 2: Register the router in `_app.ts`**

Add to `apps/api/src/trpc/routers/_app.ts`:

Import: `import { underwritingApplicationsRouter } from "./underwriting-applications";`

In the `appRouter` object, add: `underwritingApplications: underwritingApplicationsRouter,`

**Step 3: Commit**

```bash
git add apps/api/src/trpc/routers/underwriting-applications.ts apps/api/src/trpc/routers/_app.ts
git commit -m "feat: add underwriting tRPC router with CRUD endpoints"
```

---

## Task 4: Underwriting Wizard — UI Shell

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/page.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/underwriting-wizard.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/wizard-context.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/wizard-schemas.ts`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/steps/step-profile.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/steps/step-documents.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/new/steps/step-review.tsx`

This task creates the 3-step underwriting wizard. Follow the exact patterns from the deal creation wizard at `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/deals/new/`.

**Step 1: Create wizard-schemas.ts**

Zod schemas for each step — follow pattern from deal wizard's `wizard-schemas.ts`.

**Step 2: Create wizard-context.tsx**

React Context with useReducer — follow pattern from deal wizard's `wizard-context.tsx`. Steps are: `"profile" | "documents" | "review"`.

**Step 3: Create step-profile.tsx**

Form fields: requested amount range (min/max), use of funds, FICO range, time in business, broker notes textarea, prior MCA history textarea. Pre-fill merchant name/industry/state from merchant data.

**Step 4: Create step-documents.tsx**

- Fetches document requirements via `trpc.underwritingApplications.getRequirements`
- Filters requirements by merchant state (checking `appliesToStates`)
- Shows checklist with file upload input per requirement
- Uploads PDFs to Supabase Storage bucket `"vault"` at path `{teamId}/underwriting/{applicationId}/{fileName}`
- Calls `trpc.underwritingApplications.uploadDocument` after each upload
- Shows processing status per document

**Step 5: Create step-review.tsx**

- Left side: merchant dossier (profile data + broker notes + prior history)
- Right side: AI scorecard (fetched via `trpc.underwritingApplications.getScore`)
- If no score yet, shows "Run Scoring" button that triggers AI analysis
- Decision buttons: Approve / Decline / Request More Info
- Calls `trpc.underwritingApplications.update` with decision

**Step 6: Create underwriting-wizard.tsx**

Main wrapper component with `WizardProvider` and step routing — follow pattern from `deal-wizard.tsx`.

**Step 7: Create page.tsx**

Server component that fetches merchant data and renders `UnderwritingWizard` — follow pattern from deal wizard's `page.tsx`.

**Step 8: Commit**

```bash
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/merchants/\[id\]/underwriting/
git commit -m "feat: add underwriting wizard UI with 3-step flow"
```

---

## Task 5: Merchant Detail Page — Underwriting Summary Card

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting-summary-card.tsx`
- Modify: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/merchant-detail-content.tsx`
- Modify: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/page.tsx`

**Step 1: Create underwriting-summary-card.tsx**

```typescript
// Component that shows:
// - When underwriting exists: status badge, decision date, AI recommendation,
//   confidence, monthly avg deposits, holdback %, FICO range, "View Full" link
// - When no underwriting: empty state with "Start Underwriting" CTA
// Uses: Card, CardHeader, CardContent from @midday/ui/card
// Uses: Badge from @midday/ui/badge
// Fetches: trpc.underwritingApplications.getByMerchant
// Fetches: trpc.underwritingApplications.getScore (if application exists)
```

**Step 2: Add the card to merchant-detail-content.tsx**

Import `UnderwritingSummaryCard` and place it after the existing stats cards row (Active Deals, Total Outstanding, Total Repaid, Collection Rate). It should be a new row below.

**Step 3: Add underwriting gate to "New Deal" button**

In `merchant-detail-content.tsx`, modify the "New Deal" button:
- Fetch team settings to check `underwritingEnabled`
- Fetch underwriting status for this merchant
- If underwriting enabled AND merchant not approved → link to `/merchants/{id}/underwriting/new` instead
- If underwriting disabled OR merchant approved → link to `/merchants/{id}/deals/new` (current behavior)

**Step 4: Add prefetch to page.tsx**

Add `trpc.underwritingApplications.getByMerchant.queryOptions({ merchantId: params.id })` to the `batchPrefetch` array.

**Step 5: Commit**

```bash
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/merchants/\[id\]/underwriting-summary-card.tsx
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/merchants/\[id\]/merchant-detail-content.tsx
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/merchants/\[id\]/page.tsx
git commit -m "feat: add underwriting summary card to merchant detail page"
```

---

## Task 6: Underwriting Detail Page — Full Dossier View

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/[appId]/page.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/[appId]/underwriting-detail.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/[appId]/bank-analysis-table.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/[appId]/buy-box-checklist.tsx`
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/merchants/[id]/underwriting/[appId]/risk-flags.tsx`

**Step 1: Create underwriting-detail.tsx**

Full dossier view with sections:
- Merchant profile header (name, industry, TIB, FICO, requested amount, use of funds)
- Broker narrative / backstory section
- Prior MCA history section
- Uploaded documents list with download links (via Supabase Storage signed URLs)
- Bank analysis table component (month-by-month deposits, pay burden, holdback %)
- Buy box checklist component (pass/fail per criterion)
- Risk flags component
- AI narrative summary
- Decision history (who approved/declined, when, notes)

**Step 2: Create bank-analysis-table.tsx**

Table component rendering the month-by-month bank analysis from `underwritingScores.bankAnalysis` JSONB:

```
Month     | Deposits    | Pay Burden | Holdback %
Oct 2025  | $191,567.74 | $4,432/mo  | 2.3%
Nov 2025  | $78,027.49  | $4,432/mo  | 5.7%
Dec 2025  | $83,434.15  | $4,432/mo  | 5.3%
```

**Step 3: Create buy-box-checklist.tsx**

Renders pass/fail badges per criterion from `underwritingScores.buyBoxResults` JSONB.

**Step 4: Create risk-flags.tsx**

Renders risk flags with severity icons from `underwritingScores.riskFlags` JSONB.

**Step 5: Create page.tsx**

Server component that fetches application, documents, and score data. Passes to `UnderwritingDetail`.

**Step 6: Commit**

```bash
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/merchants/\[id\]/underwriting/\[appId\]/
git commit -m "feat: add underwriting detail/dossier page with bank analysis and scorecard"
```

---

## Task 7: AI Scoring Engine — Buy Box Check + Claude Analysis

**Files:**
- Create: `packages/underwriting/src/scoring/buy-box-check.ts`
- Create: `packages/underwriting/src/scoring/bank-statement-analyzer.ts`
- Create: `packages/underwriting/src/scoring/score-application.ts`
- Create: `packages/underwriting/src/index.ts`
- Create: `packages/underwriting/package.json`
- Create: `packages/underwriting/tsconfig.json`
- Modify: `apps/api/src/trpc/routers/underwriting-applications.ts` (add score endpoint)

**Step 1: Create the underwriting package**

New package at `packages/underwriting/` following the structure of `packages/merchants/`.

`package.json`:
```json
{
  "name": "@midday/underwriting",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@anthropic-ai/sdk": "workspace:*"
  }
}
```

**Step 2: Write buy-box-check.ts**

Rule-based scoring against team's buy box criteria:

```typescript
type BuyBoxCriterion = {
  name: string;
  passed: boolean;
  actualValue: string;
  requiredValue: string;
};

type BuyBoxResult = {
  criteria: BuyBoxCriterion[];
  passCount: number;
  totalCount: number;
  allPassed: boolean;
};

export function checkBuyBox(
  buyBox: BuyBoxConfig,
  merchantData: MerchantMetrics,
): BuyBoxResult { ... }
```

Checks: min monthly revenue, min TIB, max existing positions, max NSF count, excluded industries, min credit score.

**Step 3: Write bank-statement-analyzer.ts**

Claude API call to analyze uploaded bank statement PDFs:

```typescript
export async function analyzeBankStatements(
  documents: { filePath: string; fileName: string }[],
  requestedAmount: { min: number; max: number },
): Promise<BankAnalysisResult> { ... }
```

Uses Claude to:
- Extract month-by-month deposit totals
- Identify NSFs and returned items
- Calculate avg daily balance
- Calculate proposed pay burden and holdback % per month
- Detect payments to known MCA funders (stacking detection)

Returns structured JSON matching the `bank_analysis` and `extracted_metrics` schema.

**Step 4: Write score-application.ts**

Orchestrator that combines buy box check + AI analysis:

```typescript
export async function scoreUnderwritingApplication(
  applicationId: string,
  teamId: string,
  db: Database,
): Promise<UnderwritingScoreResult> {
  // 1. Fetch application + documents + buy box criteria
  // 2. Run buy box check
  // 3. Run Claude bank statement analysis
  // 4. Combine into recommendation + confidence + narrative
  // 5. Save score to underwriting_scores table
  // 6. Update application status to "scoring" → then to result
  return score;
}
```

**Step 5: Add scoring endpoint to tRPC router**

Add to `underwriting-applications.ts`:

```typescript
runScoring: memberProcedure
  .input(z.object({ applicationId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    return scoreUnderwritingApplication(
      input.applicationId,
      ctx.teamId!,
      ctx.db,
    );
  }),
```

**Step 6: Commit**

```bash
git add packages/underwriting/ apps/api/src/trpc/routers/underwriting-applications.ts
git commit -m "feat: add AI scoring engine with buy box check and Claude bank analysis"
```

---

## Task 8: Team Settings — Underwriting Configuration

**Files:**
- Create: `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/underwriting/page.tsx`
- Create: `apps/dashboard/src/components/underwriting-settings.tsx`
- Create: `apps/dashboard/src/components/underwriting-requirements-editor.tsx`
- Create: `apps/dashboard/src/components/underwriting-buy-box-settings.tsx`

**Step 1: Create settings page**

Follow the pattern from existing settings pages (e.g., `settings/accounts/page.tsx`):
- Underwriting toggle (on/off) — updates `teams.underwritingEnabled`
- Document requirements editor (add/remove/reorder, state overrides)
- Buy box criteria editor (leverages existing `underwriting_buy_box` table)

**Step 2: Create underwriting-requirements-editor.tsx**

- List of requirements with drag-to-reorder
- Each row: name, description, required toggle, state tags
- Add button to create new requirement
- Delete button (with confirmation)
- "Reset to Defaults" button that calls `seedDefaults`

**Step 3: Create underwriting-buy-box-settings.tsx**

Form for buy box criteria: min monthly revenue, min TIB, max positions, max NSF, excluded industries (multi-select), min credit score. Calls `trpc.underwriting.upsert`.

**Step 4: Add settings page to navigation**

Add the underwriting settings link to the settings sidebar navigation.

**Step 5: Commit**

```bash
git add apps/dashboard/src/app/\[locale\]/\(app\)/\(sidebar\)/settings/underwriting/
git add apps/dashboard/src/components/underwriting-*.tsx
git commit -m "feat: add underwriting settings page with requirements and buy box config"
```

---

## Task Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Database migration + Drizzle schema | `supabase/migrations/`, `schema.ts` |
| 2 | Database query functions | `packages/db/src/queries/underwriting-*.ts` |
| 3 | tRPC router | `apps/api/src/trpc/routers/underwriting-applications.ts` |
| 4 | Underwriting wizard UI (3 steps) | `merchants/[id]/underwriting/new/` |
| 5 | Merchant detail summary card + gate | `merchant-detail-content.tsx` |
| 6 | Underwriting detail/dossier page | `merchants/[id]/underwriting/[appId]/` |
| 7 | AI scoring engine (buy box + Claude) | `packages/underwriting/` |
| 8 | Team settings page | `settings/underwriting/` |

**Dependency order:** Task 1 → Task 2 → Task 3 → Tasks 4, 5, 6 (parallel) → Task 7 → Task 8
