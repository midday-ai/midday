import { defineConfig } from "drizzle-kit";

export default defineConfig({
  verbose: true,
  schema: "./src/schema/index.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL!,
  },
});
