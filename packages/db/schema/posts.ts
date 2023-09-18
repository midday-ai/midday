import { relations, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

export const posts = sqliteTable("posts", {
  id: text("id", { length: 255 })
    .notNull()
    .default(sql`(uuid4())`)
    .primaryKey(),
  content: text("content"),
  authorId: text("author_id", { length: 255 }),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const insertPostSchema = createInsertSchema(posts).omit({ id: true });
export const selectPostSchema = createSelectSchema(posts);
