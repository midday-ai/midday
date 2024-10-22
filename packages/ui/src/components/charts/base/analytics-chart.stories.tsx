import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AnalyticsChart } from './analytics-chart';

const meta: Meta<typeof AnalyticsChart> = {
    component: AnalyticsChart,
    parameters: {
        layout: 'centered',
    },
    argTypes: {
        chartType: {
            control: 'select',
            options: ['line', 'bar', 'area'],
        },
        stacked: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof AnalyticsChart>;

// Template for the stories
const Template: Story = {
    render: (args) => (
        <div className="w-[900px]">
            <AnalyticsChart {...args} />
        </div>
    ),
};

const generateSampleData = (days: number) => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const basePrice = 100 + Math.random() * 50;
        data.push({
            date: date.toISOString().split('T')[0] || '',
            expense: basePrice,
            revenue: basePrice + Math.random() * 5,
            profit: basePrice - Math.random() * 5,
        });
    }
    return data;
};

export const LineChart: Story = {
    ...Template,
    args: {
        chartData: generateSampleData(90),
        title: 'Financial Performance',
        description: 'Interactive financial chart for the last 3 months',
        dataKeys: ['revenue', 'expense', 'profit'],
        colors: ['#4CAF50', '#FFA000', '#2196F3'],
        trendKey: 'revenue',
        chartType: 'line',
    },
};

export const BarChart: Story = {
    ...Template,
    args: {
        ...LineChart.args,
        chartType: 'bar',
        title: 'Financial Performance (Bar Chart)',
    },
};

export const AreaChart: Story = {
    ...Template,
    args: {
        ...LineChart.args,
        chartType: 'area',
        title: 'Financial Performance (Area Chart)',
    },
};

export const StackedBarChart: Story = {
    ...Template,
    args: {
        ...BarChart.args,
        stacked: true,
        title: 'Stacked Financial Performance',
    },
};

export const StackedAreaChart: Story = {
    ...Template,
    args: {
        ...AreaChart.args,
        stacked: true,
        title: 'Stacked Financial Performance (Area)',
    },
};

export const CustomMetrics: Story = {
    ...Template,
    args: {
        chartData: generateSampleData(90).map((item) => ({
            ...item,
            userAcquisition: Math.floor(Math.random() * 1000),
            customerSatisfaction: 70 + Math.random() * 30,
        })),
        title: 'Customer Metrics',
        description: 'User acquisition and satisfaction trends',
        dataKeys: ['userAcquisition', 'customerSatisfaction'],
        colors: ['#9C27B0', '#E91E63'],
        trendKey: 'userAcquisition',
        yAxisFormatter: (value) => value.toFixed(0),
        chartType: 'line',
    },
};

export const SingleMetricChart: Story = {
    ...Template,
    args: {
        chartData: generateSampleData(30),
        title: 'Revenue Trend',
        description: 'Daily revenue for the last 30 days',
        dataKeys: ['revenue'],
        colors: ['#4CAF50'],
        trendKey: 'revenue',
        chartType: 'area',
        yAxisFormatter: (value) => `$${value.toFixed(2)}`,
    },
};

export const LongTermTrend: Story = {
    ...Template,
    args: {
        chartData: generateSampleData(365),
        title: 'Yearly Financial Overview',
        description: 'Revenue, expense, and profit trends over the past year',
        dataKeys: ['revenue', 'expense', 'profit'],
        colors: ['#4CAF50', '#FFA000', '#2196F3'],
        trendKey: 'profit',
        chartType: 'line',
        yAxisFormatter: (value) => `$${(value / 1000).toFixed(1)}K`,
    },
};