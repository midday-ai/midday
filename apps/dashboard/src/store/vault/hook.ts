import { useContext } from "react";
import { useStore } from "zustand";
import { VaultContext, type VaultState } from "./store";

export function useVaultContext<T>(selector: (state: VaultState) => T): T {
  const store = useContext(VaultContext);

  if (!store) {
    throw new Error("Missing VaultContext.Provider in the tree");
  }

  return useStore(store, selector);
}
