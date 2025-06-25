import { z } from "zod";

export const onboardTeamSchema = z.object({
  userId: z.string().uuid(),
});
