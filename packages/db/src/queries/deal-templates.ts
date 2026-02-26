import type { Database } from "@db/client";
import { dealTemplates } from "@db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

type DealTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  dealNoLabel?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  quantityLabel?: string;
  totalLabel?: string;
  totalSummaryLabel?: string;
  subtotalLabel?: string;
  discountLabel?: string;
  sendCopy?: boolean;
  paymentLabel?: string;
  noteLabel?: string;
  logoUrl?: string | null;
  currency?: string;
  paymentDetails?: string | null; // Stringified JSON
  fromDetails?: string | null; // Stringified JSON
  noteDetails?: string | null; // Stringified JSON
  dateFormat?: string;
  includeDiscount?: boolean;
  includeDecimals?: boolean;
  includeUnits?: boolean;
  includeQr?: boolean;
  size?: "a4" | "letter";
  deliveryType?: "create" | "create_and_send" | "scheduled";
  includePdf?: boolean;
  paymentEnabled?: boolean;
  paymentTermsDays?: number;
};

type CreateDealTemplateParams = {
  teamId: string;
  name: string;
  isDefault?: boolean;
} & DealTemplateParams;

type UpsertDealTemplateParams = {
  id?: string; // Optional - if not provided, will upsert the default template
  teamId: string;
  name?: string;
} & DealTemplateParams;

// Select fields for template queries
const templateSelectFields = {
  id: dealTemplates.id,
  name: dealTemplates.name,
  isDefault: dealTemplates.isDefault,
  customerLabel: dealTemplates.customerLabel,
  fromLabel: dealTemplates.fromLabel,
  dealNoLabel: dealTemplates.dealNoLabel,
  issueDateLabel: dealTemplates.issueDateLabel,
  dueDateLabel: dealTemplates.dueDateLabel,
  descriptionLabel: dealTemplates.descriptionLabel,
  priceLabel: dealTemplates.priceLabel,
  quantityLabel: dealTemplates.quantityLabel,
  totalLabel: dealTemplates.totalLabel,
  paymentLabel: dealTemplates.paymentLabel,
  noteLabel: dealTemplates.noteLabel,
  logoUrl: dealTemplates.logoUrl,
  currency: dealTemplates.currency,
  subtotalLabel: dealTemplates.subtotalLabel,
  paymentDetails: dealTemplates.paymentDetails,
  fromDetails: dealTemplates.fromDetails,
  noteDetails: dealTemplates.noteDetails,
  size: dealTemplates.size,
  dateFormat: dealTemplates.dateFormat,
  deliveryType: dealTemplates.deliveryType,
  discountLabel: dealTemplates.discountLabel,
  includeDiscount: dealTemplates.includeDiscount,
  includeDecimals: dealTemplates.includeDecimals,
  includeQr: dealTemplates.includeQr,
  totalSummaryLabel: dealTemplates.totalSummaryLabel,
  title: dealTemplates.title,
  includeUnits: dealTemplates.includeUnits,
  includePdf: dealTemplates.includePdf,
  sendCopy: dealTemplates.sendCopy,
  paymentEnabled: dealTemplates.paymentEnabled,
  paymentTermsDays: dealTemplates.paymentTermsDays,
};

/**
 * Get all deal templates for a team
 */
export async function getDealTemplates(db: Database, teamId: string) {
  return db
    .select(templateSelectFields)
    .from(dealTemplates)
    .where(eq(dealTemplates.teamId, teamId))
    .orderBy(desc(dealTemplates.isDefault), dealTemplates.name);
}

/**
 * Get a single deal template by ID
 */
export async function getDealTemplateById(
  db: Database,
  params: { id: string; teamId: string },
) {
  const [result] = await db
    .select(templateSelectFields)
    .from(dealTemplates)
    .where(
      and(
        eq(dealTemplates.id, params.id),
        eq(dealTemplates.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
}

/**
 * Get the default deal template for a team, or the first template if no default exists
 */
export async function getDealTemplate(db: Database, teamId: string) {
  // First try to get the default template
  const [defaultTemplate] = await db
    .select(templateSelectFields)
    .from(dealTemplates)
    .where(
      and(
        eq(dealTemplates.teamId, teamId),
        eq(dealTemplates.isDefault, true),
      ),
    )
    .limit(1);

  if (defaultTemplate) {
    return defaultTemplate;
  }

  // Fall back to first template
  const [firstTemplate] = await db
    .select(templateSelectFields)
    .from(dealTemplates)
    .where(eq(dealTemplates.teamId, teamId))
    .orderBy(dealTemplates.createdAt)
    .limit(1);

  return firstTemplate;
}

/**
 * Create a new deal template
 * Uses a transaction to prevent race conditions where concurrent requests
 * could both determine they are creating the "first" template and both
 * set isDefault: true.
 */
export async function createDealTemplate(
  db: Database,
  params: CreateDealTemplateParams,
) {
  const { teamId, name, isDefault, ...rest } = params;

  return db.transaction(async (tx) => {
    // Check if this is the first template for the team
    const existingTemplates = await tx
      .select({ id: dealTemplates.id })
      .from(dealTemplates)
      .where(eq(dealTemplates.teamId, teamId))
      .limit(1);

    const isFirstTemplate = existingTemplates.length === 0;

    // If this is the first template or marked as default, ensure it's the only default
    if (isDefault || isFirstTemplate) {
      await tx
        .update(dealTemplates)
        .set({ isDefault: false })
        .where(eq(dealTemplates.teamId, teamId));
    }

    // First template should always be the default, regardless of isDefault param
    const shouldBeDefault = isFirstTemplate || (isDefault ?? false);

    const [result] = await tx
      .insert(dealTemplates)
      .values({
        teamId,
        name,
        isDefault: shouldBeDefault,
        ...rest,
      })
      .returning();

    return result;
  });
}

/**
 * Upsert an deal template
 * - If id is provided, updates that specific template
 * - If id is not provided, updates the default template or creates one if none exists
 * Uses a transaction for the create path to prevent race conditions where concurrent
 * requests could both create default templates.
 */
export async function upsertDealTemplate(
  db: Database,
  params: UpsertDealTemplateParams,
) {
  const { id, teamId, ...rest } = params;

  // If ID is provided, update that specific template (no race condition here)
  if (id) {
    const [result] = await db
      .update(dealTemplates)
      .set(rest)
      .where(
        and(eq(dealTemplates.id, id), eq(dealTemplates.teamId, teamId)),
      )
      .returning(templateSelectFields);

    return result;
  }

  // No ID provided - use transaction to safely get or create the default template
  return db.transaction(async (tx) => {
    // First try to get the default template
    const [defaultTemplate] = await tx
      .select(templateSelectFields)
      .from(dealTemplates)
      .where(
        and(
          eq(dealTemplates.teamId, teamId),
          eq(dealTemplates.isDefault, true),
        ),
      )
      .limit(1);

    if (defaultTemplate) {
      // Update existing default template
      const [result] = await tx
        .update(dealTemplates)
        .set(rest)
        .where(
          and(
            eq(dealTemplates.id, defaultTemplate.id),
            eq(dealTemplates.teamId, teamId),
          ),
        )
        .returning(templateSelectFields);

      return result;
    }

    // Fall back to first template if no default
    const [firstTemplate] = await tx
      .select(templateSelectFields)
      .from(dealTemplates)
      .where(eq(dealTemplates.teamId, teamId))
      .orderBy(dealTemplates.createdAt)
      .limit(1);

    if (firstTemplate) {
      // Update existing first template
      const [result] = await tx
        .update(dealTemplates)
        .set(rest)
        .where(
          and(
            eq(dealTemplates.id, firstTemplate.id),
            eq(dealTemplates.teamId, teamId),
          ),
        )
        .returning(templateSelectFields);

      return result;
    }

    // No template exists - create a new default template with the provided values
    const [result] = await tx
      .insert(dealTemplates)
      .values({
        teamId,
        name: "Default",
        isDefault: true,
        ...rest,
      })
      .returning(templateSelectFields);

    return result;
  });
}

/**
 * Set a template as the default for a team
 * Uses a transaction to ensure atomicity - verifies the template exists,
 * unsets other defaults, and sets the new default as a single atomic operation.
 */
export async function setDefaultTemplate(
  db: Database,
  params: { id: string; teamId: string },
) {
  return db.transaction(async (tx) => {
    // First, verify the target template exists and belongs to this team
    const [targetTemplate] = await tx
      .select({ id: dealTemplates.id })
      .from(dealTemplates)
      .where(
        and(
          eq(dealTemplates.id, params.id),
          eq(dealTemplates.teamId, params.teamId),
        ),
      )
      .limit(1);

    if (!targetTemplate) {
      // Template doesn't exist or doesn't belong to this team
      // Throw an error to ensure the mutation fails and onSuccess is not called
      throw new Error("Template not found");
    }

    // Now safe to unset all other defaults for this team
    await tx
      .update(dealTemplates)
      .set({ isDefault: false })
      .where(eq(dealTemplates.teamId, params.teamId));

    // Set the specified template as default
    const [result] = await tx
      .update(dealTemplates)
      .set({ isDefault: true })
      .where(
        and(
          eq(dealTemplates.id, params.id),
          eq(dealTemplates.teamId, params.teamId),
        ),
      )
      .returning(templateSelectFields);

    return result;
  });
}

/**
 * Delete an deal template
 * Returns the deleted template and the new default template to switch to.
 * Uses a transaction to ensure atomicity - verifies at least one other template
 * exists, deletes the template, and sets a new default as a single atomic operation.
 */
export async function deleteDealTemplate(
  db: Database,
  params: { id: string; teamId: string },
) {
  return db.transaction(async (tx) => {
    // Get the template to delete and check if it's the default
    const [templateToDelete] = await tx
      .select({
        id: dealTemplates.id,
        isDefault: dealTemplates.isDefault,
      })
      .from(dealTemplates)
      .where(
        and(
          eq(dealTemplates.id, params.id),
          eq(dealTemplates.teamId, params.teamId),
        ),
      )
      .limit(1);

    if (!templateToDelete) {
      throw new Error("Template not found");
    }

    // Count templates EXCLUDING the one we're about to delete
    // This is more defensive than counting first then deleting
    const otherTemplates = await tx
      .select({ id: dealTemplates.id })
      .from(dealTemplates)
      .where(
        and(
          eq(dealTemplates.teamId, params.teamId),
          // Exclude the template we're deleting
          sql`${dealTemplates.id} != ${params.id}`,
        ),
      )
      .limit(1);

    if (otherTemplates.length === 0) {
      throw new Error("Cannot delete the last template");
    }

    const wasDefault = templateToDelete.isDefault;

    // Delete the template
    const [deleted] = await tx
      .delete(dealTemplates)
      .where(
        and(
          eq(dealTemplates.id, params.id),
          eq(dealTemplates.teamId, params.teamId),
        ),
      )
      .returning();

    // If we deleted the default, set another template as default
    let newDefault = null;
    if (wasDefault) {
      const [firstRemaining] = await tx
        .select(templateSelectFields)
        .from(dealTemplates)
        .where(eq(dealTemplates.teamId, params.teamId))
        .orderBy(dealTemplates.createdAt)
        .limit(1);

      if (firstRemaining) {
        await tx
          .update(dealTemplates)
          .set({ isDefault: true })
          .where(eq(dealTemplates.id, firstRemaining.id));

        newDefault = { ...firstRemaining, isDefault: true };
      }
    } else {
      // Get the current default to switch to
      // Note: We use tx here since we're still in the transaction context
      const [defaultTemplate] = await tx
        .select(templateSelectFields)
        .from(dealTemplates)
        .where(
          and(
            eq(dealTemplates.teamId, params.teamId),
            eq(dealTemplates.isDefault, true),
          ),
        )
        .limit(1);

      newDefault = defaultTemplate ?? null;
    }

    return { deleted, newDefault };
  });
}

/**
 * Get template count for a team
 */
export async function getDealTemplateCount(db: Database, teamId: string) {
  const result = await db
    .select({ id: dealTemplates.id })
    .from(dealTemplates)
    .where(eq(dealTemplates.teamId, teamId));

  return result.length;
}
