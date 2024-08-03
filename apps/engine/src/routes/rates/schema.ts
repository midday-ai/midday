import { z } from "zod";

export const RatesSchema = z
  .object({
    data: z.array(
      z.object({
        source: z.string().openapi({
          example: "USD",
        }),
        rates: z.record(z.string(), z.number()).openapi({
          example: {
            EUR: 0.925393,
            GBP: 0.792256,
            SEK: 10.0,
            BDT: 200.0,
          },
        }),
      }),
    ),
  })

  .openapi("RatesSchema");
