import type { DefaultSession } from "@auth/core/types";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@midday/db";
import NextAuth from "next-auth";
// import { env } from "./env.mjs";

export type { Session } from "next-auth";

export const providers = ["google"] as const;
export type OAuthProviders = typeof providers[number];

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
		} & DefaultSession["user"];
	}
}

export const {
	handlers: { GET, POST },
	auth,
	CSRF_experimental,
} = NextAuth({
	adapter: DrizzleAdapter(db, tableCreator),
	providers: [],
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
