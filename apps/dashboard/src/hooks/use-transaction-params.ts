import { useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

export function useTransactionParams() {
  const [params, setParams] = useQueryStates({
    transactionId: parseAsString,
    createTransaction: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
