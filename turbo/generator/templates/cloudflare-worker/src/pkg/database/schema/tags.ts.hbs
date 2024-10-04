import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { businessAccountsTags } from "./business-account-tags";
import { tagMetadata } from "./tag-metadata";
import { userAccountsTags } from "./user-account-tags";

/**
 * Represents the tags table in the database.
 * This table stores information about tags used to categorize or label various entities in the system.
 *
 * @property {number} id - Unique identifier for the tag.
 * @property {string} tagName - The name of the tag (max 255 characters).
 *                              This field is required and typically used for display and searching.
 * @property {string} tagDescription - A detailed description of the tag.
 *                                     This field is required and provides more context about the tag's purpose or usage.
 *
 * @remarks
 * - Consider adding a unique constraint on tagName if tag names should be unique across the system.
 * - You might want to add additional fields like createdAt, updatedAt, or createdBy for auditing purposes.
 */
export const tags = sqliteTable("tags", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  tagName: text("tag_name", { length: 255 }).notNull(),
  tagDescription: text("tag_description").notNull(),
});

/**
 * Defines the relationships between the tags table and other tables in the database.
 *
 * @property {Relation} metadata - One-to-many relationship with the tagMetadata table.
 *                                 Each tag can have multiple metadata entries.
 * @property {Relation} userAccounts - Many-to-many relationship with userAccounts through the userAccountsTags table.
 *                                     Tags can be associated with multiple user accounts and vice versa.
 * @property {Relation} businessAccounts - Many-to-many relationship with businessAccounts through the businessAccountsTags table.
 *                                         Tags can be associated with multiple business accounts and vice versa.
 *
 * @remarks
 * - These relationships allow for flexible tagging of both user and business accounts.
 * - The metadata relationship allows for extensible properties to be added to tags without modifying the main tags table.
 */
export const tagsRelations = relations(tags, ({ many }) => ({
  metadata: many(tagMetadata),
  userAccounts: many(userAccountsTags),
  businessAccounts: many(businessAccountsTags),
}));

export type Tag = typeof tags.$inferSelect; // return type when queried
export type NewTag = typeof tags.$inferInsert; // insert type
