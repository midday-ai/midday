"use server";

import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { share } from "@midday/supabase/storage";
import { action } from "./safe-action";
import { shareFileSchema } from "./schema";

export const shareFileAction = action(shareFileSchema, async (value) => {
  const supabase = createClient();
  const user = await getUser();

  const response = await share(supabase, {
    bucket: "vault",
    path: `${user.data.team_id}/${value.filepath}`,
    expireIn: value.expireIn,
    options: {
      download: true,
    },
  });

  console.log(response);

  return response?.data?.signedUrl;
});
