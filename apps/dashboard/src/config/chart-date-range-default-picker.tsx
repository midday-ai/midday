import { startOfMonth, startOfYear, subMonths, subYears } from "date-fns";

export const defaultMonthlyExpenseDateRange = {
    from: subMonths(startOfMonth(new Date()), 12).toISOString(),
    to: new Date().toISOString(),
    period: "monthly",
    type: "expense" as const
};

export const defaultYearlyExpenseDateRange = {
    from: subYears(startOfYear(new Date()), 3).toISOString(),
    to: new Date().toISOString(),
    period: "yearly",
    type: "expense" as const
};

export const defaultWeeklyExpenseDateRange = {
    from: subMonths(new Date(), 3).toISOString(),
    to: new Date().toISOString(),
    period: "weekly",
    type: "expense" as const
};

export const defaultDailyExpenseDateRange = {
    from: subMonths(new Date(), 1).toISOString(),
    to: new Date().toISOString(),
    period: "daily",
    type: "expense" as const
};

export const getDefaultDateRange = (period: string, type: "expense" | "income") => {
    let defaultRange;
    switch (period) {
        case "yearly":
            defaultRange = defaultYearlyExpenseDateRange;
            break;
        case "weekly":
            defaultRange = defaultWeeklyExpenseDateRange;
            break;
        case "daily":
            defaultRange = defaultDailyExpenseDateRange;
            break;
        case "monthly":
        default:
            defaultRange = defaultMonthlyExpenseDateRange;
    }
    return { ...defaultRange, type };
};