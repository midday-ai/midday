import {
  BarChartIcon,
  BrainCircuitIcon,
  LineChartIcon,
  MessageSquareIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@midday/ui/button";
import { Dock, DockIcon } from "@midday/ui/magicui/dock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";

export type IconProps = React.HTMLAttributes<SVGElement>;

const DATA = {
  features: [
    { href: "#", icon: BarChartIcon, label: "Financial Modelling" },
    { href: "#", icon: TrendingUpIcon, label: "Stress Testing" },
    { href: "#", icon: LineChartIcon, label: "Forecasting" },
    { href: "#", icon: BrainCircuitIcon, label: "Insights" },
    { href: "#", icon: MessageSquareIcon, label: "Advanced Chat" },
  ],
};

export function ProTierDock() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <TooltipProvider>
        <Dock direction="middle" className="bg-background">
          {DATA.features.map((item) => (
            <DockIcon key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "size-12 rounded-full",
                    )}
                  >
                    <item.icon className="size-4" strokeWidth={0.5} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-background text-foreground rounded-2xl py-2"
                >
                  <p className="text-md">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          ))}
        </Dock>
      </TooltipProvider>
    </div>
  );
}
