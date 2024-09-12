import { generatePayloadArray } from "../../../lib/random/generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import { BarChart, BarChartProps } from "./bar-chart";

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
  component: BarChart,
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
    enableAssistantMode: {
      control: "boolean",
    },
    locale: {
      control: "select",
      options: ["en-US", "de-DE", "fr-FR", "ja-JP"],
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

const payloads = generatePayloadArray({
  count: 5,
  minValue: 100,
  maxValue: 500,
});

const Template: StoryFn<BarChartProps> = (
  args: JSX.IntrinsicAttributes & BarChartProps,
) => (
  <div className="w-[900px]">
    <BarChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  data: payloads,
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
};

export const DisabledAssistantMode = Template.bind({});
DisabledAssistantMode.args = {
  ...Default.args,
  enableAssistantMode: false,
};

export const EuroChart = Template.bind({});
EuroChart.args = {
  ...Default.args,
  currency: "EUR",
  locale: "de-DE",
};

export const CustomHeight = Template.bind({});
CustomHeight.args = {
  ...Default.args,
  height: 400,
};

export const EmptyData = Template.bind({});
EmptyData.args = {
  ...Default.args,
  data: [],
};

export const LargeDataSet = Template.bind({});
LargeDataSet.args = {
  ...Default.args,
  data: generatePayloadArray({ count: 100, minValue: 50, maxValue: 1000 }),
};

export const JapaneseLocale = Template.bind({});
JapaneseLocale.args = {
  ...Default.args,
  currency: "JPY",
  locale: "ja-JP",
};

export const SingleDataPoint = Template.bind({});
SingleDataPoint.args = {
  ...Default.args,
  data: payloads[0] ? [payloads[0]] : [],
};

export const VolatileData = Template.bind({});
VolatileData.args = {
  ...Default.args,
  data: generatePayloadArray({ count: 10, minValue: 10, maxValue: 1000 }),
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
};
// Add more stories as needed for different combinations of props
