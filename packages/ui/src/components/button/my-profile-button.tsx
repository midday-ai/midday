import { UserIcon } from "@heroicons/react/24/outline";
import React from "react";

import { cn } from "../../utils/cn";
import { Button } from "../button";

import { ButtonProps } from "./ask-solomon-button";

export interface MyProfileButtonProps extends ButtonProps {
  asChild?: boolean;
  active: boolean;
  className?: string;
  href: string;
  label?: string;
}

/**
 * MyProfileButton Props defines the props for the MyProfileButton component.
 *
 * @property {boolean} active - Indicates whether the button is active or not.
 * @property {string} className - Additional CSS classes for styling the button.
 * @property {boolean} asChild - Optional flag to treat the button as a child
 *   component.
 * @property {string} href - The URL to link to.
 * @property {string} label - The label to display.
 * @interface MyProfileButtonProps
 */
const MyProfileButton: React.FC<MyProfileButtonProps> = ({
  className,
  href,
  label,
}) => {
  return (
    <a href={href}>
      <Button
        variant={"outline"}
        className={cn(
          "ml-3 items-center justify-center border font-bold text-foreground transition-colors duration-300 ease-in-out dark:border-white dark:bg-transparent dark:text-foreground",
          "hover:bg-gray-200 hover:text-background dark:hover:bg-gray-800 dark:hover:text-foreground",
          className,
        )}
      >
        <UserIcon className="mr-2 h-5 w-5" />
        {label ? <p>{label}</p> : <p>My Profile</p>}
      </Button>
    </a>
  );
};

export { MyProfileButton };
