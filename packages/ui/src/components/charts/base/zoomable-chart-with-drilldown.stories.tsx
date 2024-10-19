import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import {
  simulateData,
  ZoomableChartWithDrilldown,
  ZoomableChartWithDrilldownProps,
} from "./zoomable-chart-with-drilldown";

import { generatePayloadArray } from "../../../lib/random/generator";

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
  component: ZoomableChartWithDrilldown,
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
    chartType: {
      control: {
        type: "select",
        options: ["area", "bar", "line"],
      },
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

const Template: StoryFn<ZoomableChartWithDrilldownProps> = (
  args: JSX.IntrinsicAttributes & ZoomableChartWithDrilldownProps,
) => (
  <div className="w-[900px]">
    <ZoomableChartWithDrilldown {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  data: simulateData(),
  title: "Events",
  dataNameKey: "events",
  description: "Events over time",
};

export const EuroChart = Template.bind({});
EuroChart.args = {
  ...Default.args,
  title: "Events in Europe",
  dataNameKey: "events",
  description: "Events over time in Europe",
  footerDescription: "This is a footer description for Euro events",
};

export const LineChart = Template.bind({});
LineChart.args = {
  ...Default.args,
  title: "Events (Line Chart)",
  dataNameKey: "events",
  description: "Events over time displayed as a line chart",
  footerDescription: "This is a footer description for the line chart",
  chartType: "line",
};

export const BarChart = Template.bind({});
BarChart.args = {
  ...Default.args,
  title: "Events (Bar Chart)",
  dataNameKey: "events",
  description: "Events over time displayed as a bar chart",
  footerDescription: "This is a footer description for the bar chart",
  chartType: "bar",
};

export const InteractiveFeatures: StoryFn<ZoomableChartWithDrilldownProps> = (
  args: any,
) => {
  const [zoomedData, setZoomedData] = React.useState<any[]>(simulateData());
  const [drilldownInfo, setDrilldownInfo] = React.useState<string | null>(null);

  const handleDrilldown = (start: string, end: string) => {
    const newData = simulateData(start, end);
    setZoomedData(newData);
    setDrilldownInfo(
      `Drilled down from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}`,
    );
  };

  return (
    <div className="w-[900px]">
      <ZoomableChartWithDrilldown
        {...args}
        data={zoomedData}
        onDrilldown={handleDrilldown}
        onShare={() => alert("Sharing functionality would be implemented here")}
        onExportToModel={() =>
          alert("Export to model functionality would be implemented here")
        }
      />
      {drilldownInfo && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">{drilldownInfo}</div>
      )}
    </div>
  );
};
InteractiveFeatures.args = {
  ...Default.args,
  title: "Interactive ZoomableChartWithDrilldown",
  description: "Demonstrates drilldown, share, and export functionalities",
};
