"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { deleteConnectionAction } from "../actions/institutions/delete-connection";

type Props = {
  connectionId: string;
};

export function DeleteConnection({ connectionId }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const { execute, isExecuting } = useAction(deleteConnectionAction);

  const handleDelete = async () => {
    setOpen(false);
    setValue("");

    execute({ connectionId });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={70}>
        <Tooltip>
          <AlertDialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-7 h-7 flex items-center"
                disabled={isExecuting}
              >
                <Icons.Delete size={16} />
              </Button>
            </TooltipTrigger>
          </AlertDialogTrigger>

          <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
            Delete
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete a bank connection. If you proceed, all
            transactions associated with this connection and all bank accounts
            will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-medium">DELETE</span> to confirm.
          </Label>
          <Input
            id="confirm-delete"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={value !== "DELETE" || isExecuting}
            onClick={handleDelete}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
