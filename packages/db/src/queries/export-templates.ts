import type { Database } from "@db/client";
import { exportTemplates } from "@db/schema";
import { and, desc, eq } from "drizzle-orm";

// ============================================================================
// Export Template Queries
// ============================================================================

export const getExportTemplates = async (
  db: Database,
  params: { teamId: string },
) => {
  return db
    .select()
    .from(exportTemplates)
    .where(eq(exportTemplates.teamId, params.teamId))
    .orderBy(desc(exportTemplates.createdAt));
};

export const getExportTemplateById = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .select()
    .from(exportTemplates)
    .where(
      and(
        eq(exportTemplates.id, params.id),
        eq(exportTemplates.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
};

// ============================================================================
// Export Template Mutations
// ============================================================================

export type CreateExportTemplateParams = {
  teamId: string;
  name: string;
  description?: string;
  format: string;
  columns: unknown;
  filters?: unknown;
  dateRange?: string;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleEmail?: string;
};

export const createExportTemplate = async (
  db: Database,
  params: CreateExportTemplateParams,
) => {
  const [result] = await db
    .insert(exportTemplates)
    .values({
      teamId: params.teamId,
      name: params.name,
      description: params.description,
      format: params.format,
      columns: params.columns,
      filters: params.filters ?? {},
      dateRange: params.dateRange,
      scheduleEnabled: params.scheduleEnabled ?? false,
      scheduleCron: params.scheduleCron,
      scheduleEmail: params.scheduleEmail,
    })
    .returning();

  return result;
};

export type UpdateExportTemplateParams = {
  id: string;
  teamId: string;
  name?: string;
  description?: string;
  format?: string;
  columns?: unknown;
  filters?: unknown;
  dateRange?: string;
  scheduleEnabled?: boolean;
  scheduleCron?: string;
  scheduleEmail?: string;
};

export const updateExportTemplate = async (
  db: Database,
  params: UpdateExportTemplateParams,
) => {
  const { id, teamId, ...updateData } = params;

  const [result] = await db
    .update(exportTemplates)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(exportTemplates.id, id), eq(exportTemplates.teamId, teamId)),
    )
    .returning();

  return result;
};

export const deleteExportTemplate = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const [result] = await db
    .delete(exportTemplates)
    .where(
      and(
        eq(exportTemplates.id, params.id),
        eq(exportTemplates.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

export const markExportTemplateExecuted = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  await db
    .update(exportTemplates)
    .set({
      lastExportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(exportTemplates.id, params.id),
        eq(exportTemplates.teamId, params.teamId),
      ),
    );
};
