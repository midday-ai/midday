"use server";

import { deleteTeamId } from "@/utils/team";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const deleteTeamAction = authActionClient
  .schema(z.void())
  .metadata({
    name: "delete-team",
  })
  .action(async () => {
    await deleteTeamId();

    redirect("/teams");
  });
