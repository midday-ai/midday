"use server";

import { client } from "@midday/engine/client";
import { getSession } from "@midday/supabase/cached-queries";

export const createPluggyLinkTokenAction = async () => {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user.id) {
    throw new Error("User not found");
  }

  const pluggyResponse = await client.auth.pluggy.link.$post({
    json: {
      userId: session.user.id,
      environment: "production",
    },
  });

  if (!pluggyResponse.ok) {
    throw new Error("Failed to create pluggy link token");
  }

  const { data } = await pluggyResponse.json();

  return data.access_token;
};
