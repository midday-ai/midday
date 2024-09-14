// SearchAddress.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";

import SearchAddress from "./search-address";

const meta: Meta<typeof SearchAddress> = {
  component: SearchAddress,
  tags: ["autodocs"],
  argTypes: {
    onSelectLocation: { action: "locationSelected" },
  },
};

export default meta;
type Story = StoryObj<typeof SearchAddress>;

export const Default: Story = {
  args: {},
};

export const LoadingState: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: "https://api.example.com/search",
        method: "GET",
        status: 200,
        response: {},
        delay: 2000, // Simulate a 2-second delay
      },
    ],
  },
};

export const NoResults: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: "https://api.example.com/search",
        method: "GET",
        status: 200,
        response: { results: {} },
      },
    ],
  },
};

export const WithResults: Story = {
  args: {},
  parameters: {
    mockData: [
      {
        url: "https://api.example.com/search",
        method: "GET",
        status: 200,
        response: {
          results: {
            address: [
              {
                label: "123 Main St, Anytown, USA",
                raw: { entityType: "Address" },
              },
              {
                label: "456 Elm St, Othertown, USA",
                raw: { entityType: "Address" },
              },
            ],
            poi: [
              {
                label: "Central Park, New York, USA",
                raw: { entityType: "POI" },
              },
            ],
          },
        },
      },
    ],
  },
};
