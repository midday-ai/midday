import type { Meta, StoryObj } from '@storybook/react';
import { DashboardSkeleton } from './dashboard-skeleton';

const meta: Meta<typeof DashboardSkeleton> = {
  component: DashboardSkeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DashboardSkeleton>;

export const Default: Story = {};

export const CustomHeight: Story = {
  render: () => (
    <div style={{ height: '800px' }}>
      <DashboardSkeleton />
    </div>
  ),
};