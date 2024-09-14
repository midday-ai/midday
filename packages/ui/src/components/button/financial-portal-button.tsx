import { PresentationChartBarIcon } from "@heroicons/react/24/outline";
import * as React from "react";

import { cn } from "../../utils/cn";
import { Button } from "../button";

import { ButtonProps } from "./ask-solomon-button";

/*
 * FinancialPortalButtonProps defines the props for the FinancialPortalButton component.
 *
 * @interface FinancialPortalButtonProps
 * @extends {ButtonProps}
 * */
interface FinancialPortalButtonProps extends ButtonProps {
  callback: () => void;
}

/**
 * FinancialPortalButton is a component that renders a back button.
 *
 * @param {FinancialPortalButtonProps} props - Props for the
 *   FinancialPortalButton component.
 * @returns {JSX.Element} - The rendered FinancialPortalButton component.
 */
const FinancialPortalButton: React.FC<FinancialPortalButtonProps> = ({
  className,
  callback,
}) => {
  return (
    <Button
      className={cn(
        "border-1 ml-3 items-center justify-center font-bold text-foreground",
        className,
      )}
      onClick={callback}
      variant="ghost"
    >
      <PresentationChartBarIcon className="mr-2 inline-block h-5 w-5" />
      <span className="cursor-pointer font-bold hover:underline">
        Financial Portal
      </span>
    </Button>
  );
};

export { FinancialPortalButton };
