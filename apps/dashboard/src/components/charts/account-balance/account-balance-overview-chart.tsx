import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@midday/ui/cn";
import { useMediaQuery } from "@midday/ui/use-media-query";
import { ArrowUpRightFromSquare } from "lucide-react";
import Link from "next/link";
import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts';

interface BarChartData {
    name: string;
    value: number;
}

const barChartData: Array<BarChartData> = [
    { name: 'JAN', value: 20 },
    { name: 'FEB', value: 45 },
    { name: 'MAR', value: 35 },
    { name: 'APR', value: 50 },
    { name: 'MAY', value: 25 },
    { name: 'JUN', value: 80 },
    { name: 'JUL', value: 40 },
    { name: 'AUG', value: 45 },
    { name: 'SEP', value: 30 },
    { name: 'OCT', value: 60 },
]

interface AccountBalanceOverviewProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: Array<BarChartData>;
    className?: string;
    balance?: number;
    link?: string
}

const AccountBalanceOverview: React.FC<AccountBalanceOverviewProps> = ({
    data,
    className,
    balance,
    link
}) => {
    const dataset = data || barChartData;
    const currentBalance = balance || 86924.02;
    const isMediumScreen = useMediaQuery('(min-width: 768px)');
    const isSmallScreen = useMediaQuery('(min-width: 640px)');

    const getChartHeight = () => {
        if (isMediumScreen) return 450;
        if (isSmallScreen) return 300;
        return 300;
    };

    return (
        <Card className={cn("backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg mb-6", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Over Time</CardTitle>
                {link && (<Link href={link}>
                    <p className="text-md text-[#606060] hover:text-foreground hover:font-bold">
                        View More <ArrowUpRightFromSquare size={16} className="inline ml-2" />
                    </p>
                </Link>)}
            </CardHeader>
            <CardContent>
                {currentBalance && (
                    <div className="text-4xl font-bold">${currentBalance}</div>
                )}
                <ResponsiveContainer width="100%" height={getChartHeight()}>
                    <BarChart data={dataset}>
                        <Tooltip
                            contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '5px' }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 0, 0]} />
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#333" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#666" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export { AccountBalanceOverview };
