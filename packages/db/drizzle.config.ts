import type { Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export default {
	schema: "./schema",
	driver: "mysql2",
	dbCredentials: {
		connectionString: process.env.DATABASE_URL,
	},
	tablesFilter: ["midday_*"],
} satisfies Config;
