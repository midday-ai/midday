"use server";

import Midday from "@midday-ai/engine";
import { authActionClient } from "../safe-action";

const engine = new Midday();

export const createPlaidLinkTokenAction = authActionClient.action(async () => {
  console.log("here");

  return;

  //   try {
  //     const {
  //       data: { session },
  //     } = await getSession();

  //     const { data } = await engine.auth.plaid.link({
  //       userId: session?.user.id,
  //     });

  //     console.log(data.link_token);

  //     return data.link_token;
  //   } catch (error) {
  //     console.log(error);

  //     throw Error("Something went wrong.");
  //   }
});
