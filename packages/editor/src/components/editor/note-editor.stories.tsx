// BankAccountCardHeader.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { SmartNote } from "solomon-ai-typescript-sdk";

import { NoteEditor } from "./note-editor";

const meta: Meta<typeof NoteEditor> = {
  component: NoteEditor,
  decorators: [(Story) => <Story />],
};

export default meta;

type Story = StoryObj<typeof NoteEditor>;

export const Default: Story = {};

const smartNote: SmartNote = {
  id: "1",
  content: "content",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const WithSmartNote: Story = {
  args: {
    note: smartNote,
    callback: (content: string) => {
      console.log(content);
    },
    aiAppId: "123",
    aiBaseUrl: "https://example.com",
    aiToken: "abc",
  },
};
