import {
  parseAsArrayOf,
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { z } from "zod";

const lineItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export function useInvoiceParams(options?: { shallow: boolean }) {
  const [params, setParams] = useQueryStates(
    {
      invoiceId: parseAsString,
      sort: parseAsArrayOf(parseAsString),
      q: parseAsString,
      statuses: parseAsArrayOf(parseAsString),
      customers: parseAsArrayOf(parseAsString),
      start: parseAsString,
      end: parseAsString,
      selectedCustomerId: parseAsString,
      type: parseAsStringEnum(["edit", "create", "details", "comments"]),
      lineItems: parseAsJson<z.infer<typeof lineItemSchema>>(),
      currency: parseAsString,
    },
    options,
  );

  return {
    ...params,
    setParams,
  };
}
