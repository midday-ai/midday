import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { generateAppointments, generateResources } from "../../lib/random-data";
import { Appointment } from "../../types/appointment";
import { Resource } from "../../types/resource";

import Planner from "./planner";

const meta: Meta = {
  component: Planner,
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: StoryFn = () => {
  const resources: Resource[] = generateResources(4); // Generate 4 resources
  const appointments: Appointment[] = generateAppointments(100, resources); // Generate 100 appointments linked to the resources

  return (
    <Planner initialResources={resources} initialAppointments={appointments} />
  );
};

export const Default = Template.bind({});
Default.args = {};
