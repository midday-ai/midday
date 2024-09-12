import * as schema from "./schema";

export * from "./types";

export { schema };
export * from "drizzle-orm";
export {
  drizzle,
  type PlanetScaleDatabase,
} from "drizzle-orm/planetscale-serverless";
export { drizzle as mysqlDrizzle } from "drizzle-orm/mysql2";
