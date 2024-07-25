"use server";

import { updateUser } from "@midday/supabase/mutations";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { updateUserSchema } from "./schema";

export const updateUserAction = authActionClient
  .schema(updateUserSchema)
  .metadata({
    name: "update-user",
  })
  .action(async ({ parsedInput: data, ctx: { user, supabase } }) => {
    await updateUser(supabase, data);

    revalidateTag(`user_${user.id}`);

    return user;
  });
