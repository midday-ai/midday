import { TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { ButtonProps } from "react-day-picker";

import { cn } from "../../utils/cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../alert-dialog";
import { Button } from "../button";

import { Spinner } from "../spinner";

/*
 * DeleteUserButtonProps defines the props for the DeleteUserButton component.
 *
 * @interface DeleteUserButtonProps
 * @extends {ButtonProps}
 * */
interface DeleteUserButtonProps extends ButtonProps {
  showDeleteAlert: boolean;
  isDeleteLoading: boolean;
  openDeleteDialog: () => void;
  onCloseDialog: () => void;
  handleDelete: () => Promise<void>;
}

/**
 * DeleteUserButton is a component that renders a back button.
 *
 * @param {DeleteUserButtonProps} props - Props for the DeleteUserButton
 *   component.
 * @returns {JSX.Element} - The rendered DeleteUserButton component.
 */
const DeleteUserButton: React.FC<DeleteUserButtonProps> = ({
  showDeleteAlert,
  isDeleteLoading,
  openDeleteDialog,
  onCloseDialog,
  handleDelete,
  className,
}) => {
  return (
    <>
      <Button
        className={cn("text-foreground", className)}
        variant="outline"
        onClick={openDeleteDialog}
      >
        <TrashIcon className="mr-2 inline-block h-5 w-5" />
        <span>Delete Profile</span>
      </Button>
      {showDeleteAlert && (
        <AlertDialog open={showDeleteAlert} onOpenChange={() => {}}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete your profile?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCloseDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                {isDeleteLoading ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="mr-2 h-4 w-4" />
                )}
                <span>Delete</span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export { DeleteUserButton };
