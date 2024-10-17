"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { AccountBalanceGrowthRateChart } from "./account-balance-growth-rate-chart";
import { AccountBalanceOverview } from "./account-balance-overview-chart";

interface AccountBalanceSummaryChartsProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    link?: string;
    accountId?: string;
}

const AccountBalanceSummaryCharts: React.FC<AccountBalanceSummaryChartsProps> = ({
    className,
    link,
    accountId
}) => {

    return (
        <>
            <Tabs defaultValue="balance" className={className}>
                <TabsList className="w-fit">
                    <TabsTrigger value="balance" className="rounded-2xl">Balance</TabsTrigger>
                    <TabsTrigger value="balance-growth-rate" className="rounded-2xl">Balance Growth Rate</TabsTrigger>
                </TabsList>
                <TabsContent value="balance">
                    <AccountBalanceOverview className="border-none shadow-none" link={link} />
                </TabsContent>
                <TabsContent value="balance-growth-rate">
                    <AccountBalanceGrowthRateChart className="border-none shadow-none" link={link} />
                </TabsContent>
            </Tabs>
        </>
    )
}

export { AccountBalanceSummaryCharts };
