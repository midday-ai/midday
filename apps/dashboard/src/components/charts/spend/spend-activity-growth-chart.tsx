import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SpendActivityGrowthChart() {
    return (
        <Card className="backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg">
            <CardHeader>
                <CardTitle>Spend Activity Growth</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={spendActivityGrowthData}>
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