import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export default {
	schema: "./schema",
	driver: "pg",
	dbCredentials: {
		connectionString: process.env.DATABASE_URL,
	},
} satisfies Config;
