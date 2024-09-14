import { ImageIcon } from "@radix-ui/react-icons";
import { type Meta, type StoryObj } from "@storybook/react";
import * as React from "react";

import { Button } from "../button";

import { EmptyFileUploadCard } from "./empty-file-upload-card";

const meta: Meta<typeof EmptyFileUploadCard> = {
  component: EmptyFileUploadCard,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof EmptyFileUploadCard>;

export const Default: Story = {};

export const EmptyFileUploadCardWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};

export const EmptyFileUploadCardWithAction: Story = {
  args: {
    action: <Button>Upload</Button>,
  },
};

export const EmptyFileUploadCardWithIcon: Story = {
  args: {
    icon: ImageIcon,
  },
};

export const EmptyFileUploadCardWithActionAndIcon: Story = {
  args: {
    action: <Button>Upload</Button>,
    icon: ImageIcon,
  },
};

export const EmptyFileUploadCardWithTitle: Story = {
  args: {
    title: "No files uploaded",
  },
};

export const EmptyFileUploadCardWithTitleAndDescription: Story = {
  args: {
    title: "No files uploaded",
    description: "Upload some files to see them here",
  },
};
