import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import { addDays, format } from "date-fns";
import {
  InteractiveBarChart,
  InteractiveBarChartProps,
  InteractiveBardChartDataPoint,
} from "./interactive-bar-chart";

/**
 * A wrapper component that provides the necessary context for the AssistantModalWrapper.
 *
 * @component
 */
const AssistantProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const assistant = useAssistant({
    api: "/api/assistant", // Adjust this if your API endpoint is different
  });

  const runtime = useVercelUseAssistantRuntime(assistant);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};

export default {
  component: InteractiveBarChart,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    height: {
      control: { type: "range", min: 200, max: 600, step: 10 },
    },
    title: { control: "text" },
    description: { control: "text" },
  },
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
} as Meta;

/**
 * Generates random chart data for the InteractiveBarChart component.
 *
 * @param count - The number of data points to generate
 * @param series - An array of series names to generate data for
 * @param startDate - The start date for the data (default: current date)
 * @param endDate - The end date for the data (default: count days from start date)
 * @returns An array of ChartDataPoint objects
 */
export function generateChartData(
  count: number,
  series: string[],
  startDate: Date = new Date(),
  endDate?: Date,
): InteractiveBardChartDataPoint[] {
  const data: InteractiveBardChartDataPoint[] = [];
  const end = endDate || addDays(startDate, count - 1);

  for (let i = 0; i < count; i++) {
    const currentDate = addDays(startDate, i);
    if (currentDate > end) break;

    const dataPoint: InteractiveBardChartDataPoint = {
      date: format(currentDate, "yyyy-MM-dd"),
    };

    series.forEach((seriesName) => {
      dataPoint[seriesName] = Math.floor(Math.random() * 1000) + 1; // Random value between 1 and 1000
    });

    data.push(dataPoint);
  }

  return data;
}

const Template: StoryFn<InteractiveBarChartProps> = (
  args: JSX.IntrinsicAttributes & InteractiveBarChartProps,
) => (
  <div className="w-[900px]">
    <InteractiveBarChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  data: generateChartData(30, ["desktop", "mobile"]),
  config: {
    views: { label: "Page Views" },
    desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
    mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
  },
  title: "Interactive Bar Chart",
  description: "Showing desktop vs mobile visitors",
  height: 300,
};

export const SingleSeries = Template.bind({});
SingleSeries.args = {
  data: generateChartData(30, ["sales"]),
  config: {
    views: { label: "Sales" },
    sales: { label: "Daily Sales", color: "hsl(var(--chart-1))" },
  },
  title: "Daily Sales Chart",
  description: "Showing daily sales figures",
  height: 300,
};

export const MultipleSeries = Template.bind({});
MultipleSeries.args = {
  data: generateChartData(30, ["product1", "product2", "product3"]),
  config: {
    views: { label: "Product Sales" },
    product1: { label: "Product 1", color: "hsl(var(--chart-1))" },
    product2: { label: "Product 2", color: "hsl(var(--chart-2))" },
    product3: { label: "Product 3", color: "hsl(var(--chart-3))" },
  },
  title: "Product Comparison Chart",
  description: "Comparing sales of multiple products",
  height: 400,
};

export const CustomDateFormatter = Template.bind({});
CustomDateFormatter.args = {
  ...Default.args,
  dateFormatter: (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  },
  title: "Chart with Custom Date Formatting",
  description: "Using a custom date formatter for x-axis labels",
};

export const InteractiveFeatures: StoryFn<InteractiveBarChartProps> = (
  args: any,
) => {
  const [chartData, setChartData] = React.useState(
    generateChartData(30, ["desktop", "mobile"]),
  );

  const handleDrilldown = (startDate: string, endDate: string) => {
    const newData = generateChartData(
      15,
      ["desktop", "mobile"],
      new Date(startDate),
      new Date(endDate),
    );
    setChartData(newData);
    alert(
      `Drilled down from ${new Date(startDate).toLocaleString()} to ${new Date(endDate).toLocaleString()}`,
    );
  };

  return (
    <div className="w-[900px]">
      <InteractiveBarChart
        {...args}
        data={chartData}
        onDrilldown={handleDrilldown}
        onShare={() => alert("Sharing functionality would be implemented here")}
        onExportToModel={() =>
          alert("Export to model functionality would be implemented here")
        }
      />
    </div>
  );
};
InteractiveFeatures.args = {
  ...Default.args,
  title: "Interactive Bar Chart with Features",
  description: "Demonstrates drilldown, share, and export functionalities",
};
