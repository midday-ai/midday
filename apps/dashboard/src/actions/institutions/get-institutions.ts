"use server";

import { engine } from "@/utils/engine";
import { logger } from "@/utils/logger";
import { InstitutionsSchema } from "@solomon-ai/financial-engine-sdk/resources/institutions";

type GetAccountParams = {
  countryCode: string;
  query?: string;
};

export async function getInstitutions({
  countryCode,
  query,
}: GetAccountParams): Promise<InstitutionsSchema> {
  try {
    return engine.institutions.list({
      countryCode: countryCode as any,
      q: query,
    });
  } catch (error) {
    logger(error instanceof Error ? error.message : String(error));
    return { data: [] };
  }
}
