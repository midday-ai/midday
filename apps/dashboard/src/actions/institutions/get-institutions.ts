"use server";

import { logger } from "@/utils/logger";
import { client } from "@midday/engine/client";

type GetAccountParams = {
  countryCode: string;
  query?: string;
};

export async function getInstitutions({
  countryCode,
  query,
}: GetAccountParams) {
  try {
    const institutionsResponse = await client.institutions.$get({
      query: {
        countryCode,
        q: query,
      },
    });

    if (!institutionsResponse.ok) {
      throw new Error("Failed to get institutions");
    }

    return institutionsResponse.json();
  } catch (error) {
    logger(error instanceof Error ? error.message : String(error));
    return [];
  }
}
