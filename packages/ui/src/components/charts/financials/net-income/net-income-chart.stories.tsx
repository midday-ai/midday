import { NetIncomeChart, NetIncomeChartProps } from "../../../../components/charts/financials/net-income/net-income-chart";
import { FinancialDataGenerator } from "../../../../lib/random/financial-data-generator";
import AssistantProviderWrapper from "../../../../wrapper/assistant-provider-wrapper";
import { Meta, StoryFn } from "@storybook/react";

const incomeMetricsData = FinancialDataGenerator.generateIncomeMetricsAcrossManyYears(
    2022,
    2024,
);

export default {
    component: NetIncomeChart,
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

const Template: StoryFn<NetIncomeChartProps> = (
    args: JSX.IntrinsicAttributes & NetIncomeChartProps,
) => (
    <div className="w-[900px]">
        <NetIncomeChart {...args} />
    </div>
);

export const Default = Template.bind({});
Default.args = {
    currency: "USD",
    height: 290,
    locale: "en-US",
    enableAssistantMode: true,
    title: "Net income",
    viewMoreHref: "/net-income",
    price: 1000,
    priceChange: 10,
    incomeMetrics: incomeMetricsData,
};

export const EuroVersion = Template.bind({});
EuroVersion.args = {
    ...Default.args,
    currency: "EUR",
    locale: "de-DE",
    title: "Nettoeinkommen",
    price: 850,
    priceChange: 5,
};

export const JapaneseVersion = Template.bind({});
JapaneseVersion.args = {
    ...Default.args,
    currency: "JPY",
    locale: "ja-JP",
    title: "純利益",
    price: 110000,
    priceChange: 3,
};

export const NegativeChange = Template.bind({});
NegativeChange.args = {
    ...Default.args,
    price: 900,
    priceChange: -5,
};

export const LargeDataset = Template.bind({});
LargeDataset.args = {
    ...Default.args,
    height: 400,
};

export const DisabledChart = Template.bind({});
DisabledChart.args = {
    ...Default.args,
    disabled: true,
};

export const WithoutAssistantMode = Template.bind({});
WithoutAssistantMode.args = {
    ...Default.args,
    enableAssistantMode: false,
};

export const WithComparison = Template.bind({});
WithComparison.args = {
    ...Default.args,
    enableComparison: true,
};

export const CustomStyling = Template.bind({});
CustomStyling.args = {
    ...Default.args,
    className: "bg-gray-100 shadow-lg rounded-xl",
};
