import { type FC } from "react";
import Link from "next/link";
import { Thread } from "../thread";
import { Button, type ButtonProps } from "../button";
import { cn } from "@midday/ui/cn";
import { useSwitchToNewThread } from "@assistant-ui/react";
import type { TooltipContentProps } from "@radix-ui/react-tooltip";
import {
  ArchiveIcon,
  EditIcon,
  MenuIcon,
  RocketIcon,
  ShareIcon,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../sheet";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { ModelPicker } from "./model-picker";

type ButtonWithTooltipProps = ButtonProps & {
  tooltip: string;
  side?: TooltipContentProps["side"];
};

const ButtonWithTooltip: FC<ButtonWithTooltipProps> = ({
  children,
  tooltip,
  side = "top",
  ...rest
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...rest}>
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

const TopLeft: FC = () => {
  const switchToNewThread = useSwitchToNewThread();

  return (
    <ButtonWithTooltip
      onClick={switchToNewThread}
      variant="ghost"
      className="flex w-full justify-between px-3"
      tooltip="New Chat"
      side="right"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <RocketIcon className="inline size-4" />
        <span>assistant-ui</span>
      </div>

      <EditIcon className="size-4" />
    </ButtonWithTooltip>
  );
};

const MainLeft: FC = () => {
  return (
    <nav className="flex flex-col items-stretch gap-1 text-sm font-medium">
      <Link
        href="#"
        className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
      >
        New Chat
        <ButtonWithTooltip
          variant={"ghost"}
          className="ml-auto h-auto p-0 hover:text-foreground/60"
          tooltip="Archive"
        >
          <ArchiveIcon className="size-4" />
        </ButtonWithTooltip>
      </Link>
    </nav>
  );
};

const LeftBarSheet: FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <MenuIcon className="size-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="mt-6 flex flex-col gap-1">
          <TopLeft />
          <MainLeft />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Header: FC = () => {
  return (
    <header className="flex gap-2">
      <LeftBarSheet />
      <ModelPicker />
      <ButtonWithTooltip
        variant="outline"
        size="icon"
        tooltip="Share"
        side="bottom"
        className="ml-auto shrink-0"
      >
        <ShareIcon className="size-4" />
      </ButtonWithTooltip>
    </header>
  );
};

export const StandaloneAssistant = () => {
  const sideStyle = "bg-muted/40 px-3 py-2";
  const topStyle = "border-b";
  const leftStyle = "border-r hidden md:block";

  return (
    <div className="grid h-full w-full grid-flow-col grid-rows-[auto_1fr] md:grid-cols-[250px_1fr]">
      <div className={cn(sideStyle, leftStyle, topStyle)}>
        <TopLeft />
      </div>
      <div className={cn(sideStyle, leftStyle)}>
        <MainLeft />
      </div>
      <div className={cn(sideStyle, topStyle)}>
        <Header />
      </div>
      <div className="overflow-hidden">
        <Thread />
      </div>
    </div>
  );
};
