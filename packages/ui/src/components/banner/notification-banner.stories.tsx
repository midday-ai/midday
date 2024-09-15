import { type Meta, type StoryObj } from "@storybook/react";

import NotificationBanner from "./notification-banner";

const meta: Meta<typeof NotificationBanner> = {
  component: NotificationBanner,
  argTypes: {
    position: {
      control: {
        type: "select",
        options: ["bottom", "top"],
      },
      defaultValue: "bottom", // Default value
    },
    centered: {
      control: "boolean",
      defaultValue: false, // Default value
    },
    fullScreen: {
      control: "boolean",
      defaultValue: false, // Default value
    },
    marginLeft: {
      control: "boolean",
      defaultValue: false, // Default value
    },
    message: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof NotificationBanner>;

export const Default: Story = {};

export const TopPositionBanner: Story = {
  args: {
    position: "top",
  },
};

export const BottomPositionBanner: Story = {
  args: {
    position: "bottom",
  },
};

export const CenteredBanner: Story = {
  args: {
    centered: true,
  },
};

export const FullScreenBanner: Story = {
  args: {
    fullScreen: true,
  },
};

export const LeftMarginBanner: Story = {
  args: {
    marginLeft: true,
  },
};

export const WithMessage: Story = {
  args: {
    message: "This is a notification banner.",
  },
};

export const WithSaveAndRejectButtons: Story = {
  args: {
    message: "This is a notification banner with save and reject buttons.",
    onSave: () => {
      alert("Save button clicked!");
    },
    onReject: () => {
      alert("Reject button clicked!");
    },
  },
};

export const FullScreenBottomPositionBanner: Story = {
  args: {
    fullScreen: true,
    position: "bottom",
    message: "This is a full screen banner",
  },
};

export const FullScreenTopPositionBanner: Story = {
  args: {
    fullScreen: true,
    position: "top",
    message: "This is a full screen banner",
  },
};

export const FullScreenCenteredBanner: Story = {
  args: {
    fullScreen: true,
    centered: true,
    message: "This is a full screen banner",
  },
};
