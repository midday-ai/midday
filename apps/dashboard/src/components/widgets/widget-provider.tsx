"use client";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { createStore } from "zustand/vanilla";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WidgetPreferences = RouterOutputs["widgets"]["getWidgetPreferences"];
type WidgetType = WidgetPreferences["primaryWidgets"][number];

interface WidgetState {
  // UI State
  isCustomizing: boolean;

  // Widget State
  primaryWidgets: WidgetType[];
  availableWidgets: WidgetType[];

  // Loading States
  isSaving: boolean;

  // Actions
  setIsCustomizing: (isCustomizing: boolean) => void;
  setWidgetPreferences: (preferences: WidgetPreferences) => void;

  // Widget Management
  reorderPrimaryWidgets: (newOrder: WidgetType[]) => void;
  moveToAvailable: (widgetId: WidgetType) => void;
  moveToPrimary: (widgetId: WidgetType, newPrimaryOrder: WidgetType[]) => void;
  swapWithLastPrimary: (widgetId: WidgetType, insertAtIndex: number) => void;

  // Data Actions
  setSaving: (isSaving: boolean) => void;
}

// Store factory that accepts initial preferences
export const createWidgetStore = (initialPreferences?: WidgetPreferences) => {
  const initialState = {
    isCustomizing: false,
    primaryWidgets: initialPreferences?.primaryWidgets || ([] as WidgetType[]),
    availableWidgets:
      initialPreferences?.availableWidgets || ([] as WidgetType[]),
    isSaving: false,
  };

  return createStore<WidgetState>()(
    devtools(
      (set, get) => ({
        ...initialState,

        setIsCustomizing: (isCustomizing) =>
          set({ isCustomizing }, false, "setIsCustomizing"),

        setWidgetPreferences: (preferences) =>
          set(
            {
              primaryWidgets: preferences.primaryWidgets,
              availableWidgets: preferences.availableWidgets,
            },
            false,
            "setWidgetPreferences",
          ),

        reorderPrimaryWidgets: (newOrder) => {
          if (newOrder.length > 7) {
            console.warn("Cannot have more than 7 primary widgets");
            return;
          }
          set({ primaryWidgets: newOrder }, false, "reorderPrimaryWidgets");
        },

        moveToAvailable: (widgetId) => {
          const state = get();
          const newPrimaryWidgets = state.primaryWidgets.filter(
            (w) => w !== widgetId,
          );
          const newAvailableWidgets = [...state.availableWidgets, widgetId];

          set(
            {
              primaryWidgets: newPrimaryWidgets,
              availableWidgets: newAvailableWidgets,
            },
            false,
            "moveToAvailable",
          );
        },

        moveToPrimary: (
          widgetId: WidgetType,
          newPrimaryOrder: WidgetType[],
        ) => {
          const state = get();
          const newAvailableWidgets = state.availableWidgets.filter(
            (w) => w !== widgetId,
          );

          set(
            {
              primaryWidgets: newPrimaryOrder,
              availableWidgets: newAvailableWidgets,
            },
            false,
            "moveToPrimary",
          );
        },

        swapWithLastPrimary: (widgetId: WidgetType, insertAtIndex: number) => {
          const state = get();
          if (state.primaryWidgets.length < 7) {
            console.warn("Swap only needed when primary is full");
            return;
          }

          // Remove the last primary widget and the widget from available
          const lastPrimaryWidget =
            state.primaryWidgets[state.primaryWidgets.length - 1];
          if (!lastPrimaryWidget) {
            console.warn("No last primary widget found");
            return;
          }

          const newPrimaryWidgets = [...state.primaryWidgets.slice(0, -1)];
          const newAvailableWidgets = [
            ...state.availableWidgets.filter((w) => w !== widgetId),
            lastPrimaryWidget,
          ];

          // Insert the new widget at the specified position
          newPrimaryWidgets.splice(insertAtIndex, 0, widgetId);

          set(
            {
              primaryWidgets: newPrimaryWidgets,
              availableWidgets: newAvailableWidgets,
            },
            false,
            "swapWithLastPrimary",
          );
        },

        setSaving: (isSaving) => set({ isSaving }, false, "setSaving"),
      }),
      {
        name: "widget-store",
      },
    ),
  );
};

// Context for the store
export type WidgetStoreApi = ReturnType<typeof createWidgetStore>;

export const WidgetStoreContext = createContext<WidgetStoreApi | undefined>(
  undefined,
);

// Provider component
export interface WidgetProviderProps {
  children: ReactNode;
  initialPreferences: WidgetPreferences;
}

export const WidgetProvider = ({
  children,
  initialPreferences,
}: WidgetProviderProps) => {
  const storeRef = useRef<WidgetStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createWidgetStore(initialPreferences);
  }

  return (
    <WidgetStoreContext.Provider value={storeRef.current}>
      {children}
    </WidgetStoreContext.Provider>
  );
};

// Hook to use the store
export const useWidgetStore = <T,>(selector: (store: WidgetState) => T): T => {
  const storeContext = useContext(WidgetStoreContext);

  if (!storeContext) {
    throw new Error("useWidgetStore must be used within WidgetProvider");
  }

  return useStore(storeContext, selector);
};

// Selector hooks
export const useIsCustomizing = () =>
  useWidgetStore((state) => state.isCustomizing);

export const usePrimaryWidgets = () =>
  useWidgetStore((state) => state.primaryWidgets);

export const useAvailableWidgets = () =>
  useWidgetStore((state) => state.availableWidgets);

export const useWidgetActions = () =>
  useWidgetStore(
    useShallow((state) => ({
      setIsCustomizing: state.setIsCustomizing,
      setWidgetPreferences: state.setWidgetPreferences,
      reorderPrimaryWidgets: state.reorderPrimaryWidgets,
      moveToAvailable: state.moveToAvailable,
      moveToPrimary: state.moveToPrimary,
      swapWithLastPrimary: state.swapWithLastPrimary,
      setSaving: state.setSaving,
    })),
  );
