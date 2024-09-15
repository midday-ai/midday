"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { composeEventHandlers } from "../../lib/file-upload-utils";

import { cn } from "../../utils/cn";
import { Button, ButtonProps, buttonVariants } from "../button";

interface FileUploadLoadingButtonProps extends ButtonProps {
  action: "create" | "update" | "delete";
  pending?: boolean;
}

const FileUploadLoadingButton = React.forwardRef<
  HTMLButtonElement,
  FileUploadLoadingButtonProps
>(({ children, className, variant, size, action, pending, ...props }, ref) => {
  const [, setButtonAction] = React.useState<"update" | "delete" | "create">(
    "create",
  );

  return (
    <Button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={pending}
      {...props}
      onClick={composeEventHandlers(props.onClick, () => {
        if (!props.disabled) {
          setButtonAction(action);
        }
      })}
    >
      {pending && (
        <ReloadIcon className="mr-2 size-4 animate-spin" aria-hidden="true" />
      )}

      {children}
    </Button>
  );
});
FileUploadLoadingButton.displayName = "FileUploadLoadingButton";

export { FileUploadLoadingButton };
