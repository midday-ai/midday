import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL is not set");
}

export default {
	schema: "./schema",
	driver: "pg",
	dbCredentials: {
		connectionString: process.env.POSTGRES_URL,
	},
} satisfies Config;
