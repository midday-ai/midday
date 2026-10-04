import { assertTeamKey } from "@midday/storage/keys";
import { TRPCError } from "@trpc/server";

/** Translate key validation into a consistent tenant authorization failure. */
export function assertStorageTeamKey(teamId: string, input: string | string[]) {
  try {
    return assertTeamKey(teamId, input);
  } catch (cause) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Storage key does not belong to your team",
      cause,
    });
  }
}
