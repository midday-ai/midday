import { useQueryState } from "nuqs";

export function useTransactionParams() {
  const [transactionId, setTransactionId] = useQueryState("transactionId");

  return {
    transactionId,
    setTransactionId,
  };
}
