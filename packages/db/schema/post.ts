import { sql } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/mysql-core";

import { mySqlTable } from "./_table";

export const post = mySqlTable("post", {
	id: serial("id").primaryKey(),
	title: varchar("name", { length: 256 }).notNull(),
	content: varchar("content", { length: 256 }).notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updatedAt").onUpdateNow(),
});
