import { Meta, StoryObj } from "@storybook/react";
import { UserAccount } from "client-typescript-sdk";

import { ProfileDropdown } from "./profile-dropdown";

const meta: Meta<typeof ProfileDropdown> = {
  component: ProfileDropdown,
} as Meta;

export default meta;

type Story = StoryObj<typeof ProfileDropdown>;

const user: UserAccount = {
  id: "1",
  username: "johndoe",
  profileImageUrl:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

export const Default: Story = {
  args: {
    navigationItems: [
      { name: "Your profile", href: "#" },
      { name: "Sign out", href: "#" },
    ],
    user: user,
  },
};
