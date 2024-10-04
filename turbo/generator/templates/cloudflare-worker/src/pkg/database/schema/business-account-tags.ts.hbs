import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { tags } from "./tags";

/**
 * Represents the many-to-many relationship between business accounts and tags.
 * This table stores the associations between business accounts and their tags.
 *
 * @property {number} businessAccountId - The ID of the associated business account.
 *                                        References the 'id' column in the 'business_accounts' table.
 * @property {number} tagId - The ID of the associated tag.
 *                            References the 'id' column in the 'tags' table.
 *
 * @remarks
 * This table uses a composite primary key consisting of both 'businessAccountId' and 'tagId'.
 * This ensures that each business account-tag combination is unique.
 */
export const businessAccountsTags = sqliteTable(
  "business_accounts_tags",
  {
    businessAccountId: integer("business_account_id").references(
      () => businessAccounts.id,
    ),
    tagId: integer("tag_id").references(() => tags.id),
  },
  (t) => ({
    pk: uniqueIndex("business_accounts_tags_pkey").on(
      t.businessAccountId,
      t.tagId,
    ),
  }),
);

export type BusinessAccountTag = typeof businessAccountsTags.$inferSelect; // return type when queried
export type NewBusinessAccountTag = typeof businessAccountsTags.$inferInsert; // insert type
