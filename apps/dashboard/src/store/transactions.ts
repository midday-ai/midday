import { create } from "zustand";

interface TransactionsState {
  transactionIds: string[];
  columns: string[];
  setColumns: (columns?: string[]) => void;
  setTransactionIds: (transactionIds?: string[]) => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactionIds: [],
  columns: [],
  setColumns: (columns) => set({ columns }),
  setTransactionIds: (transactionIds) => set({ transactionIds }),
}));
