import { createContext } from "react";
import { createStore } from "zustand";

type Item = {
  id?: string;
  name?: string;
  tag?: string;
  isFolder?: boolean;
  isEditing?: boolean;
  isLoading?: boolean;
};

export interface WorkspaceProps {
  data: Item[];
}

export interface WorkspaceState extends WorkspaceProps {
  deleteItem: (id: string) => void;
  createFolder: (item: Item) => void;
  updateItem: (id: string, payload: Item) => void;
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>;
export const WorkspaceContext = createContext<WorkspaceStore | null>(null);

const DEFAULT_PROPS: WorkspaceProps = {
  data: [],
};

export const createWorkspaceStore = (initProps?: Partial<WorkspaceProps>) => {
  return createStore<WorkspaceState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,

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
      set((state) => {
        return {
          data: state.data.map((d) => (d.id === id ? { ...d, ...payload } : d)),
        };
      });
    },
  }));
};
