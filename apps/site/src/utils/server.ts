import { createInnerTRPCContext } from "@midday/api/src/trpc";

export const createTRPCContext = async () => {
  return createInnerTRPCContext({
    // user: user.data.user,
  });
};
