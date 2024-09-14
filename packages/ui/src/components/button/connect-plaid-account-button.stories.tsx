import { type Meta, type StoryObj } from "@storybook/react";
import { PlaidLinkOnEventMetadata } from "react-plaid-link";

import { ConnectPlaidAccountButton } from "./connect-plaid-account-button";

const meta: Meta<typeof ConnectPlaidAccountButton> = {
  component: ConnectPlaidAccountButton,
  argTypes: {
    className: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConnectPlaidAccountButton>;

export const Default: Story = {
  args: {
    className: "w-fit rounded-2xl border-black",
    token: "link_token",
    title: "Connect Plaid Account",
    onExit: () => {
      console.log("onExit");
    },
    onEvent: (_eventName: string, _metadata: PlaidLinkOnEventMetadata) =>
      Promise.resolve(),
    onSuccess: () => {},
  },
};

export const ButtonWithClassName: Story = {
  args: {
    className: "w-full rounded-2xl border-black",
  },
};
