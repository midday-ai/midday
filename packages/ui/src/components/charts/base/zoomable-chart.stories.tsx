import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";
import { generatePayloadArray } from "../../../lib/random/generator";

import { simulateData, ZoomableChart, ZoomableChartProps } from "./zoomable-chart";

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
    component: ZoomableChart,
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

const payloads = generatePayloadArray({
    count: 5,
    minValue: 100,
    maxValue: 500,
});

const Template: StoryFn<ZoomableChartProps> = (
    args: JSX.IntrinsicAttributes & ZoomableChartProps,
) => (
    <div className="w-[900px]">
        <ZoomableChart {...args} />
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
    title: "Events",
    dataNameKey: "events",
    description: "Events over time",
    footerDescription: "This is a footer description",
};
