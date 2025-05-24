import { z } from "zod";

export const connectInboxAccountSchema = z.object({
  provider: z.enum(["gmail", "outlook"]),
});

export const deleteInboxAccountSchema = z.object({ id: z.string() });
