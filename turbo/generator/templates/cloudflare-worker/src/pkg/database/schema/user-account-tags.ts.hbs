import { integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { tags } from "./tags";
import { userAccounts } from "./user-accounts";

/**
 * Represents the user_accounts_tags table in the database.
 * This table manages the many-to-many relationship between user accounts and tags.
 *
 * @property {number} userAccountId - Foreign key referencing the associated user account in the userAccounts table.
 * @property {number} tagId - Foreign key referencing the associated tag in the tags table.
 *
 * @remarks
 * - The combination of userAccountId and tagId forms a composite primary key, ensuring unique associations.
 * - This structure allows for flexible tagging of user accounts, where each user can have multiple tags,
 *   and each tag can be associated with multiple users.
 * - Consider adding additional fields like 'createdAt' or 'addedBy' for auditing purposes.
 * - If you need to store additional information about the association (e.g., tag relevance score),
 *   you can add more columns to this table.
 */
export const userAccountsTags = sqliteTable(
  "user_accounts_tags",
  {
    userAccountId: integer("user_account_id").references(() => userAccounts.id),
    tagId: integer("tag_id").references(() => tags.id),
  },
  (t) => ({
    pk: uniqueIndex("user_accounts_tags_pkey").on(t.userAccountId, t.tagId),
  }),
);

export type UserAccountTag = typeof userAccountsTags.$inferSelect; // return type when queried
export type NewUserAccountTag = typeof userAccountsTags.$inferInsert; // insert type
