import { useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

export function useTransactionParams() {
  const [params, setParams] = useQueryStates({
    transactionId: parseAsString,
    createTransaction: parseAsBoolean,
    editTransaction: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
