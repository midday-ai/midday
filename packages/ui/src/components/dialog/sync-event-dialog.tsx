import React, { useEffect, useState } from "react";

import "./animation.css";

import { Badge } from "../badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog";

export interface DataSyncDialogProps {
  isOpen: boolean;
  status: string;
  onOpenChange: () => void;
  handleCloseDialog: () => void;
}

/**
 * DataSyncDialog is a component that renders a dialog.
 *
 * @param {DataSyncDialogProps} props - Props for the DataSyncDialog
 * @returns {JSX.Element} - The rendered DataSyncDialog component.
 * @see https://www.radix-ui.com/docs/primitives/components/dialog
 */
export const DataSyncDialog: React.FC<DataSyncDialogProps> = ({
  isOpen,
  status,
  onOpenChange,
}) => {
  const [isDialogOpen, setDialogOpen] = useState<boolean>(isOpen);

  useEffect(() => {
    setDialogOpen(isOpen);
  }, [isOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl bg-zinc-950 p-[2%] text-foreground md:min-h-[70%]">
        <DialogHeader>
          <DialogDescription>Data Sync Operation</DialogDescription>
        </DialogHeader>
        <DataSyncContent
          title="Data Sync In Progress"
          description="Please grab a coffee while this process ensues"
          status={status}
        />
      </DialogContent>
    </Dialog>
  );
};

interface DataSyncContentProps {
  title: string;
  description: string;
  status?: string;
}

/**
 * DataSyncContent is a component that renders a dialog content.
 *
 * @param {DataSyncContentProps} props - Props for the DataSyncContent
 * @returns {JSX.Element} - The rendered DataSyncContent component.
 * @see https://www.radix-ui.com/docs/primitives/components/dialog
 */
const DataSyncContent: React.FC<DataSyncContentProps> = ({
  title,
  description,
  status,
}) => {
  const [opacity, setOpacity] = React.useState(0);

  React.useEffect(() => {
    const timeout = setTimeout(() => setOpacity(1), 100); // Start the fade-in effect after 100ms
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div
        style={{ transition: "opacity 6s", opacity }}
        className="flex flex-col items-center justify-center gap-5"
      >
        {status && (
          <Badge className="rounded-2xl bg-white px-3 py-2">{status}</Badge>
        )}
        <h1 className="text-3xl font-bold text-foreground md:text-7xl">
          {title}
        </h1>
        <div className="flex max-w-3xl flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-bold text-foreground md:text-3xl">
            ☕ {description}
          </h2>
        </div>
      </div>
      <div className="area">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>
    </div>
  );
};

export default DataSyncDialog;
