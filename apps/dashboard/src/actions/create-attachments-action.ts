"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createAttachments } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { revalidateTag } from "next/cache";
import { action } from "./safe-action";
import { createAttachmentsSchema } from "./schema";

export const createAttachmentsAction = action(
  createAttachmentsSchema,
  async (files) => {
    const supabase = createClient();
    const user = await getUser();
    const data = await createAttachments(supabase, files);

    revalidateTag(`transactions_${user.data.team_id}`);

    return data;
  },
);
