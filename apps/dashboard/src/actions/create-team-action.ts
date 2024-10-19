"use server";

import features from "@/config/enabled-features";
import { LogEvents } from "@midday/events/events";
import { getTeams } from "@midday/supabase/cached-queries";
import { createTeam, updateUser } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { createTeamSchema } from "./schema";

/**
 * Server-side action to create a new team.
 *
 * This action is responsible for creating a new team, updating the user's team association,
 * and handling the necessary data revalidation and redirection.
 *
 * @remarks
 * This action is protected by authentication and uses a schema for input validation.
 * It also includes event tracking functionality.
 *
 * @param options - The options for creating a team
 * @param options.parsedInput - The parsed and validated input from the client
 * @param options.parsedInput.name - The name of the team to be created
 * @param options.parsedInput.redirectTo - Optional URL to redirect to after team creation
 * @param options.ctx - The context object containing the Supabase client
 * @param options.ctx.supabase - The authenticated Supabase client instance
 *
 * @returns A Promise that resolves to the ID of the newly created team
 *
 * @throws Error if the user already has a team and multiple team support is disabled
 * @throws Error if updating the user data fails
 *
 * @example
 * ```typescript
 * const teamId = await createTeamAction({
 *   parsedInput: { name: "My New Team", redirectTo: "/dashboard" },
 *   ctx: { supabase: supabaseClient }
 * });
 * ```
 */
export const createTeamAction = authActionClient
  .schema(createTeamSchema)
  .metadata({
    name: "create-team",
    track: {
      event: LogEvents.CreateTeam.name,
      channel: LogEvents.CreateTeam.channel,
    },
  } as any)
  .action(async ({ parsedInput: { name, redirectTo }, ctx: { supabase } }) => {
    // Check if multiple team support is disabled
    if (features.isMultipleTeamSupportEnabled === false) {
      // Fetch existing teams for the user
      const existingTeams = await getTeams();
      // If the user already has a team, throw an error
      if (
        existingTeams &&
        existingTeams.data &&
        existingTeams.data.length >= 1
      ) {
        throw new Error(
          "You already have a team. You cannot create another one.",
        );
      }
    }

    // Create a new team and get the team ID
    const team_id = await createTeam(supabase, { name });

    // Update the user's team association
    const user = await updateUser(supabase, { team_id });

    // Check if the user update was successful
    if (!user?.data) {
      throw new Error("Failed to update user data.");
    }

    // Revalidate cached data for the user and their teams
    revalidateTag(`user_${user.data.id}`);
    revalidateTag(`teams_${user.data.id}`);

    // If a redirect URL is provided, redirect the user
    if (redirectTo) {
      redirect(redirectTo);
    }

    // Return the ID of the newly created team
    return team_id;
  });
