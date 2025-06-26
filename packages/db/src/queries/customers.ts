import type { Database } from "@db/client";
import {
  customerTags,
  customers,
  invoices,
  tags,
  trackerProjects,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

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
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`.as(
        "invoice_count",
      ),
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
      invoiceCount: sql<number>`cast(count(${invoices.id}) as int)`.as(
        "invoice_count",
      ),
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
  const { id, tags: inputTags, teamId, ...rest } = params;

  const token = id ? await generateToken(id) : undefined;

  // Start a transaction
  return db.transaction(async (tx) => {
    // Upsert customer
    const [customer] = await tx
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

    // Get current tags for the customer
    const currentCustomerTags = await tx
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
      await tx.insert(customerTags).values(
        tagsToInsert.map((tag) => ({
          customerId,
          tagId: tag.id,
          teamId,
        })),
      );
    }

    // Delete removed tag associations
    if (tagIdsToDelete.length > 0) {
      await tx
        .delete(customerTags)
        .where(
          and(
            eq(customerTags.customerId, customerId),
            inArray(customerTags.tagId, tagIdsToDelete),
          ),
        );
    }

    // Return the customer with updated tags
    const [result] = await tx
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
      .leftJoin(customerTags, eq(customerTags.customerId, customers.id))
      .leftJoin(tags, eq(tags.id, customerTags.tagId))
      .groupBy(customers.id);

    return result;
  });
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
  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)))
    .returning();
};
