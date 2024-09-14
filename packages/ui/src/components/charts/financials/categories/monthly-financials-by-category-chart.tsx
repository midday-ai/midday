"use client";

import {
  CategoryMonthlyExpenditure,
  CategoryMonthlyIncome
} from "client-typescript-sdk";
import React from "react";
import { CategoryDataConverter } from "../../../../lib/converters/category-converter";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../accordion";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../select";

import { AreaChart } from "../../base/area-chart";
import { RadialChart } from "../../base/radial-chart";
import { ScatterChart } from "../../base/scatter-chart";

export interface MonthlyFinancialByCategoryChartProps {
  currency: string;
  data: Array<CategoryMonthlyExpenditure | CategoryMonthlyIncome>;
  type: "income" | "expense";
  height?: number;
  locale?: string;
  enableAssistantMode?: boolean;
  enableDrillDown?: boolean;
  disabled?: boolean;
}

// TODO: cluster by month (amount spent across months - totals)
// TODO: cluster by category (amount spent across categories - totals)
export const MonthlyFinancialByCategoryChart: React.FC<
  MonthlyFinancialByCategoryChartProps
> = ({
  currency,
  data,
  type,
  height = 290,
  locale,
  enableAssistantMode,
  enableDrillDown,
  disabled,
}) => {
  // if disabled generate data
  if (disabled) {
    data = type === "income" ?  FinancialDataGenerator.generateUserCategoryMonthlyData(1000, 2024, "income"): FinancialDataGenerator.generateUserCategoryMonthlyData(1000, 2024, "expense"); 
  }

    const getUniqueCategories = (
      data: Array<CategoryMonthlyExpenditure | CategoryMonthlyIncome>,
    ): string[] => {
      return Array.from(
        new Set(
          data
            .map((item) => item.personalFinanceCategoryPrimary)
            .filter((category): category is string => category !== undefined),
        ),
      ).sort();
    };

    // get a unique set of primary categories
    const categories = getUniqueCategories(data);

    // if there is no data, return null
    if (!data || data.length === 0 || categories.length === 0) {
      return null;
    }

    // define a state variable to store the selected category
    const [selectedCategory, setSelectedCategory] = React.useState<string>(
      categories[0] || "",
    );

    // get the data for the selected category
    const chartData = CategoryDataConverter.convertToChartDataPoints(
      data,
      selectedCategory,
      type === "income" ? "totalIncome" : "totalSpending",
    );

    const handleCategoryChange = (value: string) => {
      setSelectedCategory(value);
    };

    const title =
      type === "income"
        ? "Monthly Income By Category"
        : "Monthly Spend By Category";
    const description =
      type === "income"
        ? `Monthly income by category in ${currency}`
        : `Monthly spend by category in ${currency}`;

    const dataRecord = data[0] as
      | CategoryMonthlyIncome
      | CategoryMonthlyExpenditure;
    const monthlyTotalsAcrossAllCategories =
      CategoryDataConverter.calculateMonthlyCategoryTotals<typeof dataRecord>(
        data,
        type,
      );

    // convert to scatter chart data
    // check if the selected category exists in the monthlyTotalsAcrossAllCategories
    let scatterChartData: { x: string; y: number }[] = [];
    if (monthlyTotalsAcrossAllCategories[selectedCategory]) {
      scatterChartData = monthlyTotalsAcrossAllCategories[selectedCategory]!.map(
        (item) => {
          return {
            x: item.month,
            y: item.total,
          };
        },
      );
    }

    // compute category totals
    const categoryTotals = CategoryDataConverter.calculateCategoryTotals<
      typeof dataRecord
    >(data, type);

    // convert to radial chart data
    const radialChartData = Object.entries(categoryTotals).map(
      ([category, total]) => ({
        label: category,
        value: total,
      }),
    );

    return (
      <div className="h-full w-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <Select onValueChange={handleCategoryChange} value={selectedCategory}>
            <SelectTrigger className="mb-4 w-[180px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-none text-white shadow-none">
            <AreaChart
              currency={currency}
              data={chartData}
              height={height}
              locale={locale}
              enableAssistantMode={enableAssistantMode}
            />

            {enableDrillDown && scatterChartData.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    Drill Down On {selectedCategory} Over Time
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2">
                      <RadialChart
                        data={radialChartData}
                        height={height}
                        locale={locale}
                        enableAssistantMode={enableAssistantMode}
                        currency={currency}
                      />
                      <ScatterChart
                        currency={currency}
                        data={scatterChartData}
                        height={height}
                        locale={locale}
                        enableAssistantMode={enableAssistantMode}
                        xUNit=""
                        yUnit={currency}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </CardContent>
      </div>
    );
  };
