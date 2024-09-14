import { HandRaisedIcon } from "@heroicons/react/24/outline";

import React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../button";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export interface AskSolomonAiButtonProps extends ButtonProps {
  asChild?: boolean;
  active: boolean;
  className?: string;
  href: string;
  label?: string;
}

/**
 * AskSolomonAiButtonProps defines the props for the AskSolomonAiButton
 * component.
 *
 * @property {boolean} active - Indicates whether the button is active or not.
 * @property {string} className - Additional CSS classes for styling the button.
 * @property {boolean} asChild - Optional flag to treat the button as a child
 *   component.
 * @interface AskSolomonAiButtonProps
 */
const AskSolomonAiButton: React.FC<AskSolomonAiButtonProps> = ({
  className,
  href,
  label,
  ...props
}) => {
  return (
    <a href={href}>
      <Button
        variant={"outline"}
        className={cn(
          "border-1 ml-3 items-center justify-center rounded-2xl font-bold text-foreground",
          className,
        )}
        {...props}
      >
        <HandRaisedIcon className="mr-2 h-5 w-5" />
        <p>{label ?? "Ask Solomon AI"}</p>
      </Button>
    </a>
  );
};

export { AskSolomonAiButton };
