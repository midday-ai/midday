// AllInOneWidget.stories.tsx
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import AllInOneWidget, { AllInOneWidgetProps } from "./all-in-one-widget";

export default {
  component: AllInOneWidget,
  argTypes: {
    organization: { control: "text" },
    placement: {
      control: { type: "select", options: ["left", "right"] },
    },
    fullScreen: { control: "boolean" },
    initialPage: {
      control: {
        type: "select",
        options: [
          "MainView",
          "RoadmapView",
          "CreatePost",
          "PostsView",
          "ChangelogView",
        ],
      },
    },
    metadata: { control: "object" },
  },
} as Meta;

const Template: StoryFn<AllInOneWidgetProps> = (
  args: JSX.IntrinsicAttributes & AllInOneWidgetProps,
) => <AllInOneWidget {...args} />;

export const Default = Template.bind({});
Default.args = {
  organization: "solomonai",
};

export const LeftPlacement = Template.bind({});
LeftPlacement.args = {
  organization: "solomonai",
  placement: "left",
};

export const FullScreen = Template.bind({});
FullScreen.args = {
  organization: "solomonai",
  fullScreen: true,
};

export const CustomInitialPage = Template.bind({});
CustomInitialPage.args = {
  organization: "solomonai",
  initialPage: "RoadmapView",
};

export const WithMetadata = Template.bind({});
WithMetadata.args = {
  organization: "solomonai",
  metadata: {
    userId: "12345",
    userRole: "admin",
  },
};
