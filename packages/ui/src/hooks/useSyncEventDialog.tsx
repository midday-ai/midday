import React, { useState } from "react";
import DataSyncDialog from "../components/dialog/sync-event-dialog";

export interface DataSyncDialogProps {
  status: string;
}

/**
 * A hook to manage and render a DataSyncDialog.
 *
 * @param status The current status to display in the dialog.
 * @returns An object containing the dialog component and an open state boolean.
 *
 *   Const SomeComponent: React.FC = () => { const { DataSyncDialogComponent,
 *   isDialogOpen } = useDataSyncDialog("Uploading data...");
 *
 *   Return ( <div> <button onClick={() => isDialogOpen(true)}>Open Data Sync
 *   Dialog</button> <DataSyncDialogComponent /> </div> ); };
 */
const useDataSyncDialog = (
  status: string,
): {
  DataSyncDialogComponent: React.ReactNode;
  isDialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
} => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const onOpenChange = () => {
    setDialogOpen(!isDialogOpen);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const component = DataSyncDialog({
    isOpen: isDialogOpen,
    status,
    onOpenChange: onOpenChange,
    handleCloseDialog,
  });
  return {
    DataSyncDialogComponent: component,
    isDialogOpen,
    setDialogOpen,
  };
};

export { useDataSyncDialog };
