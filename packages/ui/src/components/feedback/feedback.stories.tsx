import { type Meta, type StoryObj } from "@storybook/react";

import { FeedbackComponent, FeedbackUserRecord } from "./feedback";

const meta: Meta<typeof FeedbackComponent> = {
  component: FeedbackComponent,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof FeedbackComponent>;

const user: FeedbackUserRecord = {
  userId: "dsl;jgksdlgkdsjg",
  userName: "Pedro Duarte",
  email: "i8Vp0@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
};

const feedbackMetadata = {
  featureRequestBoardToken: "963d21ce-6d1d-add1-472d-cf9cf75cc64a",
  feedbackBoardToken: "ec000d15-6137-9936-b426-e8d23d4cb37a",
  appId: "6550116ea9a3f2d9010f3379",
  ssoToken: "dsl;jgksdlgkdsjg",
};

export const Default: Story = {
  args: {
    feedbackMetadata,
    user,
  },
};
