"use server";

import { engine } from "@/utils/engine";
import { logger } from "@/utils/logger";

type GetAccountParams = {
  countryCode: string;
  query?: string;
};

export async function getInstitutions({
  countryCode,
  query,
}: GetAccountParams) {
  try {
    return engine.institutions.list({
      countryCode,
      q: query,
    });
  } catch (error) {
    logger(error instanceof Error ? error.message : String(error));
    return [];
  }
}
