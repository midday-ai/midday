import { Meta, StoryObj } from "@storybook/react";

import { ViewNotificationDropdown } from "./notification-dropdown";

const meta: Meta<typeof ViewNotificationDropdown> = {
  component: ViewNotificationDropdown,
} as Meta;

export default meta;

type Story = StoryObj<typeof ViewNotificationDropdown>;

export const Default: Story = {
  args: {
    title: "Notifications",
    children: (
      <div className="py-1">
        <div className="flex items-center px-4 py-2 text-sm">
          You have no notifications.
        </div>
      </div>
    ),
  },
};
