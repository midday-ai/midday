import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import type { ProviderParams } from "@/providers/types";
import { contryCodes } from "@/utils/countries";
import type { Env } from "hono";

export async function syncInstitutions(env: Env) {
  const gocardless = new GoCardLessApi();

  const intitutions = await gocardless.getInstitutions();

  contryCodes.map((countrCode) => {});
}
