import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";

export function useJobParams() {
  const [params, setParams] = useQueryStates({
    jobId: parseAsString,
    queueName: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
