import { ViewfinderCircleIcon } from "@heroicons/react/24/outline";
import React from "react";

import { cn } from "../../utils/cn";
import { Button } from "../button";

import { ButtonProps } from "./ask-solomon-button";

export interface FeedbackButtonProps extends ButtonProps {
  asChild?: boolean;
  active: boolean;
  className?: string;
  href: string;
  label?: string;
}

/**
 * FeedbackButtonProps defines the props for the FeedbackButton component.
 *
 * @property {boolean} active - Indicates whether the button is active or not.
 * @property {string} className - Additional CSS classes for styling the button.
 * @property {boolean} asChild - Optional flag to treat the button as a child
 *   component.
 * @interface FeedbackButtonProps
 */
const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  className,
  href,
  label,
}) => {
  return (
    <a href={href}>
      <Button
        variant={"outline"}
        className={cn(
          "ml-3 items-center justify-center border font-bold transition-colors duration-300 ease-in-out dark:border-white dark:bg-transparent dark:text-foreground",
          "text-foreground hover:bg-gray-200 hover:text-background dark:hover:bg-gray-800 dark:hover:text-foreground",
          className,
        )}
      >
        <ViewfinderCircleIcon className="mr-2 h-5 w-5" />
        {label ? <p>{label}</p> : <p>Feedback</p>}
      </Button>
    </a>
  );
};

export { FeedbackButton };
