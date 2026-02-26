import { useQueryStates } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

const reconciliationParamsSchema = {
  transactionId: parseAsString,
};

export function useReconciliationParams() {
  const [params, setParams] = useQueryStates(reconciliationParamsSchema);

  return {
    transactionId: params.transactionId,
    setTransactionId: (id: string | null) =>
      setParams({ transactionId: id }),
  };
}

export const loadReconciliationParams = createLoader(
  reconciliationParamsSchema,
);
