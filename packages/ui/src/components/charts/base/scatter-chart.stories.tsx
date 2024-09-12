import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import { ScatterChart, ScatterChartProps } from "./scatter-chart";

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
  component: ScatterChart,
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

const payloads = [
  { x: 30, y: 20 },
  { x: 50, y: 180 },
  { x: 75, y: 240 },
  { x: 100, y: 100 },
  { x: 120, y: 190 },
];

const Template: StoryFn<ScatterChartProps> = (
  args: JSX.IntrinsicAttributes & ScatterChartProps,
) => (
  <div className="w-[900px]">
    <ScatterChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  currency: "USD",
  data: payloads.map(point => ({ x: point.x.toString(), y: point.y })),
  height: 290,
  locale: "en-US",
  enableAssistantMode: true,
  yUnit: "USD",
};

export const EuroChart = Template.bind({});
EuroChart.args = {
  ...Default.args,
  currency: "EUR",
  enableAssistantMode: true,
};

export const LargeDataset = Template.bind({});
LargeDataset.args = {
  ...Default.args,
  data: payloads.map(point => ({ x: point.x.toString(), y: point.y })),
};

export const SmallHeight = Template.bind({});
SmallHeight.args = {
  ...Default.args,
  height: 200,
};

export const LargeHeight = Template.bind({});
LargeHeight.args = {
  ...Default.args,
  height: 500,
};

export const VolatileData = Template.bind({});
VolatileData.args = {
  ...Default.args,
  data: payloads.map(point => ({ x: point.x.toString(), y: point.y })),
};

export const SingleDataPoint = Template.bind({});
SingleDataPoint.args = {
  ...Default.args,
  data: payloads.map(point => ({ x: point.x.toString(), y: point.y })),
};

export const EmptyDataset = Template.bind({});
EmptyDataset.args = {
  ...Default.args,
  data: [],
};

export const Disabled = Template.bind({});
Disabled.args = {
  ...Default.args,
  disabled: true,
};