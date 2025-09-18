"use client";

import { create } from "zustand";

export type CanvasType =
  | "burn-rate-canvas"
  | "revenue-canvas"
  | "profit-canvas"
  | "expenses-canvas"
  | "runway-canvas"
  | "cash-flow-canvas"
  | "balance-sheet-canvas"
  | "category-expenses-canvas"
  | "health-report-canvas"
  | "profit-analysis-canvas"
  | "spending-canvas";

interface CanvasState {
  isVisible: boolean;
  canvasType: CanvasType;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  setCanvasType: (type: CanvasType) => void;
  showCanvas: (type: CanvasType) => void;
}

export const useCanvasState = create<CanvasState>((set) => ({
  isVisible: false,
  canvasType: "burn-rate-canvas",
  toggle: () => set((state) => ({ isVisible: !state.isVisible })),
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
  setCanvasType: (type) => set({ canvasType: type }),
  showCanvas: (type) => set({ isVisible: true, canvasType: type }),
}));
