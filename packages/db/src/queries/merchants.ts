import type { Database } from "@db/client";
import {
  merchantTags,
  merchants,
  exchangeRates,
  invoices,
  tags,
  teams,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { nanoid } from "nanoid";
import { createActivity } from "./activities";

type GetMerchantByIdParams = {
  id: string;
  teamId: string;
};

export const getMerchantById = async (
  db: Database,
  params: GetMerchantByIdParams,
) => {
  const [result] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      billingEmail: merchants.billingEmail,
      phone: merchants.phone,
      website: merchants.website,
      createdAt: merchants.createdAt,
      teamId: merchants.teamId,
      country: merchants.country,
      addressLine1: merchants.addressLine1,
      addressLine2: merchants.addressLine2,
      city: merchants.city,
      state: merchants.state,
      zip: merchants.zip,
      note: merchants.note,
      vatNumber: merchants.vatNumber,
      countryCode: merchants.countryCode,
      token: merchants.token,
      contact: merchants.contact,
      // Merchant relationship fields
      status: merchants.status,
      preferredCurrency: merchants.preferredCurrency,
      defaultPaymentTerms: merchants.defaultPaymentTerms,
      isArchived: merchants.isArchived,
      source: merchants.source,
      externalId: merchants.externalId,
      // Enrichment fields
      logoUrl: merchants.logoUrl,
      description: merchants.description,
      industry: merchants.industry,
      companyType: merchants.companyType,
      employeeCount: merchants.employeeCount,
      foundedYear: merchants.foundedYear,
      estimatedRevenue: merchants.estimatedRevenue,
      fundingStage: merchants.fundingStage,
      totalFunding: merchants.totalFunding,
      headquartersLocation: merchants.headquartersLocation,
      timezone: merchants.timezone,
      linkedinUrl: merchants.linkedinUrl,
      twitterUrl: merchants.twitterUrl,
      instagramUrl: merchants.instagramUrl,
      facebookUrl: merchants.facebookUrl,
      ceoName: merchants.ceoName,
      financeContact: merchants.financeContact,
      financeContactEmail: merchants.financeContactEmail,
      primaryLanguage: merchants.primaryLanguage,
      fiscalYearEnd: merchants.fiscalYearEnd,
      enrichmentStatus: merchants.enrichmentStatus,
      enrichedAt: merchants.enrichedAt,
      // Portal fields
      portalEnabled: merchants.portalEnabled,
      portalId: merchants.portalId,
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`,
      tags: sql<MerchantTag[]>`
        coalesce(
          json_agg(
            distinct jsonb_build_object(
              'id', ${tags.id},
              'name', ${tags.name}
            )
          ) filter (where ${tags.id} is not null),
          '[]'
        )
      `.as("tags"),
    })
    .from(merchants)
    .where(
      and(eq(merchants.id, params.id), eq(merchants.teamId, params.teamId)),
    )
    .leftJoin(invoices, eq(invoices.merchantId, merchants.id))
    .leftJoin(merchantTags, eq(merchantTags.merchantId, merchants.id))
    .leftJoin(tags, eq(tags.id, merchantTags.tagId))
    .groupBy(merchants.id);

  return result;
};

export type GetMerchantsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;

  sort?: string[] | null;
};

export type MerchantTag = {
  id: string;
  name: string;
};

export const getMerchants = async (
  db: Database,
  params: GetMerchantsParams,
) => {
  const { teamId, sort, cursor, pageSize = 25, q } = params;

  const whereConditions: SQL[] = [eq(merchants.teamId, teamId)];

  // Apply search query filter
  if (q) {
    // If the query is a number, search by numeric fields if any
    if (!Number.isNaN(Number.parseInt(q))) {
      // Add numeric search logic if needed
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search or name
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${merchants.fts} OR ${merchants.name} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      billingEmail: merchants.billingEmail,
      phone: merchants.phone,
      website: merchants.website,
      createdAt: merchants.createdAt,
      teamId: merchants.teamId,
      country: merchants.country,
      addressLine1: merchants.addressLine1,
      addressLine2: merchants.addressLine2,
      city: merchants.city,
      state: merchants.state,
      zip: merchants.zip,
      note: merchants.note,
      vatNumber: merchants.vatNumber,
      countryCode: merchants.countryCode,
      token: merchants.token,
      contact: merchants.contact,
      // Merchant relationship fields
      status: merchants.status,
      isArchived: merchants.isArchived,
      // Enrichment fields for list view
      logoUrl: merchants.logoUrl,
      description: merchants.description,
      industry: merchants.industry,
      companyType: merchants.companyType,
      employeeCount: merchants.employeeCount,
      foundedYear: merchants.foundedYear,
      estimatedRevenue: merchants.estimatedRevenue,
      fundingStage: merchants.fundingStage,
      totalFunding: merchants.totalFunding,
      headquartersLocation: merchants.headquartersLocation,
      timezone: merchants.timezone,
      linkedinUrl: merchants.linkedinUrl,
      twitterUrl: merchants.twitterUrl,
      instagramUrl: merchants.instagramUrl,
      facebookUrl: merchants.facebookUrl,
      ceoName: merchants.ceoName,
      financeContact: merchants.financeContact,
      financeContactEmail: merchants.financeContactEmail,
      primaryLanguage: merchants.primaryLanguage,
      fiscalYearEnd: merchants.fiscalYearEnd,
      enrichmentStatus: merchants.enrichmentStatus,
      // Portal fields
      portalEnabled: merchants.portalEnabled,
      portalId: merchants.portalId,
      invoiceCount: sql<number>`cast(count(distinct ${invoices.id}) as int)`,
      // Financial metrics (invoices)
      totalRevenue: sql<number>`coalesce(sum(case when ${invoices.status} = 'paid' then ${invoices.amount} else 0 end), 0)`,
      outstandingAmount: sql<number>`coalesce(sum(case when ${invoices.status} in ('unpaid', 'overdue') then ${invoices.amount} else 0 end), 0)`,
      lastInvoiceDate: sql<string | null>`max(${invoices.issueDate})`,
      invoiceCurrency: sql<
        string | null
      >`(array_agg(${invoices.currency}) filter (where ${invoices.currency} is not null))[1]`,
      // MCA deal aggregates (scalar subqueries to avoid cartesian product with other JOINs)
      dealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      activeDealCount: sql<number>`(select cast(count(*) as int) from mca_deals where mca_deals.merchant_id = ${merchants.id} and mca_deals.status = 'active')`,
      totalFundedAmount: sql<number>`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      totalPaybackAmount: sql<number>`(select coalesce(sum(payback_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      totalDealBalance: sql<number>`(select coalesce(sum(current_balance), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      totalDealPaid: sql<number>`(select coalesce(sum(total_paid), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      totalNsfCount: sql<number>`(select cast(coalesce(sum(nsf_count), 0) as int) from mca_deals where mca_deals.merchant_id = ${merchants.id})`,
      tags: sql<MerchantTag[]>`
        coalesce(
          json_agg(
            distinct jsonb_build_object(
              'id', ${tags.id},
              'name', ${tags.name}
            )
          ) filter (where ${tags.id} is not null),
          '[]'
        )
      `.as("tags"),
    })
    .from(merchants)
    .leftJoin(invoices, eq(invoices.merchantId, merchants.id))
    .leftJoin(merchantTags, eq(merchantTags.merchantId, merchants.id))
    .leftJoin(tags, eq(tags.id, merchantTags.tagId))
    .where(and(...whereConditions))
    .groupBy(merchants.id);

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "name") {
      isAscending
        ? query.orderBy(asc(merchants.name))
        : query.orderBy(desc(merchants.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(merchants.createdAt))
        : query.orderBy(desc(merchants.createdAt));
    } else if (column === "contact") {
      isAscending
        ? query.orderBy(asc(merchants.contact))
        : query.orderBy(desc(merchants.contact));
    } else if (column === "email") {
      isAscending
        ? query.orderBy(asc(merchants.email))
        : query.orderBy(desc(merchants.email));
    } else if (column === "invoices") {
      // Sort by invoice count
      isAscending
        ? query.orderBy(asc(sql`count(${invoices.id})`))
        : query.orderBy(desc(sql`count(${invoices.id})`));
    } else if (column === "tags") {
      // Sort by first tag name (alphabetically)
      isAscending
        ? query.orderBy(asc(sql`min(${tags.name})`))
        : query.orderBy(desc(sql`min(${tags.name})`));
    } else if (column === "industry") {
      isAscending
        ? query.orderBy(asc(merchants.industry))
        : query.orderBy(desc(merchants.industry));
    } else if (column === "country") {
      isAscending
        ? query.orderBy(asc(merchants.country))
        : query.orderBy(desc(merchants.country));
    } else if (column === "total_revenue") {
      isAscending
        ? query.orderBy(
            asc(
              sql`coalesce(sum(case when ${invoices.status} = 'paid' then ${invoices.amount} else 0 end), 0)`,
            ),
          )
        : query.orderBy(
            desc(
              sql`coalesce(sum(case when ${invoices.status} = 'paid' then ${invoices.amount} else 0 end), 0)`,
            ),
          );
    } else if (column === "outstanding") {
      isAscending
        ? query.orderBy(
            asc(
              sql`coalesce(sum(case when ${invoices.status} in ('unpaid', 'overdue') then ${invoices.amount} else 0 end), 0)`,
            ),
          )
        : query.orderBy(
            desc(
              sql`coalesce(sum(case when ${invoices.status} in ('unpaid', 'overdue') then ${invoices.amount} else 0 end), 0)`,
            ),
          );
    } else if (column === "last_invoice") {
      isAscending
        ? query.orderBy(asc(sql`max(${invoices.issueDate})`))
        : query.orderBy(desc(sql`max(${invoices.issueDate})`));
    } else if (column === "deals") {
      isAscending
        ? query.orderBy(asc(sql`(select count(*) from mca_deals where mca_deals.merchant_id = ${merchants.id})`))
        : query.orderBy(desc(sql`(select count(*) from mca_deals where mca_deals.merchant_id = ${merchants.id})`));
    } else if (column === "total_funded") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(funding_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`));
    } else if (column === "total_payback") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(payback_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(payback_amount), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`));
    } else if (column === "balance") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(current_balance), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(current_balance), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`));
    } else if (column === "total_nsf") {
      isAscending
        ? query.orderBy(asc(sql`(select coalesce(sum(nsf_count), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`))
        : query.orderBy(desc(sql`(select coalesce(sum(nsf_count), 0) from mca_deals where mca_deals.merchant_id = ${merchants.id})`));
    }
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(merchants.createdAt));
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

  // Execute query
  const data = await query;

  // Calculate next cursor
  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
};

export type UpsertMerchantParams = {
  id?: string;
  teamId: string;
  userId?: string;
  name: string;
  email: string;
  billingEmail?: string | null;
  country?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  note?: string | null;
  website?: string | null;
  phone?: string | null;
  contact?: string | null;
  vatNumber?: string | null;
  countryCode?: string | null;
  tags?: { id: string; name: string }[] | null;
};

export const upsertMerchant = async (
  db: Database,
  params: UpsertMerchantParams,
) => {
  const { id, tags: inputTags, teamId, userId, ...rest } = params;

  const token = id ? await generateToken(id) : undefined;

  const isNewMerchant = !id;

  // Upsert merchant
  const [merchant] = await db
    .insert(merchants)
    .values({
      id,
      teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: merchants.id,
      set: {
        name: rest.name,
        email: rest.email,
        billingEmail: rest.billingEmail,
        token,
        country: rest.country,
        addressLine1: rest.addressLine1,
        addressLine2: rest.addressLine2,
        city: rest.city,
        state: rest.state,
        zip: rest.zip,
        note: rest.note,
        website: rest.website,
        phone: rest.phone,
        contact: rest.contact,
        vatNumber: rest.vatNumber,
        countryCode: rest.countryCode,
      },
    })
    .returning();

  if (!merchant) {
    throw new Error("Failed to create or update merchant");
  }

  const merchantId = merchant.id;

  // Create activity for new merchants only
  if (isNewMerchant) {
    createActivity(db, {
      teamId,
      userId,
      type: "merchant_created",
      source: "user",
      priority: 7,
      metadata: {
        merchantId: merchantId,
        merchantName: merchant.name,
        merchantEmail: merchant.email,
        website: merchant.website,
        country: merchant.country,
        city: merchant.city,
      },
    });
  }

  // Get current tags for the merchant
  const currentMerchantTags = await db
    .select({
      id: merchantTags.id,
      tagId: merchantTags.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
      },
    })
    .from(merchantTags)
    .where(eq(merchantTags.merchantId, merchantId))
    .leftJoin(tags, eq(tags.id, merchantTags.tagId));

  const currentTagIds = new Set(currentMerchantTags.map((ct) => ct.tagId));
  const inputTagIds = new Set(inputTags?.map((t) => t.id) || []);

  // Tags to insert (in input but not current)
  const tagsToInsert =
    inputTags?.filter((tag) => !currentTagIds.has(tag.id)) || [];

  // Tags to delete (in current but not input)
  const tagIdsToDelete = Array.from(currentTagIds).filter(
    (tagId) => !inputTagIds.has(tagId),
  );

  // Insert new tag associations
  if (tagsToInsert.length > 0) {
    await db.insert(merchantTags).values(
      tagsToInsert.map((tag) => ({
        merchantId,
        tagId: tag.id,
        teamId,
      })),
    );
  }

  // Delete removed tag associations
  if (tagIdsToDelete.length > 0) {
    await db
      .delete(merchantTags)
      .where(
        and(
          eq(merchantTags.merchantId, merchantId),
          inArray(merchantTags.tagId, tagIdsToDelete),
        ),
      );
  }

  // Return the merchant with updated tags
  const [result] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      billingEmail: merchants.billingEmail,
      phone: merchants.phone,
      website: merchants.website,
      createdAt: merchants.createdAt,
      teamId: merchants.teamId,
      country: merchants.country,
      addressLine1: merchants.addressLine1,
      addressLine2: merchants.addressLine2,
      city: merchants.city,
      state: merchants.state,
      zip: merchants.zip,
      note: merchants.note,
      vatNumber: merchants.vatNumber,
      countryCode: merchants.countryCode,
      token: merchants.token,
      contact: merchants.contact,
      portalEnabled: merchants.portalEnabled,
      portalId: merchants.portalId,
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`,
      tags: sql<MerchantTag[]>`
          coalesce(
            json_agg(
              distinct jsonb_build_object(
                'id', ${tags.id},
                'name', ${tags.name}
              )
            ) filter (where ${tags.id} is not null),
            '[]'
          )
        `.as("tags"),
    })
    .from(merchants)
    .where(and(eq(merchants.id, merchantId), eq(merchants.teamId, teamId)))
    .leftJoin(invoices, eq(invoices.merchantId, merchants.id))
    .leftJoin(merchantTags, eq(merchantTags.merchantId, merchants.id))
    .leftJoin(tags, eq(tags.id, merchantTags.tagId))
    .groupBy(merchants.id);

  return result;
};

export type DeleteMerchantParams = {
  id: string;
  teamId: string;
};

export const deleteMerchant = async (
  db: Database,
  params: DeleteMerchantParams,
) => {
  const { id, teamId } = params;

  // First, get the merchant data before deleting it
  const merchantToDelete = await getMerchantById(db, { id, teamId });

  if (!merchantToDelete) {
    throw new Error("Merchant not found");
  }

  // Delete the merchant
  await db
    .delete(merchants)
    .where(and(eq(merchants.id, id), eq(merchants.teamId, teamId)));

  // Return the deleted merchant data
  return merchantToDelete;
};

export type GetMerchantInvoiceSummaryParams = {
  merchantId: string;
  teamId: string;
};

export async function getMerchantInvoiceSummary(
  db: Database,
  params: GetMerchantInvoiceSummaryParams,
) {
  const { merchantId, teamId } = params;

  // Get team's base currency first
  const [team] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const baseCurrency = team?.baseCurrency || "USD";

  // Get all invoices for this merchant
  const invoiceData = await db
    .select({
      amount: invoices.amount,
      currency: invoices.currency,
      status: invoices.status,
    })
    .from(invoices)
    .where(
      and(eq(invoices.merchantId, merchantId), eq(invoices.teamId, teamId)),
    );

  if (invoiceData.length === 0) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      invoiceCount: 0,
      currency: baseCurrency,
    };
  }

  // Collect unique currencies that need conversion (excluding base currency)
  const currenciesToConvert = [
    ...new Set(
      invoiceData
        .map((inv) => inv.currency || baseCurrency)
        .filter((currency) => currency !== baseCurrency),
    ),
  ];

  // Fetch all exchange rates
  const exchangeRateMap = new Map<string, number>();
  if (currenciesToConvert.length > 0) {
    const exchangeRatesData = await db
      .select({
        base: exchangeRates.base,
        rate: exchangeRates.rate,
      })
      .from(exchangeRates)
      .where(
        and(
          inArray(exchangeRates.base, currenciesToConvert),
          eq(exchangeRates.target, baseCurrency),
        ),
      );

    // Build a map for O(1) lookup
    for (const rateData of exchangeRatesData) {
      if (rateData.base && rateData.rate) {
        exchangeRateMap.set(rateData.base, Number(rateData.rate));
      }
    }
  }

  // Convert all amounts to base currency and calculate totals
  let totalAmount = 0;
  let paidAmount = 0;
  let outstandingAmount = 0;
  let invoiceCount = 0;

  for (const invoice of invoiceData) {
    const amount = Number(invoice.amount) || 0;
    const currency = invoice.currency || baseCurrency;

    let convertedAmount = amount;
    let canConvert = true;

    // Convert to base currency if different
    if (currency !== baseCurrency) {
      const exchangeRate = exchangeRateMap.get(currency);
      if (exchangeRate) {
        convertedAmount = amount * exchangeRate;
      } else {
        // Skip invoices with missing exchange rates to avoid mixing currencies
        // This prevents silently producing incorrect totals
        canConvert = false;
      }
    }

    // Only include invoices that can be properly converted and are paid or outstanding
    // Draft, canceled, and scheduled invoices don't count toward financial totals
    if (canConvert) {
      if (invoice.status === "paid") {
        paidAmount += convertedAmount;
        totalAmount += convertedAmount;
        invoiceCount++;
      } else if (invoice.status === "unpaid" || invoice.status === "overdue") {
        outstandingAmount += convertedAmount;
        totalAmount += convertedAmount;
        invoiceCount++;
      }
    }
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
    invoiceCount,
    currency: baseCurrency,
  };
}

export type ToggleMerchantPortalParams = {
  merchantId: string;
  teamId: string;
  enabled: boolean;
};

/**
 * Toggle merchant portal access.
 * Generates a portal_id (nanoid(8)) on first enable.
 */
export async function toggleMerchantPortal(
  db: Database,
  params: ToggleMerchantPortalParams,
) {
  const { merchantId, teamId, enabled } = params;

  // Get current merchant to check if portal_id exists
  const [currentMerchant] = await db
    .select({
      id: merchants.id,
      portalId: merchants.portalId,
    })
    .from(merchants)
    .where(and(eq(merchants.id, merchantId), eq(merchants.teamId, teamId)))
    .limit(1);

  if (!currentMerchant) {
    throw new Error("Merchant not found");
  }

  // Generate portal_id if enabling and doesn't exist yet
  const portalId =
    enabled && !currentMerchant.portalId ? nanoid(8) : currentMerchant.portalId;

  // Update the merchant
  const [result] = await db
    .update(merchants)
    .set({
      portalEnabled: enabled,
      portalId,
    })
    .where(and(eq(merchants.id, merchantId), eq(merchants.teamId, teamId)))
    .returning({
      id: merchants.id,
      portalEnabled: merchants.portalEnabled,
      portalId: merchants.portalId,
    });

  return result;
}

export type GetMerchantByPortalIdParams = {
  portalId: string;
};

/**
 * Get merchant by portal ID for public portal page.
 * Only returns merchant if portal is enabled.
 */
export async function getMerchantByPortalId(
  db: Database,
  params: GetMerchantByPortalIdParams,
) {
  const { portalId } = params;

  const [result] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email,
      website: merchants.website,
      teamId: merchants.teamId,
      portalEnabled: merchants.portalEnabled,
      portalId: merchants.portalId,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
        baseCurrency: teams.baseCurrency,
      },
    })
    .from(merchants)
    .innerJoin(teams, eq(teams.id, merchants.teamId))
    .where(
      and(eq(merchants.portalId, portalId), eq(merchants.portalEnabled, true)),
    )
    .limit(1);

  return result;
}

export type GetMerchantPortalInvoicesParams = {
  merchantId: string;
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
};

/**
 * Get invoices for merchant portal.
 * Only returns non-draft invoices (paid, unpaid, overdue).
 */
export async function getMerchantPortalInvoices(
  db: Database,
  params: GetMerchantPortalInvoicesParams,
) {
  const { merchantId, teamId, cursor, pageSize = 10 } = params;

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amount: invoices.amount,
      currency: invoices.currency,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      token: invoices.token,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.merchantId, merchantId),
        eq(invoices.teamId, teamId),
        // Only show paid, unpaid, overdue (exclude draft, canceled, scheduled, refunded)
        sql`${invoices.status} IN ('paid', 'unpaid', 'overdue')`,
      ),
    )
    .orderBy(desc(invoices.issueDate))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data.length === pageSize ? (offset + pageSize).toString() : null;

  return {
    data,
    nextCursor,
    hasMore: data.length === pageSize,
  };
}
