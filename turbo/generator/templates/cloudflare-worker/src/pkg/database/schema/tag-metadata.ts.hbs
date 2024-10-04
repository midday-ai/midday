import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tags } from "./tags";

/**
 * Represents the tag_metadata table in the database.
 * This table stores additional metadata associated with tags.
 *
 * @property {number} id - Unique identifier for the tag metadata entry.
 * @property {number | null} tagId - Foreign key referencing the associated tag in the tags table.
 *                                   This allows for a one-to-one or one-to-many relationship between tags and their metadata.
 * @property {string} metadata - JSON string containing the metadata for the tag.
 *                               This field is required and can store various pieces of information related to the tag.
 *
 * @remarks
 * - The metadata field can be used to store any additional information about a tag that doesn't fit into the main tags table.
 * - The structure of the metadata JSON can be flexible, allowing for different types of information for different tags.
 * - Consider adding an index on the tagId column if you frequently query metadata by tag.
 */
export const tagMetadata = sqliteTable("tag_metadata", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  tagId: integer("tag_id").references(() => tags.id),
  metadata: text("metadata").notNull(),
});

export type TagMetadata = typeof tagMetadata.$inferSelect; // return type when queried
export type NewTagMetadata = typeof tagMetadata.$inferInsert; // insert type
