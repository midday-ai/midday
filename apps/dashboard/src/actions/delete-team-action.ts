"use server";

import { deleteTeamId } from "@/utils/team";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const deleteTeamAction = authActionClient
  .schema(z.object({ teamId: z.string() }))
  .metadata({
    name: "delete-team",
  })
  .action(async ({ parsedInput: { teamId } }) => {
    await deleteTeamId();

    redirect("/teams");
  });
