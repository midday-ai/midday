"use server";

import Midday from "@midday-ai/engine";

const engine = new Midday();

export const exchangePublicToken = async (token: string) => {
  try {
    const { data } = await engine.auth.plaid.exchange({ token });

    return data.access_token;
  } catch (error) {
    console.log(error);

    throw Error("Something went wrong.");
  }
};
