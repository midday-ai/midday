import { type Meta, type StoryObj } from "@storybook/react";

import React from "react";
import { FileUploadShell } from "./file-upload-shell";

const meta: Meta<typeof FileUploadShell> = {
  component: FileUploadShell,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof FileUploadShell>;

export const Default: Story = {};

export const FileUploadShellWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};

export const FileUploadShellWithVariant: Story = {
  args: {
    variant: "sidebar",
    children: (
      <div>
        <p>Hey Yoan</p>
      </div>
    ),
  },
};

export const FileUploadShellWithMarkdown: Story = {
  args: {
    variant: "markdown",
    children: (
      <div>
        <p>Hey Yoan</p>
      </div>
    ),
  },
};

export const FileUploadShellWithCentered: Story = {
  args: {
    variant: "centered",
    children: (
      <div>
        <p>Hey Yoan</p>
      </div>
    ),
  },
};
