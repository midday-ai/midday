"use client";

import { VaultContext, VaultProps, createVaultStore } from "./store";

type VaultProviderProps = React.PropsWithChildren<VaultProps>;

export function VaultProvider({ children, ...props }: VaultProviderProps) {
  return (
    <VaultContext.Provider value={createVaultStore(props)}>
      {children}
    </VaultContext.Provider>
  );
}
