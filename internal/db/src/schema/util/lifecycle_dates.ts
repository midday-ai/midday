import { bigint } from "drizzle-orm/mysql-core";

export const lifecycleDates = {
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).$onUpdateFn(() =>
    Date.now(),
  ),
};

/**
 * Over time I want to move all of our timestamps to bigints,
 *
 * These are named with a suffix, so we can have both the old ones and the new ones at the same time
 * for migrations
 */
export const lifecycleDatesMigration = {
  createdAtM: bigint("created_at_m", { mode: "number" })
    .notNull()
    .default(0)
    .$defaultFn(() => Date.now()),
  updatedAtM: bigint("updated_at_m", { mode: "number" }).$onUpdateFn(() =>
    Date.now(),
  ),
  deletedAtM: bigint("deleted_at_m", { mode: "number" }),
};
