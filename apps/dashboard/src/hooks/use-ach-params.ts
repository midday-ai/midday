import { useQueryStates } from "nuqs";
import { createLoader, parseAsBoolean, parseAsString } from "nuqs/server";

const achParamsSchema = {
  batchId: parseAsString,
  createBatch: parseAsBoolean,
};

export function useAchParams() {
  const [params, setParams] = useQueryStates(achParamsSchema);

  return {
    batchId: params.batchId,
    createBatch: params.createBatch ?? false,
    setBatchId: (id: string | null) => setParams({ batchId: id }),
    setCreateBatch: (value: boolean | null) =>
      setParams({ createBatch: value }),
  };
}

export const loadAchParams = createLoader(achParamsSchema);
