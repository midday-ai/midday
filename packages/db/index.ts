import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import * as auth from "./schema/auth";
import * as post from "./schema/post";
export { mySqlTable as tableCreator } from "./schema/_table";

export * from "drizzle-orm";

export const schema = { ...auth, ...post };

export const db = drizzle(
  new Client({
    url: process.env.DATABASE_URL,
  }).connection(),
  { schema },
);