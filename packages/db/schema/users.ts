import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { posts } from "./posts";

export const users = sqliteTable(
  "users",
  {
    id: text("id", { length: 255 })
      .notNull()
      .default(sql`(uuid4())`)
      .primaryKey(),
    full_name: text("full_name"),
    avatar_url: text("avatar_url"),
    email: text("email", { length: 255 }),
    username: text("username", { length: 255 }),
    phone: text("phone", { length: 255 }).notNull(),
    created_at: integer("created_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updated_at: integer("updated_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => {
    return {
      usersEmailKey: unique("users_email_key").on(table.email),
      usersUsernameKey: unique("users_username_key").on(table.username),
    };
  },
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
