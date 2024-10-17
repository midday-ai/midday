import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/use-media-query";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SpendActivityGrowthData {
    name: string;
    growth: number;
}

const spendActivityGrowthData: Array<SpendActivityGrowthData> = [
    { name: 'Jan', growth: 5 },
    { name: 'Feb', growth: 8 },
    { name: 'Mar', growth: 12 },
    { name: 'Apr', growth: 7 },
    { name: 'May', growth: 15 },
    { name: 'Jun', growth: 10 },
]


interface AccountBalanceGrowthRateChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: Array<SpendActivityGrowthData>;
    className?: string;
    balance?: number;
    link?: string
}


const AccountBalanceGrowthRateChart: React.FC<AccountBalanceGrowthRateChartProps> = ({
    data,
    className,
    balance,
    link
}) => {
    const dataset = data || spendActivityGrowthData;
    const currentBalance = balance || 86924.02;
    const isMediumScreen = useMediaQuery('(min-width: 768px)');
    const isSmallScreen = useMediaQuery('(min-width: 640px)');

    const getChartHeight = () => {
        if (isMediumScreen) return 500;
        if (isSmallScreen) return 300;
        return 300;
    };
    
    return (
        <Card className={cn("backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Balance Growth Over Time</CardTitle>
                {link  && (<Link href={link}>
                    <p className="text-md text-[#606060] hover:text-foreground hover:font-bold">
                        View More <ArrowUpRightFromSquare size={16} className="inline ml-2" />
                    </p>
                </Link>)}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={getChartHeight()}>
                    <AreaChart data={dataset}>
                        <Tooltip
                            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="growth" stroke="url(#growthGradient)" fill="url(#growthGradient)" strokeWidth={3} />
                        <defs>
                            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#333" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#666" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export { AccountBalanceGrowthRateChart };
