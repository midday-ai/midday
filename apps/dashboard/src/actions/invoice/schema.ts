import { z } from "zod";

export const deleteInvoiceSchema = z.object({
  id: z.string(),
});
