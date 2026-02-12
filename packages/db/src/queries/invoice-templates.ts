import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { invoiceTemplates } from "../schema";

type InvoiceTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  invoiceNoLabel?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  quantityLabel?: string;
  totalLabel?: string;
  totalSummaryLabel?: string;
  vatLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
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
  includeVat?: boolean;
  includeTax?: boolean;
  includeDiscount?: boolean;
  includeDecimals?: boolean;
  includeUnits?: boolean;
  includeQr?: boolean;
  includeLineItemTax?: boolean;
  lineItemTaxLabel?: string;
  taxRate?: number | null;
  vatRate?: number | null;
  size?: "a4" | "letter";
  deliveryType?: "create" | "create_and_send" | "scheduled";
  includePdf?: boolean;
  paymentEnabled?: boolean;
  paymentTermsDays?: number;
};

type CreateInvoiceTemplateParams = {
  teamId: string;
  name: string;
  isDefault?: boolean;
} & InvoiceTemplateParams;

type UpsertInvoiceTemplateParams = {
  id?: string; // Optional - if not provided, will upsert the default template
  teamId: string;
  name?: string;
} & InvoiceTemplateParams;

// Select fields for template queries
const templateSelectFields = {
  id: invoiceTemplates.id,
  name: invoiceTemplates.name,
  isDefault: invoiceTemplates.isDefault,
  customerLabel: invoiceTemplates.customerLabel,
  fromLabel: invoiceTemplates.fromLabel,
  invoiceNoLabel: invoiceTemplates.invoiceNoLabel,
  issueDateLabel: invoiceTemplates.issueDateLabel,
  dueDateLabel: invoiceTemplates.dueDateLabel,
  descriptionLabel: invoiceTemplates.descriptionLabel,
  priceLabel: invoiceTemplates.priceLabel,
  quantityLabel: invoiceTemplates.quantityLabel,
  totalLabel: invoiceTemplates.totalLabel,
  vatLabel: invoiceTemplates.vatLabel,
  taxLabel: invoiceTemplates.taxLabel,
  paymentLabel: invoiceTemplates.paymentLabel,
  noteLabel: invoiceTemplates.noteLabel,
  logoUrl: invoiceTemplates.logoUrl,
  currency: invoiceTemplates.currency,
  subtotalLabel: invoiceTemplates.subtotalLabel,
  paymentDetails: invoiceTemplates.paymentDetails,
  fromDetails: invoiceTemplates.fromDetails,
  noteDetails: invoiceTemplates.noteDetails,
  size: invoiceTemplates.size,
  dateFormat: invoiceTemplates.dateFormat,
  includeVat: invoiceTemplates.includeVat,
  includeTax: invoiceTemplates.includeTax,
  taxRate: invoiceTemplates.taxRate,
  deliveryType: invoiceTemplates.deliveryType,
  discountLabel: invoiceTemplates.discountLabel,
  includeDiscount: invoiceTemplates.includeDiscount,
  includeDecimals: invoiceTemplates.includeDecimals,
  includeQr: invoiceTemplates.includeQr,
  includeLineItemTax: invoiceTemplates.includeLineItemTax,
  lineItemTaxLabel: invoiceTemplates.lineItemTaxLabel,
  totalSummaryLabel: invoiceTemplates.totalSummaryLabel,
  title: invoiceTemplates.title,
  vatRate: invoiceTemplates.vatRate,
  includeUnits: invoiceTemplates.includeUnits,
  includePdf: invoiceTemplates.includePdf,
  sendCopy: invoiceTemplates.sendCopy,
  paymentEnabled: invoiceTemplates.paymentEnabled,
  paymentTermsDays: invoiceTemplates.paymentTermsDays,
  emailSubject: invoiceTemplates.emailSubject,
  emailHeading: invoiceTemplates.emailHeading,
  emailBody: invoiceTemplates.emailBody,
  emailButtonText: invoiceTemplates.emailButtonText,
};

/**
 * Get all invoice templates for a team
 */
export async function getInvoiceTemplates(db: Database, teamId: string) {
  return db
    .select(templateSelectFields)
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.teamId, teamId))
    .orderBy(desc(invoiceTemplates.isDefault), invoiceTemplates.name);
}

/**
 * Get a single invoice template by ID
 */
export async function getInvoiceTemplateById(
  db: Database,
  params: { id: string; teamId: string },
) {
  const [result] = await db
    .select(templateSelectFields)
    .from(invoiceTemplates)
    .where(
      and(
        eq(invoiceTemplates.id, params.id),
        eq(invoiceTemplates.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result;
}

/**
 * Get the default invoice template for a team, or the first template if no default exists
 */
export async function getInvoiceTemplate(db: Database, teamId: string) {
  // First try to get the default template
  const [defaultTemplate] = await db
    .select(templateSelectFields)
    .from(invoiceTemplates)
    .where(
      and(
        eq(invoiceTemplates.teamId, teamId),
        eq(invoiceTemplates.isDefault, true),
      ),
    )
    .limit(1);

  if (defaultTemplate) {
    return defaultTemplate;
  }

  // Fall back to first template
  const [firstTemplate] = await db
    .select(templateSelectFields)
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.teamId, teamId))
    .orderBy(invoiceTemplates.createdAt)
    .limit(1);

  return firstTemplate;
}

/**
 * Create a new invoice template
 * Uses a transaction to prevent race conditions where concurrent requests
 * could both determine they are creating the "first" template and both
 * set isDefault: true.
 */
export async function createInvoiceTemplate(
  db: Database,
  params: CreateInvoiceTemplateParams,
) {
  const { teamId, name, isDefault, ...rest } = params;

  return db.transaction(async (tx) => {
    // Check if this is the first template for the team
    const existingTemplates = await tx
      .select({ id: invoiceTemplates.id })
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.teamId, teamId))
      .limit(1);

    const isFirstTemplate = existingTemplates.length === 0;

    // If this is the first template or marked as default, ensure it's the only default
    if (isDefault || isFirstTemplate) {
      await tx
        .update(invoiceTemplates)
        .set({ isDefault: false })
        .where(eq(invoiceTemplates.teamId, teamId));
    }

    // First template should always be the default, regardless of isDefault param
    const shouldBeDefault = isFirstTemplate || (isDefault ?? false);

    const [result] = await tx
      .insert(invoiceTemplates)
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
 * Upsert an invoice template
 * - If id is provided, updates that specific template
 * - If id is not provided, updates the default template or creates one if none exists
 * Uses a transaction for the create path to prevent race conditions where concurrent
 * requests could both create default templates.
 */
export async function upsertInvoiceTemplate(
  db: Database,
  params: UpsertInvoiceTemplateParams,
) {
  const { id, teamId, ...rest } = params;

  // If ID is provided, update that specific template (no race condition here)
  if (id) {
    const [result] = await db
      .update(invoiceTemplates)
      .set(rest)
      .where(
        and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.teamId, teamId)),
      )
      .returning(templateSelectFields);

    return result;
  }

  // No ID provided - use transaction to safely get or create the default template
  return db.transaction(async (tx) => {
    // First try to get the default template
    const [defaultTemplate] = await tx
      .select(templateSelectFields)
      .from(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.teamId, teamId),
          eq(invoiceTemplates.isDefault, true),
        ),
      )
      .limit(1);

    if (defaultTemplate) {
      // Update existing default template
      const [result] = await tx
        .update(invoiceTemplates)
        .set(rest)
        .where(
          and(
            eq(invoiceTemplates.id, defaultTemplate.id),
            eq(invoiceTemplates.teamId, teamId),
          ),
        )
        .returning(templateSelectFields);

      return result;
    }

    // Fall back to first template if no default
    const [firstTemplate] = await tx
      .select(templateSelectFields)
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.teamId, teamId))
      .orderBy(invoiceTemplates.createdAt)
      .limit(1);

    if (firstTemplate) {
      // Update existing first template
      const [result] = await tx
        .update(invoiceTemplates)
        .set(rest)
        .where(
          and(
            eq(invoiceTemplates.id, firstTemplate.id),
            eq(invoiceTemplates.teamId, teamId),
          ),
        )
        .returning(templateSelectFields);

      return result;
    }

    // No template exists - create a new default template with the provided values
    const [result] = await tx
      .insert(invoiceTemplates)
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
      .select({ id: invoiceTemplates.id })
      .from(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.id, params.id),
          eq(invoiceTemplates.teamId, params.teamId),
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
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.teamId, params.teamId));

    // Set the specified template as default
    const [result] = await tx
      .update(invoiceTemplates)
      .set({ isDefault: true })
      .where(
        and(
          eq(invoiceTemplates.id, params.id),
          eq(invoiceTemplates.teamId, params.teamId),
        ),
      )
      .returning(templateSelectFields);

    return result;
  });
}

/**
 * Delete an invoice template
 * Returns the deleted template and the new default template to switch to.
 * Uses a transaction to ensure atomicity - verifies at least one other template
 * exists, deletes the template, and sets a new default as a single atomic operation.
 */
export async function deleteInvoiceTemplate(
  db: Database,
  params: { id: string; teamId: string },
) {
  return db.transaction(async (tx) => {
    // Get the template to delete and check if it's the default
    const [templateToDelete] = await tx
      .select({
        id: invoiceTemplates.id,
        isDefault: invoiceTemplates.isDefault,
      })
      .from(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.id, params.id),
          eq(invoiceTemplates.teamId, params.teamId),
        ),
      )
      .limit(1);

    if (!templateToDelete) {
      throw new Error("Template not found");
    }

    // Count templates EXCLUDING the one we're about to delete
    // This is more defensive than counting first then deleting
    const otherTemplates = await tx
      .select({ id: invoiceTemplates.id })
      .from(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.teamId, params.teamId),
          // Exclude the template we're deleting
          sql`${invoiceTemplates.id} != ${params.id}`,
        ),
      )
      .limit(1);

    if (otherTemplates.length === 0) {
      throw new Error("Cannot delete the last template");
    }

    const wasDefault = templateToDelete.isDefault;

    // Delete the template
    const [deleted] = await tx
      .delete(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.id, params.id),
          eq(invoiceTemplates.teamId, params.teamId),
        ),
      )
      .returning();

    // If we deleted the default, set another template as default
    let newDefault = null;
    if (wasDefault) {
      const [firstRemaining] = await tx
        .select(templateSelectFields)
        .from(invoiceTemplates)
        .where(eq(invoiceTemplates.teamId, params.teamId))
        .orderBy(invoiceTemplates.createdAt)
        .limit(1);

      if (firstRemaining) {
        await tx
          .update(invoiceTemplates)
          .set({ isDefault: true })
          .where(eq(invoiceTemplates.id, firstRemaining.id));

        newDefault = { ...firstRemaining, isDefault: true };
      }
    } else {
      // Get the current default to switch to
      // Note: We use tx here since we're still in the transaction context
      const [defaultTemplate] = await tx
        .select(templateSelectFields)
        .from(invoiceTemplates)
        .where(
          and(
            eq(invoiceTemplates.teamId, params.teamId),
            eq(invoiceTemplates.isDefault, true),
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
export async function getInvoiceTemplateCount(db: Database, teamId: string) {
  const result = await db
    .select({ id: invoiceTemplates.id })
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.teamId, teamId));

  return result.length;
}
