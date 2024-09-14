import { type Meta, type StoryObj } from "@storybook/react";

import { CsvPreview } from "./csv-preview";

const meta: Meta<typeof CsvPreview> = {
  component: CsvPreview,
  argTypes: {
    fileUrl: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof CsvPreview>;

export const Default: Story = {
  args: {
    fileUrl: "https://data.wa.gov/api/views/f6w7-q2d2/rows.csv",
  },
};

export const CsvPreviewWithFileUrl: Story = {
  args: {
    fileUrl: "https://data.wa.gov/api/views/f6w7-q2d2/rows.csv",
  },
};
