import React from "react";
import { JSX } from "react/jsx-runtime";
import { LocationFinancialMetricsConverter } from "../../../../lib/converters/location-sub-profile-converter";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";

import {
  LocationSeasonalTrendsChart
} from "./location-seasonal-trends-chart";
import {
  RankedLocationsBySpendingChart,
  RankedLocationsBySpendingChartProps,
} from "./ranked-location-by-spending-chart";

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
  component: LocationSeasonalTrendsChart,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    currency: {
      control: "select",
      options: ["USD", "EUR", "GBP", "JPY"],
    },
    height: {
      control: { type: "range", min: 200, max: 600, step: 10 },
    },
  },
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
} as Meta;

const data =
  FinancialDataGenerator.generateRandomLocationMetricsFinancialSubProfile(
    150,
    2023,
  );
const cities = LocationFinancialMetricsConverter.getUniqueCities(data);

const Template: StoryFn<RankedLocationsBySpendingChartProps> = (
  args: JSX.IntrinsicAttributes & RankedLocationsBySpendingChartProps,
) => (
  <div className="w-[900px]">
    <RankedLocationsBySpendingChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  records: data,
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
  selectedSpendingPeriod: "spentLastTwoWeeks",
};

export const Chart = Template.bind({});
Chart.args = {
  ...Default.args,
  records: data,
  currency: "USD",
  selectedSpendingPeriod: "spentLastTwoWeeks",
};
