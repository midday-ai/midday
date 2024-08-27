"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const updateDocumentAction = authActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      tag: z.string().optional(),
    }),
  )
  .metadata({
    name: "update-document",
  })
  .action(
    async ({ parsedInput: { id, ...payload }, ctx: { user, supabase } }) => {
      const { data } = await supabase
        .from("documents")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      revalidateTag(`vault_${user.team_id}`);

      return data;
    },
  );
