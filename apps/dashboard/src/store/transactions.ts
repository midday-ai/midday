"use client";

import { create } from "zustand";

type Store = {
  rowSelection: any;
  setRowSelecton: (rowSelection: any) => void;
};

export const useTransactionsStore = create<Store>((set, get) => ({
  rowSelection: {},
  setRowSelecton: (fn) => {
    const item = fn();

    // console.log(Object.keys(item).at(0));

    // if (get().rowSelection.hasOwnProperty(`${Object.keys(item).at(0)}`)) {
    //   console.log("the key exists on the object");
    // }

    // console.log(item, get().rowSelection);
    // console.log(
    //   get().rowSelection.hasOwnProperty(`${Object.keys(item).at(0)}`),
    // );

    return set((state) => ({
      rowSelection: { ...state.rowSelection, ...item },
    }));
  },
}));
