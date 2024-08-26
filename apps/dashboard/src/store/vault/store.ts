import { createContext } from "react";
import { createStore } from "zustand";

type Item = {
  id?: string;
  name: string;
  isFolder?: boolean;
  isEditing?: boolean;
};

export interface VaultProps {
  data: Item[];
}

export interface VaultState extends VaultProps {
  addItems: (items: Item[]) => void;
  deleteItem: (id: string) => void;
  createFolder: (item: Item) => void;
  updateItem: (id: string, payload: Item) => void;
}

export type VaultStore = ReturnType<typeof createVaultStore>;
export const VaultContext = createContext<VaultStore | null>(null);

export const createVaultStore = (initProps?: Partial<VaultProps>) => {
  const DEFAULT_PROPS: VaultProps = {
    data: [],
  };

  return createStore<VaultState>()((set, get) => ({
    ...DEFAULT_PROPS,
    ...initProps,

    addItems: (items) => {
      set((state) => ({
        data: [...state.data, ...items],
      }));
    },

    deleteItem: (id) => {
      set((state) => ({
        data: state.data.filter((item) =>
          item.isFolder ? item.name !== id : item.id !== id,
        ),
      }));
    },

    createFolder: (item) => {
      set((state) => ({
        data: [
          ...state.data,
          {
            ...item,
            isEditing: true,
            isFolder: true,
            id: item.name,
          },
        ],
      }));
    },

    updateItem: (id, payload) => {
      set((state) => ({
        data: state.data.map((d) => (d.id === id ? payload : d)),
      }));
    },
  }));
};
