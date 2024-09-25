import { startOfMonth, subMonths } from "date-fns";
import { create } from "zustand";

interface IncomeViewState {
    isOpen: boolean;
    dateRange: {
        from: string;
        to: string;
    };
    period: "monthly" | "quarterly" | "yearly";
    setOpen: (isOpen: boolean) => void;
    setDateRange: (from: string, to: string) => void;
    setPeriod: (period: "monthly" | "quarterly" | "yearly") => void;
}

const defaultDateRange = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
};

export const useIncomeViewStore = create<IncomeViewState>()((set) => ({
    isOpen: false,
    dateRange: defaultDateRange,
    period: "monthly",
    setOpen: (isOpen) => set({ isOpen }),
    setDateRange: (from, to) => set({ dateRange: { from, to } }),
    setPeriod: (period) => set({ period }),
}));
