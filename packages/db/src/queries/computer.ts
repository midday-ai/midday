import { and, desc, eq, isNotNull, lt, sql } from "drizzle-orm";
import type { Database } from "../client";
import {
  computerAgentMemory,
  computerAgents,
  computerRunSteps,
  computerRuns,
  users,
} from "../schema";

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

type GetComputerAgentsParams = {
  teamId: string;
};

export const getComputerAgents = async (
  db: Database,
  params: GetComputerAgentsParams,
) => {
  return db
    .select({
      id: computerAgents.id,
      name: computerAgents.name,
      slug: computerAgents.slug,
      description: computerAgents.description,
      source: computerAgents.source,
      templateId: computerAgents.templateId,
      scheduleCron: computerAgents.scheduleCron,
      enabled: computerAgents.enabled,
      createdAt: computerAgents.createdAt,
    })
    .from(computerAgents)
    .where(eq(computerAgents.teamId, params.teamId))
    .orderBy(desc(computerAgents.createdAt));
};

type GetComputerAgentByIdParams = {
  id: string;
};

export const getComputerAgentById = async (
  db: Database,
  params: GetComputerAgentByIdParams,
) => {
  const [result] = await db
    .select()
    .from(computerAgents)
    .where(eq(computerAgents.id, params.id))
    .limit(1);

  return result;
};

type GetComputerAgentBySlugParams = {
  teamId: string;
  slug: string;
};

export const getComputerAgentBySlug = async (
  db: Database,
  params: GetComputerAgentBySlugParams,
) => {
  const [result] = await db
    .select({ id: computerAgents.id })
    .from(computerAgents)
    .where(
      and(
        eq(computerAgents.teamId, params.teamId),
        eq(computerAgents.slug, params.slug),
      ),
    )
    .limit(1);

  return result;
};

type GetComputerAgentForRunParams = {
  id: string;
  teamId: string;
};

export const getComputerAgentForRun = async (
  db: Database,
  params: GetComputerAgentForRunParams,
) => {
  const [result] = await db
    .select({ id: computerAgents.id, enabled: computerAgents.enabled })
    .from(computerAgents)
    .where(
      and(
        eq(computerAgents.id, params.id),
        eq(computerAgents.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};

export const getEnabledScheduledAgents = async (db: Database) => {
  return db
    .select({
      id: computerAgents.id,
      teamId: computerAgents.teamId,
      slug: computerAgents.slug,
      scheduleCron: computerAgents.scheduleCron,
      timezone: users.timezone,
    })
    .from(computerAgents)
    .leftJoin(users, eq(computerAgents.createdBy, users.id))
    .where(
      and(
        eq(computerAgents.enabled, true),
        isNotNull(computerAgents.scheduleCron),
      ),
    );
};

type CreateComputerAgentParams = {
  teamId: string;
  name: string;
  slug: string;
  description?: string | null;
  source: "catalog" | "generated";
  code: string;
  templateId?: string | null;
  scheduleCron?: string | null;
  enabled?: boolean;
  createdBy?: string | null;
};

export const createComputerAgent = async (
  db: Database,
  params: CreateComputerAgentParams,
) => {
  const [result] = await db
    .insert(computerAgents)
    .values({
      teamId: params.teamId,
      name: params.name,
      slug: params.slug,
      description: params.description ?? null,
      source: params.source,
      code: params.code,
      templateId: params.templateId ?? null,
      scheduleCron: params.scheduleCron ?? null,
      enabled: params.enabled ?? false,
      createdBy: params.createdBy ?? null,
    })
    .returning();

  return result;
};

type UpdateComputerAgentParams = {
  id: string;
  teamId: string;
  enabled?: boolean;
  scheduleCron?: string;
  config?: Record<string, unknown>;
};

export const updateComputerAgent = async (
  db: Database,
  params: UpdateComputerAgentParams,
) => {
  const { id, teamId, ...fields } = params;

  const [result] = await db
    .update(computerAgents)
    .set({
      ...(fields.enabled !== undefined ? { enabled: fields.enabled } : {}),
      ...(fields.scheduleCron !== undefined
        ? { scheduleCron: fields.scheduleCron }
        : {}),
      ...(fields.config !== undefined ? { config: fields.config } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(computerAgents.id, id), eq(computerAgents.teamId, teamId)))
    .returning();

  return result;
};

type DeleteComputerAgentParams = {
  id: string;
  teamId: string;
};

export const deleteComputerAgent = async (
  db: Database,
  params: DeleteComputerAgentParams,
) => {
  const [result] = await db
    .delete(computerAgents)
    .where(
      and(
        eq(computerAgents.id, params.id),
        eq(computerAgents.teamId, params.teamId),
      ),
    )
    .returning({ id: computerAgents.id });

  return result;
};

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

type CreateComputerRunParams = {
  id?: string;
  agentId: string;
  teamId: string;
  status?: "pending" | "running" | "completed" | "failed" | "waiting_approval";
};

export const createComputerRun = async (
  db: Database,
  params: CreateComputerRunParams,
) => {
  const [result] = await db
    .insert(computerRuns)
    .values({
      ...(params.id ? { id: params.id } : {}),
      agentId: params.agentId,
      teamId: params.teamId,
      status: params.status ?? "pending",
    })
    .returning();

  return result;
};

type GetActiveRunForAgentParams = {
  agentId: string;
};

export const getActiveRunForAgent = async (
  db: Database,
  params: GetActiveRunForAgentParams,
) => {
  const [result] = await db
    .select({ id: computerRuns.id })
    .from(computerRuns)
    .where(
      and(
        eq(computerRuns.agentId, params.agentId),
        eq(computerRuns.status, "running"),
      ),
    )
    .limit(1);

  return result;
};

type ClaimComputerRunParams = {
  runId: string;
  agentId: string;
};

export const claimComputerRun = async (
  db: Database,
  params: ClaimComputerRunParams,
): Promise<{ id: string } | null> => {
  const result = await db.execute(sql`
    UPDATE computer_runs
    SET status = 'running', started_at = NOW()
    WHERE id = ${params.runId}
      AND status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM computer_runs
        WHERE agent_id = ${params.agentId} AND status = 'running'
      )
    RETURNING id
  `);

  const row = result.rows?.[0] as { id: string } | undefined;
  return row ?? null;
};

export const failStaleRunningRuns = async (
  db: Database,
  params: { staleMinutes: number },
): Promise<number> => {
  const result = await db
    .update(computerRuns)
    .set({
      status: "failed",
      error: "stale_timeout",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(computerRuns.status, "running"),
        lt(
          computerRuns.startedAt,
          sql`NOW() - INTERVAL '${sql.raw(String(params.staleMinutes))} minutes'`,
        ),
      ),
    )
    .returning({ id: computerRuns.id });

  return result.length;
};

type UpdateComputerRunParams = {
  id: string;
  status?: "pending" | "running" | "completed" | "failed" | "waiting_approval";
  proposedActions?: Array<{ tool: string; args: Record<string, unknown>; description?: string }> | null;
  summary?: string | null;
  error?: string | null;
  toolCallCount?: number;
  llmCallCount?: number;
  startedAt?: Date;
  completedAt?: Date;
};

export const updateComputerRun = async (
  db: Database,
  params: UpdateComputerRunParams,
) => {
  const { id, proposedActions, ...rest } = params;

  const [result] = await db
    .update(computerRuns)
    .set({
      ...rest,
      ...(proposedActions !== undefined
        ? { proposedActions }
        : {}),
    })
    .where(eq(computerRuns.id, id))
    .returning();

  return result;
};

type InsertComputerRunStepsParams = {
  runId: string;
  steps: Array<{
    type:
      | "tool_call"
      | "ai_generation"
      | "memory_read"
      | "memory_write"
      | "notification"
      | "proposal"
      | "connector_call"
      | "context";
    name: string;
    input: unknown;
    output: unknown;
    durationMs: number;
  }>;
};

export const insertComputerRunSteps = async (
  db: Database,
  params: InsertComputerRunStepsParams,
) => {
  if (params.steps.length === 0) return;

  await db.insert(computerRunSteps).values(
    params.steps.map((step) => ({
      runId: params.runId,
      type: step.type,
      name: step.name,
      input: step.input as Record<string, unknown> | null,
      output: step.output as Record<string, unknown> | null,
      durationMs: step.durationMs,
    })),
  );
};

type GetComputerRunsParams = {
  agentId: string;
  teamId: string;
  limit?: number;
};

export const getComputerRuns = async (
  db: Database,
  params: GetComputerRunsParams,
) => {
  return db
    .select({
      id: computerRuns.id,
      status: computerRuns.status,
      summary: computerRuns.summary,
      error: computerRuns.error,
      toolCallCount: computerRuns.toolCallCount,
      llmCallCount: computerRuns.llmCallCount,
      startedAt: computerRuns.startedAt,
      completedAt: computerRuns.completedAt,
      createdAt: computerRuns.createdAt,
    })
    .from(computerRuns)
    .where(
      and(
        eq(computerRuns.agentId, params.agentId),
        eq(computerRuns.teamId, params.teamId),
      ),
    )
    .orderBy(desc(computerRuns.createdAt))
    .limit(params.limit ?? 20);
};

type GetComputerRunWithStepsParams = {
  runId: string;
  agentId: string;
  teamId: string;
};

export const getComputerRunWithSteps = async (
  db: Database,
  params: GetComputerRunWithStepsParams,
) => {
  const [run] = await db
    .select()
    .from(computerRuns)
    .where(
      and(
        eq(computerRuns.id, params.runId),
        eq(computerRuns.agentId, params.agentId),
        eq(computerRuns.teamId, params.teamId),
      ),
    )
    .limit(1);

  if (!run) return null;

  const steps = await db
    .select()
    .from(computerRunSteps)
    .where(eq(computerRunSteps.runId, params.runId))
    .orderBy(computerRunSteps.createdAt);

  return { ...run, steps };
};

// ---------------------------------------------------------------------------
// Proposals (Approval Mode)
// ---------------------------------------------------------------------------

type GetComputerRunProposalsParams = {
  runId: string;
  agentId: string;
  teamId: string;
};

export const getComputerRunProposals = async (
  db: Database,
  params: GetComputerRunProposalsParams,
) => {
  const [run] = await db
    .select({
      id: computerRuns.id,
      status: computerRuns.status,
      proposedActions: computerRuns.proposedActions,
      agentId: computerRuns.agentId,
    })
    .from(computerRuns)
    .where(
      and(
        eq(computerRuns.id, params.runId),
        eq(computerRuns.agentId, params.agentId),
        eq(computerRuns.teamId, params.teamId),
        eq(computerRuns.status, "waiting_approval"),
      ),
    )
    .limit(1);

  return run ?? null;
};

type ApproveComputerRunParams = {
  runId: string;
  approvedIndices?: number[];
};

export const approveComputerRun = async (
  db: Database,
  params: ApproveComputerRunParams,
) => {
  const [run] = await db
    .select({
      id: computerRuns.id,
      proposedActions: computerRuns.proposedActions,
    })
    .from(computerRuns)
    .where(
      and(
        eq(computerRuns.id, params.runId),
        eq(computerRuns.status, "waiting_approval"),
      ),
    )
    .limit(1);

  if (!run?.proposedActions) return null;

  const allActions = run.proposedActions as Array<{
    tool: string;
    args: Record<string, unknown>;
    description?: string;
  }>;

  const approvedActions = params.approvedIndices
    ? params.approvedIndices
        .filter((i) => i >= 0 && i < allActions.length)
        .map((i) => allActions[i]!)
    : allActions;

  const [updated] = await db
    .update(computerRuns)
    .set({ proposedActions: approvedActions, status: "pending" })
    .where(eq(computerRuns.id, params.runId))
    .returning();

  return updated;
};

type RejectComputerRunParams = {
  runId: string;
};

export const rejectComputerRun = async (
  db: Database,
  params: RejectComputerRunParams,
) => {
  const [result] = await db
    .update(computerRuns)
    .set({
      status: "failed",
      error: "rejected_by_user",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(computerRuns.id, params.runId),
        eq(computerRuns.status, "waiting_approval"),
      ),
    )
    .returning();

  return result;
};

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

type GetAgentMemoryParams = {
  agentId: string;
  teamId: string;
  key?: string;
  type?: string;
};

export const getAgentMemory = async (
  db: Database,
  params: GetAgentMemoryParams,
) => {
  return db
    .select()
    .from(computerAgentMemory)
    .where(
      and(
        eq(computerAgentMemory.agentId, params.agentId),
        eq(computerAgentMemory.teamId, params.teamId),
        ...(params.key ? [eq(computerAgentMemory.key, params.key)] : []),
        ...(params.type ? [eq(computerAgentMemory.type, params.type)] : []),
      ),
    );
};

type UpsertAgentMemoryParams = {
  agentId: string;
  teamId: string;
  key: string;
  content: string;
  type?: string | null;
  metadata?: Record<string, unknown> | null;
};

export const upsertAgentMemory = async (
  db: Database,
  params: UpsertAgentMemoryParams,
) => {
  const existing = await db
    .select({ id: computerAgentMemory.id })
    .from(computerAgentMemory)
    .where(
      and(
        eq(computerAgentMemory.agentId, params.agentId),
        eq(computerAgentMemory.key, params.key),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(computerAgentMemory)
      .set({
        content: params.content,
        type: params.type ?? null,
        metadata: params.metadata ?? null,
        updatedAt: new Date(),
      })
      .where(eq(computerAgentMemory.id, existing[0]!.id));
  } else {
    await db.insert(computerAgentMemory).values({
      agentId: params.agentId,
      teamId: params.teamId,
      key: params.key,
      content: params.content,
      type: params.type ?? null,
      metadata: params.metadata ?? null,
    });
  }
};

type GetComputerAgentMemoryEntriesParams = {
  agentId: string;
  teamId: string;
};

export const getComputerAgentMemoryEntries = async (
  db: Database,
  params: GetComputerAgentMemoryEntriesParams,
) => {
  return db
    .select({
      id: computerAgentMemory.id,
      key: computerAgentMemory.key,
      content: computerAgentMemory.content,
      type: computerAgentMemory.type,
      metadata: computerAgentMemory.metadata,
      updatedAt: computerAgentMemory.updatedAt,
    })
    .from(computerAgentMemory)
    .where(
      and(
        eq(computerAgentMemory.agentId, params.agentId),
        eq(computerAgentMemory.teamId, params.teamId),
      ),
    )
    .orderBy(desc(computerAgentMemory.updatedAt));
};

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

type GetUserTimezoneParams = {
  userId: string;
};

export const getUserTimezone = async (
  db: Database,
  params: GetUserTimezoneParams,
) => {
  const [result] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  return result?.timezone ?? null;
};

// ---------------------------------------------------------------------------
// Scheduler lock (advisory lock to prevent duplicate schedulers)
// ---------------------------------------------------------------------------

const SCHEDULER_LOCK_ID = 8675309;

export const acquireSchedulerLock = async (db: Database): Promise<boolean> => {
  const result = await db.execute(
    sql`SELECT pg_try_advisory_lock(${SCHEDULER_LOCK_ID}) as acquired`,
  );
  const row = result.rows?.[0] as { acquired: boolean } | undefined;
  return row?.acquired === true;
};

export const releaseSchedulerLock = async (db: Database): Promise<void> => {
  await db.execute(sql`SELECT pg_advisory_unlock(${SCHEDULER_LOCK_ID})`);
};
