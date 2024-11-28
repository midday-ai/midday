"use server";

import { z } from "zod";
import { authActionClient } from "./safe-action";

const ENDPOINT = "https://api.vatcheckapi.com/v2/check";

export const validateVatNumberAction = authActionClient
  .schema(
    z.object({
      vat_number: z.string().min(7),
      country_code: z.string(),
    }),
  )
  .metadata({
    name: "validate-vat-number",
  })
  .action(async ({ parsedInput: { vat_number, country_code } }) => {
    const response = await fetch(
      `${ENDPOINT}?vat_number=${vat_number}&country_code=${country_code}&apikey=${process.env.VATCHECKAPI_API_KEY}`,
      {
        method: "GET",
      },
    );

    const data = await response.json();

    return data;
  });
