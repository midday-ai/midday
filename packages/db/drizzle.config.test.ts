import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/test/helpers/test-schema.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url:
      process.env.TEST_DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5433/midday_test",
  },
  verbose: true,
});
