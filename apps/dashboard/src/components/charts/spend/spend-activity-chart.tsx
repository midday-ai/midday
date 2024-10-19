import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import React from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

/** Data structure for spend activity */
interface SpendActivityData {
  name: string;
  spend: number;
  revenue: number;
}

const spendActivityData: SpendActivityData[] = [
  { name: "Week 1", spend: 1000, revenue: 1200 },
  { name: "Week 2", spend: 1500, revenue: 1800 },
  { name: "Week 3", spend: 1200, revenue: 1600 },
  { name: "Week 4", spend: 1800, revenue: 2000 },
];

/**
 * SpendActivityChart component
 *
 * Renders a line chart displaying spend and revenue activity over time.
 *
 * @returns {JSX.Element} The rendered SpendActivityChart component
 */
export default function SpendActivityChart(): JSX.Element {
  return (
    <div>
      <Card className="backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Spend Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendActivityData}>
              <Tooltip
                contentStyle={{
                  background: "rgba(0,0,0,0.8)",
                  border: "none",
                  borderRadius: "5px",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="url(#spendGradient)"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueGradient)"
                strokeWidth={3}
                dot={false}
              />
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#333" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#666" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#666" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#999" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Cash Flow */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash flow</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$6,528.21</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/30 border border-gray-200 rounded-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">View more</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,453.43</div>
            <p className="text-xs text-muted-foreground">+4% vs last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
