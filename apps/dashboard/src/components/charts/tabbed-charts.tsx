"use client"

import CardWrapper from "@/components/card/card-wrapper";
import { AreaChart } from "@midday/ui/charts/base/area-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import React from 'react';

interface TabbedChartsProps {
  currency: string;
}

const TabbedCharts: React.FC<TabbedChartsProps> = ({ currency }) => {
  return (
    <Tabs defaultValue="overview" className="w-full py-[2.5%]">
      <TabsList className="flex justify-start space-x-2 rounded-2xl p-2 mb-6 w-fit mr-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardWrapper 
              title="Profit" 
              titleDescription="Year-to-date"
              description="Overview of your company's profit performance"
              subtitle="Total Profit"
              subtitleDescription="Compared to previous year"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Cash Flow" 
              titleDescription="Weekly"
              description="Weekly cash flow trends"
              subtitle="Net Cash Flow"
              subtitleDescription="This week"
              className="border-none"
          >
            <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Revenue Growth" 
              titleDescription="Year-over-Year"
              description="Annual revenue growth rate"
              subtitle="Growth Rate"
              subtitleDescription="Compared to previous year"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Profit Margin" 
              titleDescription="Monthly"
              description="Monthly profit margin trends"
              subtitle="Average Margin"
              subtitleDescription="Last 6 months"
              className="border-none"
          >
            <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
        </div>
      </TabsContent>
      <TabsContent value="income">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardWrapper 
              title="Monthly Income" 
              titleDescription="Last 12 months"
              description="Overview of monthly income trends"
              subtitle="Total Income"
              subtitleDescription="This month vs last month"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Income by Category" 
              titleDescription="Current year"
              description="Breakdown of income sources"
              subtitle="Top Category"
              subtitleDescription="Highest income source"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Income Growth Rate" 
              titleDescription="Year-over-Year"
              description="Annual income growth trends"
              subtitle="Growth Rate"
              subtitleDescription="Compared to previous year"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Recurring Revenue" 
              titleDescription="Monthly"
              description="Stable income from recurring sources"
              subtitle="MRR"
              subtitleDescription="Monthly Recurring Revenue"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Income Seasonality" 
              titleDescription="Last 3 years"
              description="Seasonal patterns in income"
              subtitle="Peak Season"
              subtitleDescription="Highest income period"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Customer Segments" 
              titleDescription="By revenue"
              description="Income distribution across customer types"
              subtitle="Top Segment"
              subtitleDescription="Highest revenue segment"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Average Transaction Value" 
              titleDescription="Monthly trend"
              description="Changes in average transaction size"
              subtitle="ATV"
              subtitleDescription="This month vs last month"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Income Forecast" 
              titleDescription="Next 6 months"
              description="Projected income based on current trends"
              subtitle="Forecast Total"
              subtitleDescription="Estimated future income"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
        </div>
      </TabsContent>
      <TabsContent value="expenses">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardWrapper 
              title="Monthly Expenses" 
              titleDescription="Last 12 months"
              description="Overview of monthly expense trends"
              subtitle="Total Expenses"
              subtitleDescription="This month vs last month"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Expenses by Category" 
              titleDescription="Current year"
              description="Breakdown of expense categories"
              subtitle="Top Category"
              subtitleDescription="Highest expense category"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Fixed vs Variable Expenses" 
              titleDescription="Monthly comparison"
              description="Ratio of fixed to variable costs"
              subtitle="Fixed Expenses"
              subtitleDescription="Percentage of total expenses"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Expense Growth Rate" 
              titleDescription="Year-over-Year"
              description="Annual expense growth trends"
              subtitle="Growth Rate"
              subtitleDescription="Compared to previous year"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Operational Efficiency" 
              titleDescription="Expenses to Revenue Ratio"
              description="Expense efficiency over time"
              subtitle="Efficiency Ratio"
              subtitleDescription="Current vs target ratio"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Expense Seasonality" 
              titleDescription="Last 3 years"
              description="Seasonal patterns in expenses"
              subtitle="Peak Season"
              subtitleDescription="Highest expense period"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Cost Savings" 
              titleDescription="Year-to-date"
              description="Realized savings from cost-cutting measures"
              subtitle="Total Savings"
              subtitleDescription="Compared to budget"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
          <CardWrapper 
              title="Expense Forecast" 
              titleDescription="Next 6 months"
              description="Projected expenses based on current trends"
              subtitle="Forecast Total"
              subtitleDescription="Estimated future expenses"
              className="border-none"
          >
              <AreaChart currency={currency} data={[]} height={300} />
          </CardWrapper>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TabbedCharts;