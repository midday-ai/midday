import { create } from "zustand";

type Data = {
  id?: string;
  name?: string;
  scopes?: string[];
};

type Type = "edit" | "delete";

interface TokenModalState {
  type?: Type;
  data?: Data;
  setData: (data?: Data, type?: Type) => void;
}

export const useTokenModalStore = create<TokenModalState>()((set) => ({
  type: undefined,
  data: undefined,
  setData: (data, type) => set({ data, type }),
}));
