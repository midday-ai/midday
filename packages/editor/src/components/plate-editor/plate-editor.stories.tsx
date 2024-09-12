// PlateEditorTooltipProvider.stories.tsx

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/plate-editor/plate-ui/tooltip";
import {
  PlateEditorTooltipProvider,
  PlateEditorTooltipProviderProps,
} from "@/provider/plate-editor-tooltip-provider";
import { Button } from "@midday/ui/button"; // Assuming you have a Button component
import { Meta, StoryFn } from "@storybook/react";

import PlateEditor from "./plate-editor";

export default {
  title: "Components/PlateEditorTooltipProvider",
  component: PlateEditorTooltipProvider,
  argTypes: {
    customDelayDuration: {
      control: { type: "number", min: 0, max: 2000, step: 100 },
    },
    disableHoverableContent: {
      control: "boolean",
    },
    skipDelayDuration: {
      control: { type: "number", min: 0, max: 1000, step: 50 },
    },
    theme: {
      control: { type: "select", options: ["light", "dark", "system"] },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full">
        <PlateEditorTooltipProvider>
          <Story />
        </PlateEditorTooltipProvider>
      </div>
    ),
  ],
} as Meta;

const Template: StoryFn<PlateEditorTooltipProviderProps> = (
  args: React.JSX.IntrinsicAttributes & PlateEditorTooltipProviderProps,
) => <PlateEditor />;

export const Default = Template.bind({});
Default.args = {};
