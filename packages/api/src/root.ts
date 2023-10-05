import { authRouter } from "./router/auth";
import { plaidRouter } from "./router/plaid";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
	auth: authRouter,
	plaid: plaidRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
