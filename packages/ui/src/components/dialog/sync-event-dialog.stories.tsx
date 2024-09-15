import { type Meta, type StoryObj } from "@storybook/react";
import { useDataSyncDialog } from "../../hooks/useSyncEventDialog";

import { Button } from "../button";

import * as React from "react";
import DataSyncDialog from "./sync-event-dialog";

const meta: Meta<typeof DataSyncDialog> = {
  component: DataSyncDialog,
  argTypes: {
    isOpen: {
      control: "boolean",
      defaultValue: "", // Default value
    },
    status: {
      control: "text",
      defaultValue: "", // Default value
    },
  },
};

export default meta;

type Story = StoryObj<typeof DataSyncDialog>;

export const Default: Story = {
  args: {
    isOpen: false,
    status: "syncing",
  },
  render: () => {
    const { DataSyncDialogComponent, setDialogOpen } =
      useDataSyncDialog("Uploading data...");

    return (
      <div>
        <Button onClick={() => setDialogOpen(true)}>
          Open Data Sync Dialog
        </Button>
        {DataSyncDialogComponent}
      </div>
    );
  },
};

export const SyncEventDialog: Story = {
  args: {
    isOpen: true,
    status: "syncing",
  },
};
