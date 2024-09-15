import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import React from "react";

import { cn } from "../../utils/cn";
import { Button } from "../button";

import { ButtonProps } from "./ask-solomon-button";

export interface LogoutButtonProps extends ButtonProps {
  variant?: "button" | "navigation"; // Added variant to choose the style
  className?: string;
  callback: () => void;
}

/**
 * A unified LogoutButton component that can render either as a button or a
 * navigation element.
 *
 * @param props - The props passed to control the component behavior and
 *   styling.
 * @returns {React.ReactElement}
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "button",
  className,
  callback,
  ...props
}) => {
  if (variant === "navigation") {
    return (
      <div
        className={cn(
          "group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 text-foreground hover:bg-gray-50 hover:text-zinc-950",
          className,
        )}
        onClick={callback}
      >
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg">
          <ExclamationTriangleIcon
            className="h-6 w-6 hover:border hover:border-red-600 group-hover:text-red-600"
            aria-hidden="true"
          />
        </div>
        <div className="flex-auto">
          <div className="block font-semibold">Sign out</div>
          <p className="mt-1">Sign out of your account of interest</p>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={callback}
      className={cn(
        "border-1 flex flex-1 items-center justify-center gap-1 font-bold",
        className,
      )}
      {...props}
    >
      <ExclamationTriangleIcon className="mr-2 h-5 w-5" />
      <p>Sign out</p>
    </Button>
  );
};

export { LogoutButton };
