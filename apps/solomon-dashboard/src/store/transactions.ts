import { create } from "zustand";

interface TransactionsState {
  transactionIds: string[];
  canDelete?: boolean;
  columns: string[];
  setColumns: (columns?: string[]) => void;
  setCanDelete: (canDelete?: boolean) => void;
  setTransactionIds: (transactionIds?: string[]) => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactionIds: [],
  columns: [],
  canDelete: false,
  setCanDelete: (canDelete) => set({ canDelete }),
  setColumns: (columns) => set({ columns }),
  setTransactionIds: (transactionIds) => set({ transactionIds }),
}));
