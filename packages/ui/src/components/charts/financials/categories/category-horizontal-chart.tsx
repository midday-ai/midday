import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../card";
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer as RechartsChartContainer,
} from "../../../chart";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from "recharts";
const chartConfig = {
  desktop: {
    label: "Category",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const CategoryChart: React.FC<{
  data: Array<{ category: string; value: number }>;
  title: string;
  description: string;
}> = ({ data, title, description }) => {
  return (
    <Card className="border-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <RechartsChartContainer config={chartConfig}>
          <RechartsBarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" dataKey="value" hide />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              tickMargin={2}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" fill="var(--color-desktop)" radius={5} />
          </RechartsBarChart>
        </RechartsChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing totals for the few months
        </div>
      </CardFooter>
    </Card>
  );
};
