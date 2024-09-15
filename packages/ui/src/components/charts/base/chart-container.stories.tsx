import { generatePayloadArray } from "../../../lib/random/generator";
import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import { ChartContainer, ChartContainerProps } from "./chart-container";

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
  component: ChartContainer,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    height: {
      control: { type: "range", min: 200, max: 600, step: 10 },
    },
    enableAssistantMode: {
      control: "boolean",
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

const Template: StoryFn<ChartContainerProps> = (
  args: JSX.IntrinsicAttributes & ChartContainerProps,
) => (
  <div className="w-[900px]">
    <ChartContainer {...args}>
      <div className="h-[290px] rounded-2xl bg-zinc-200"></div>
    </ChartContainer>
  </div>
);

export const Default = Template.bind({});
Default.args = {
  data: payloads,
  dataSet: payloads,
  setDataSet: () => {},
  height: 290,
  earliestDate: new Date("2023-01-01"),
  latestDate: new Date("2023-12-31"),
  filterDataByDateRange: () => {},
  enableAssistantMode: true,
};

export const DisabledAssistantMode = Template.bind({});
DisabledAssistantMode.args = {
  ...Default.args,
  enableAssistantMode: false,
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
  dataSet: [],
};

export const DifferentDateRange = Template.bind({});
DifferentDateRange.args = {
  ...Default.args,
  earliestDate: new Date("2022-06-01"),
  latestDate: new Date("2023-05-31"),
};

export const LargeDataSet = Template.bind({});
LargeDataSet.args = {
  ...Default.args,
  data: generatePayloadArray({ count: 100, minValue: 50, maxValue: 1000 }),
  dataSet: generatePayloadArray({ count: 100, minValue: 50, maxValue: 1000 }),
};

// Add more stories as needed for different combinations of props
