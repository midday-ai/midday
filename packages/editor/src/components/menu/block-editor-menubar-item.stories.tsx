import type { Meta, StoryObj } from "@storybook/react";
import { Heading1 } from "lucide-react";

import {
  BlockMenuBarItemProps,
  BlockMenubarMenuItem,
} from "./block-editor-menubar-item";

const meta: Meta<typeof BlockMenubarMenuItem> = {
  component:
    BlockMenubarMenuItem as unknown as React.ComponentType<BlockMenuBarItemProps>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Customize the controls for the properties of your component as needed
    // Example:
    // backgroundColor: { control: 'color' },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<typeof BlockMenubarMenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularBlockMenubarMenuItem: Story = {
  args: {
    icon: <Heading1 className="h-6 w-6 text-black" />,
    title: "Heading 1",
    action: () => {},
    isActive: () => true,
  },
};
