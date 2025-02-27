import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TimeRangeInput } from "./time-range-input";

const meta: Meta<typeof TimeRangeInput> = {
  component: () => {
    const [value, setValue] = useState({ start: "", end: "" });
    return (
      <TimeRangeInput
        value={value}
        onChange={(value) => {
          setValue(value);
        }}
      />
    );
  },
};

export default meta;

type Story = StoryObj<typeof TimeRangeInput>;

export const Default: Story = {};
