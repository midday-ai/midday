import { useEffect, useState } from "react";

/**
 * A custom hook that subscribes to a store and returns the latest data.
 *
 * @template T The type of the entire store state.
 * @template F The type of the returned data from the callback.
 *
 * @param store A function that subscribes to the store and accepts a callback.
 * @param callback A function that selects and returns the desired data from the store state.
 *
 * @returns The latest data selected by the callback, or undefined if not yet available.
 */
export const useStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
) => {
  const result = store(callback) as F;
  const [data, setData] = useState<F>();

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
};
