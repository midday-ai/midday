import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@midday/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "./env.mjs";

export default NextAuth({
	adapter: DrizzleAdapter(db),
	providers: [
		// GoogleProvider({
		// 	clientId: env.GOOGLE_CLIENT_ID,
		// 	clientSecret: env.GOOGLE_CLIENT_SECRET,
		// }),
	],
});
