import { type Meta, type StoryObj } from "@storybook/react";

import { FileUploader } from "./file-uploader";

const meta: Meta<typeof FileUploader> = {
  component: FileUploader,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof FileUploader>;

export const Default: Story = {};
