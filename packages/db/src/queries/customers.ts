import type { Database } from "@db/client";
import {
  customerTags,
  customers,
  exchangeRates,
  invoices,
  tags,
  teams,
  trackerProjects,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { createActivity } from "./activities";

type GetCustomerByIdParams = {
  id: string;
  teamId: string;
};

export const getCustomerById = async (
  db: Database,
  params: GetCustomerByIdParams,
) => {
  const [result] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`,
      projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`,
      tags: sql<CustomerTag[]>`
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
    .from(customers)
    .where(
      and(eq(customers.id, params.id), eq(customers.teamId, params.teamId)),
    )
    .leftJoin(invoices, eq(invoices.customerId, customers.id))
    .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id))
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    .leftJoin(tags, eq(tags.id, customerTags.tagId))
    .groupBy(customers.id);

  return result;
};

export type GetCustomersParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;

  sort?: string[] | null;
};

export type CustomerTag = {
  id: string;
  name: string;
};

export const getCustomers = async (
  db: Database,
  params: GetCustomersParams,
) => {
  const { teamId, sort, cursor, pageSize = 25, q } = params;

  const whereConditions: SQL[] = [eq(customers.teamId, teamId)];

  // Apply search query filter
  if (q) {
    // If the query is a number, search by numeric fields if any
    if (!Number.isNaN(Number.parseInt(q))) {
      // Add numeric search logic if needed
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search or name
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${customers.fts} OR ${customers.name} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`,
      projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`,
      tags: sql<CustomerTag[]>`
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
    .from(customers)
    .leftJoin(invoices, eq(invoices.customerId, customers.id))
    .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id))
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    .leftJoin(tags, eq(tags.id, customerTags.tagId))
    .where(and(...whereConditions))
    .groupBy(customers.id);

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "name") {
      isAscending
        ? query.orderBy(asc(customers.name))
        : query.orderBy(desc(customers.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(customers.createdAt))
        : query.orderBy(desc(customers.createdAt));
    } else if (column === "contact") {
      isAscending
        ? query.orderBy(asc(customers.contact))
        : query.orderBy(desc(customers.contact));
    } else if (column === "email") {
      isAscending
        ? query.orderBy(asc(customers.email))
        : query.orderBy(desc(customers.email));
    } else if (column === "invoices") {
      // Sort by invoice count
      isAscending
        ? query.orderBy(asc(sql`count(${invoices.id})`))
        : query.orderBy(desc(sql`count(${invoices.id})`));
    } else if (column === "projects") {
      // Sort by project count
      isAscending
        ? query.orderBy(asc(sql`count(${trackerProjects.id})`))
        : query.orderBy(desc(sql`count(${trackerProjects.id})`));
    } else if (column === "tags") {
      // Sort by first tag name (alphabetically)
      isAscending
        ? query.orderBy(asc(sql`min(${tags.name})`))
        : query.orderBy(desc(sql`min(${tags.name})`));
    }
    // Add other sorting options as needed
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(customers.createdAt));
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

export type UpsertCustomerParams = {
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

export const upsertCustomer = async (
  db: Database,
  params: UpsertCustomerParams,
) => {
  const { id, tags: inputTags, teamId, userId, ...rest } = params;

  const token = id ? await generateToken(id) : undefined;

  const isNewCustomer = !id;

  // Upsert customer
  const [customer] = await db
    .insert(customers)
    .values({
      id,
      teamId,
      ...rest,
    })
    .onConflictDoUpdate({
      target: customers.id,
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

  if (!customer) {
    throw new Error("Failed to create or update customer");
  }

  const customerId = customer.id;

  // Create activity for new customers only
  if (isNewCustomer) {
    createActivity(db, {
      teamId,
      userId,
      type: "customer_created",
      source: "user",
      priority: 7,
      metadata: {
        customerId: customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        website: customer.website,
        country: customer.country,
        city: customer.city,
      },
    });
  }

  // Get current tags for the customer
  const currentCustomerTags = await db
    .select({
      id: customerTags.id,
      tagId: customerTags.tagId,
      tag: {
        id: tags.id,
        name: tags.name,
      },
    })
    .from(customerTags)
    .where(eq(customerTags.customerId, customerId))
    .leftJoin(tags, eq(tags.id, customerTags.tagId));

  const currentTagIds = new Set(currentCustomerTags.map((ct) => ct.tagId));
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
    await db.insert(customerTags).values(
      tagsToInsert.map((tag) => ({
        customerId,
        tagId: tag.id,
        teamId,
      })),
    );
  }

  // Delete removed tag associations
  if (tagIdsToDelete.length > 0) {
    await db
      .delete(customerTags)
      .where(
        and(
          eq(customerTags.customerId, customerId),
          inArray(customerTags.tagId, tagIdsToDelete),
        ),
      );
  }

  // Return the customer with updated tags
  const [result] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      billingEmail: customers.billingEmail,
      phone: customers.phone,
      website: customers.website,
      createdAt: customers.createdAt,
      teamId: customers.teamId,
      country: customers.country,
      addressLine1: customers.addressLine1,
      addressLine2: customers.addressLine2,
      city: customers.city,
      state: customers.state,
      zip: customers.zip,
      note: customers.note,
      vatNumber: customers.vatNumber,
      countryCode: customers.countryCode,
      token: customers.token,
      contact: customers.contact,
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`,
      projectCount: sql<number>`cast(count(${trackerProjects.id}) as int)`,
      tags: sql<CustomerTag[]>`
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
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.teamId, teamId)))
    .leftJoin(invoices, eq(invoices.customerId, customers.id))
    .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id))
    .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
    .leftJoin(tags, eq(tags.id, customerTags.tagId))
    .groupBy(customers.id);

  return result;
};

export type DeleteCustomerParams = {
  id: string;
  teamId: string;
};

export const deleteCustomer = async (
  db: Database,
  params: DeleteCustomerParams,
) => {
  const { id, teamId } = params;

  // First, get the customer data before deleting it
  const customerToDelete = await getCustomerById(db, { id, teamId });

  if (!customerToDelete) {
    throw new Error("Customer not found");
  }

  // Delete the customer
  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)));

  // Return the deleted customer data
  return customerToDelete;
};

export type GetCustomerInvoiceSummaryParams = {
  customerId: string;
  teamId: string;
};

export async function getCustomerInvoiceSummary(
  db: Database,
  params: GetCustomerInvoiceSummaryParams,
) {
  const { customerId, teamId } = params;

  // Get team's base currency first
  const [team] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const baseCurrency = team?.baseCurrency || "USD";

  // Get all invoices for this customer
  const invoiceData = await db
    .select({
      amount: invoices.amount,
      currency: invoices.currency,
      status: invoices.status,
    })
    .from(invoices)
    .where(
      and(eq(invoices.customerId, customerId), eq(invoices.teamId, teamId)),
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
