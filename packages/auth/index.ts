import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@midday/db";
import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "./env.mjs";

// Update this whenever adding new providers so that the client can
export const providers = ["google"] as const;
export type OAuthProviders = typeof providers[number];

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			picture?: string;
		} & DefaultSession["user"];
	}
}

export const {
	handlers: { GET, POST },
	auth,
	CSRF_experimental,
} = NextAuth({
	session: {
		strategy: "jwt",
	},
	adapter: DrizzleAdapter(db),
	providers: [
		GoogleProvider({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		session: ({ session, user }) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
			},
		}),
	},
});
