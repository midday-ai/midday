import { z } from "zod";

export const deleteCustomerTagSchema = z.object({
  tagId: z.string(),
  customerId: z.string(),
});

export const createCustomerTagSchema = z.object({
  tagId: z.string(),
  customerId: z.string(),
});
