import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
