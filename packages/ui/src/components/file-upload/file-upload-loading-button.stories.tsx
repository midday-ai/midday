import { type Meta, type StoryObj } from "@storybook/react";

import { FileUploadLoadingButton } from "./file-upload-loading-button";

const meta: Meta<typeof FileUploadLoadingButton> = {
  component: FileUploadLoadingButton,
  argTypes: {
    action: {
      control: "select",
      options: ["create", "update", "delete"],
    },
    pending: {
      control: "boolean",
    },
  },
};

export default meta;

type Story = StoryObj<typeof FileUploadLoadingButton>;

export const Default: Story = {};

export const FileUploadLoadingButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};

export const LoadingButtonWithCreateAction: Story = {
  args: {
    action: "create",
  },
};

export const LoadingButtonWithUpdateAction: Story = {
  args: {
    action: "update",
  },
};

export const LoadingButtonWithDeleteAction: Story = {
  args: {
    action: "delete",
  },
};

export const LoadingButtonWithCreateActionAndPending: Story = {
  args: {
    action: "create",
    pending: true,
  },
};
