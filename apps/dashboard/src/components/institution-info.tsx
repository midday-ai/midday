import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import type { ReactNode } from "react";

type Props = {
  provider: string;
  children: ReactNode;
};

export function InstitutionInfo({ provider, children }: Props) {
  const getDescription = () => {
    switch (provider) {
      case "gocardless":
        return "With GoCardLess we can connect to more than 2,500 banks in 31 countries across the UK and Europe.";
      case "plaid":
        return `With Plaid we can connect to 12,000+ financial institutions across the US, Canada, UK, and Europe are covered by Plaid's network`;
      case "teller":
        return "With Teller we can connect instantly to more than 5,000 financial institutions in the US.";
      case "enablebanking":
        return "With Enable Banking we can connect to more than 2,500 banks in Europe.";
      default:
        break;
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="w-[300px] text-xs" side="right">
          {getDescription()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
