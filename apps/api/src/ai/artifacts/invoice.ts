import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const invoiceArtifact = artifact(
  "invoice-canvas",
  z.object({
    stage: z.enum(["creating", "created", "updating", "updated"]),
    invoiceId: z.string(),
    version: z.number(),
    summary: z.object({
      invoiceNumber: z.string(),
      customerName: z.string(),
      amount: z.number(),
      currency: z.string(),
      lineItems: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          price: z.number(),
        }),
      ),
      dueDate: z.string(),
      status: z.string(),
    }),
  }),
);
