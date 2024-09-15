import { KeyIcon } from "@heroicons/react/24/outline";
import * as React from "react";
import { ButtonProps } from "react-day-picker";

import { cn } from "../../utils/cn";
import { Button } from "../button";

/*
 * LogInButtonProps defines the props for the LogInButton component.
 *
 * @interface LogInButtonProps
 * @extends {ButtonProps}
 * */
interface LogInButtonProps extends ButtonProps {
  callBack: () => void;
}

/**
 * LogInButton is a component that renders a sign up button.
 *
 * @param {LogInButtonProps} props - Props for the LogInButton component.
 * @returns {JSX.Element} - The rendered LogInButton component.
 */
const LogInButton: React.FC<LogInButtonProps> = ({ className, callBack }) => {
  return (
    <Button
      className={cn("rounded-2xl font-bold text-foreground", className)}
      variant="outline"
      onClick={callBack}
    >
      <KeyIcon className="mr-2 h-5 w-5" />
      Log In
    </Button>
  );
};

export { LogInButton };
