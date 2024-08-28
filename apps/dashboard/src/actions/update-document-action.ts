"use server";

import { revalidatePath } from "next/cache";
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

      revalidatePath("/vault");

      return data;
    },
  );
