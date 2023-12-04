"use client";

import { Loader2 } from "lucide-react";
import { Icons } from "./icons";
import { Progress } from "./progress";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(
        ({ id, title, description, progress = 0, action, ...props }) => {
          return (
            <Toast key={id} {...props}>
              <div className="space-y-2 w-full">
                <div className="flex space-x-2 justify-between">
                  <div className="flex space-x-2 items-center">
                    {props?.variant === "success" && <Icons.Check />}

                    {props?.variant === "progress" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {title && <ToastTitle>{title}</ToastTitle>}
                  </div>

                  <div>
                    {props?.variant === "progress" && (
                      <span className="text-sm text-[#878787]">
                        {progress}%
                      </span>
                    )}
                  </div>
                </div>

                {props.variant === "progress" && (
                  <Progress
                    value={progress}
                    className="w-full rounded-none h-[3px] bg-border"
                  />
                )}

                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        }
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
