import type { Database } from "@db/client";
import { underwritingDocumentRequirements } from "@db/schema";
import { and, asc, eq } from "drizzle-orm";

// ============================================================================
// Underwriting Document Requirement Queries
// ============================================================================

type GetUnderwritingDocRequirementsParams = {
  teamId: string;
};

export const getUnderwritingDocRequirements = async (
  db: Database,
  params: GetUnderwritingDocRequirementsParams,
) => {
  const data = await db
    .select()
    .from(underwritingDocumentRequirements)
    .where(eq(underwritingDocumentRequirements.teamId, params.teamId))
    .orderBy(asc(underwritingDocumentRequirements.sortOrder));

  return data;
};

// ============================================================================
// Underwriting Document Requirement Mutations
// ============================================================================

type UpsertUnderwritingDocRequirementParams = {
  id?: string;
  teamId: string;
  name: string;
  description?: string | null;
  required?: boolean;
  appliesToStates?: string[] | null;
  sortOrder?: number;
};

export const upsertUnderwritingDocRequirement = async (
  db: Database,
  params: UpsertUnderwritingDocRequirementParams,
) => {
  const { id, teamId, ...rest } = params;

  if (id) {
    // Update existing requirement
    const [result] = await db
      .update(underwritingDocumentRequirements)
      .set({
        name: rest.name,
        description: rest.description,
        required: rest.required,
        appliesToStates: rest.appliesToStates,
        sortOrder: rest.sortOrder,
      })
      .where(
        and(
          eq(underwritingDocumentRequirements.id, id),
          eq(underwritingDocumentRequirements.teamId, teamId),
        ),
      )
      .returning();

    return result;
  }

  // Insert new requirement
  const [result] = await db
    .insert(underwritingDocumentRequirements)
    .values({
      teamId,
      name: rest.name,
      description: rest.description,
      required: rest.required,
      appliesToStates: rest.appliesToStates,
      sortOrder: rest.sortOrder,
    })
    .returning();

  return result;
};

type DeleteUnderwritingDocRequirementParams = {
  id: string;
  teamId: string;
};

export const deleteUnderwritingDocRequirement = async (
  db: Database,
  params: DeleteUnderwritingDocRequirementParams,
) => {
  const [result] = await db
    .delete(underwritingDocumentRequirements)
    .where(
      and(
        eq(underwritingDocumentRequirements.id, params.id),
        eq(underwritingDocumentRequirements.teamId, params.teamId),
      ),
    )
    .returning();

  return result;
};

// ============================================================================
// Seed Default Document Requirements
// ============================================================================

type SeedDefaultDocRequirementsParams = {
  teamId: string;
};

export const seedDefaultDocRequirements = async (
  db: Database,
  params: SeedDefaultDocRequirementsParams,
) => {
  // Check if any requirements already exist for this team
  const existing = await db
    .select({ id: underwritingDocumentRequirements.id })
    .from(underwritingDocumentRequirements)
    .where(eq(underwritingDocumentRequirements.teamId, params.teamId))
    .limit(1);

  if (existing.length > 0) {
    // Delete existing before re-seeding to avoid duplicates
    await db
      .delete(underwritingDocumentRequirements)
      .where(eq(underwritingDocumentRequirements.teamId, params.teamId));
  }

  const defaults = [
    {
      teamId: params.teamId,
      name: "Application Form",
      required: true,
      sortOrder: 0,
    },
    {
      teamId: params.teamId,
      name: "Bank Statements (3 months)",
      required: true,
      sortOrder: 1,
    },
    {
      teamId: params.teamId,
      name: "Tax Returns",
      required: true,
      sortOrder: 2,
    },
  ];

  const results = await db
    .insert(underwritingDocumentRequirements)
    .values(defaults)
    .returning();

  return results;
};
