// BankAccountCardHeader.stories.tsx

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { FormSchemaType, MinimalEditorForm } from "./minimal-editor-form";

const meta: Meta<typeof MinimalEditorForm> = {
  component: MinimalEditorForm,
};

export default meta;

type Story = StoryObj<typeof MinimalEditorForm>;

export const Default: Story = {};

// export const WithButton: Story = {
//     args: {
//         onSubmit: (values: FormSchemaType) => {
//             return console.log(values);
//         },
//     },
// };
