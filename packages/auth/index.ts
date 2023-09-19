import type { DefaultSession } from "@auth/core/types";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@midday/db";
import NextAuth from "next-auth";
// import { env } from "./env.mjs";

export type { Session } from "next-auth";

// Update this whenever adding new providers so that the client can
export const providers = ["discord"] as const;
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

		// @TODO - if you wanna have auth on the edge
		// jwt: ({ token, profile }) => {
		//   if (profile?.id) {
		//     token.id = profile.id;
		//     token.image = profile.picture;
		//   }
		//   return token;
		// },

		// @TODO
		// authorized({ request, auth }) {
		//   return !!auth?.user
		// }
	},
});
