"use client";

import { create } from "zustand";

type Store = {
  rowSelection: any;
  setRowSelecton: (rowSelection: any) => void;
  isSomeRowsSelected: boolean;
};

type PrevState = {};

export const useTransactionsStore = create<Store>((set) => ({
  rowSelection: {},
  isSomeRowsSelected: false,
  setRowSelecton: (fn: (prev: PrevState) => PrevState) => {
    return set((state) => {
      const rowSelection = fn(state.rowSelection);

      return {
        rowSelection,
        isSomeRowsSelected: !!Object.keys(rowSelection).length,
      };
    });
  },
}));
