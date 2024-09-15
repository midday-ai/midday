import { Meta, StoryObj } from "@storybook/react";

import { CopyToClipboard, CopyToClipboardProps } from "./copy-to-clipboard"; // Adjust the import path to where your component is located
import * as React from "react";

const meta: Meta<CopyToClipboardProps> = {
  component: CopyToClipboard,
  argTypes: {
    text: {
      control: "text",
      defaultValue: "Sample text to copy",
    },
  },
};

export default meta;

const Template: StoryObj<CopyToClipboardProps> = {
  render: (args) => <CopyToClipboard {...args} />,
};

export const Default: StoryObj<CopyToClipboardProps> = {
  // No need to bind or use a separate render function if not customizing per story
  ...Template,
};
