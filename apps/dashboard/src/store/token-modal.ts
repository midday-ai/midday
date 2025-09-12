import { create } from "zustand";

type Data = {
  id?: string;
  name?: string;
  scopes?: string[];
};

type Type = "create" | "edit" | "delete";

interface TokenModalState {
  type?: Type;
  data?: Data;
  createdKey?: string;
  setData: (data?: Data, type?: Type) => void;
  setCreatedKey: (key?: string) => void;
}

export const useTokenModalStore = create<TokenModalState>()((set) => ({
  type: undefined,
  data: undefined,
  createdKey: undefined,
  setData: (data, type) =>
    set((state) => ({
      data,
      type,
      createdKey: type === "create" ? undefined : state.createdKey,
    })),
  setCreatedKey: (key) => set({ createdKey: key }),
}));
