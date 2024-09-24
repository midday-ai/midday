import { ChartSelectors } from "@/components/charts/chart-selectors";
import { EmptyState } from "@/components/charts/empty-state";
import Tier from "@/config/tier";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { IncomeChartWrapper } from "../chart-wrappers/income-chart-wrapper";

type IncomeSectionProps = {
    isEmpty: boolean;
    accounts: any;
    user: any;
    tier: Tier;
    value: any;
    defaultValue: any;
    description: string;
    type: "income" | "profit";
    enableGrowthRate?: boolean;
};

export function IncomeSection({ isEmpty, accounts, user, tier, value, defaultValue, description, type, enableGrowthRate }: IncomeSectionProps) {
    return (
        <>
            {isEmpty && <EmptyState />}
            <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
                {accounts?.data?.length && (
                    <Card className="border-4 border-gray-100 p-[3%] shadow-md">
                        <CardHeader className="flex flex-col gap-2">
                            <CardTitle className="font-bold text-2xl md:text-4xl">{
                                type === "income" ? "Income" : "Net Income"
                            }</CardTitle>
                            <CardDescription className="max-w-xl">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 p-[1%]">
                            <ChartSelectors defaultValue={defaultValue} disableTypeSelector={true} />
                            <IncomeChartWrapper
                                tier={tier}
                                teamId={user?.data?.team_id ?? ""}
                                currency={accounts.data[0]?.currency ?? "USD"}
                                userId={user?.data?.id ?? ""}
                                value={{
                                    from: (value.from as string) ?? defaultValue.from,
                                    to: (value.to as string) ?? defaultValue.to,
                                    period: defaultValue.period
                                }}
                                type={type}
                                enableGrowthRate={enableGrowthRate}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}