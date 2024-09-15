"use client";

import type { FC } from "react";
import { MarkdownText } from "./markdown-text";
import { Avatar, AvatarFallback } from "./avatar";
import { Button, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { cn } from "../utils/cn";
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizonalIcon,
} from "lucide-react";

export const Thread: FC = () => {
  return (
    <TooltipProvider>
      <ThreadPrimitive.Root className="flex h-full flex-col items-center pb-4">
        <ThreadPrimitive.Viewport className="flex w-full flex-grow flex-col items-center overflow-y-scroll scroll-smooth px-4 pt-12">
          <ThreadPrimitive.Empty>
            <ThreadEmpty />
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />

          <ThreadScrollToBottom />
        </ThreadPrimitive.Viewport>

        <Composer />
      </ThreadPrimitive.Root>
    </TooltipProvider>
  );
};

const ThreadEmpty: FC = () => {
  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      <Avatar>
        <AvatarFallback>C</AvatarFallback>
      </Avatar>
      <p className="mt-4 text-xl">How can I help you today?</p>
    </div>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <div className="sticky bottom-0">
      <ThreadPrimitive.ScrollToBottom asChild>
        <IconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="absolute -top-10 rounded-full disabled:invisible"
        >
          <ArrowDownIcon className="size-4" />
        </IconButton>
      </ThreadPrimitive.ScrollToBottom>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="flex w-[calc(100%-32px)] max-w-[42rem] items-end rounded-lg border border-zinc-200 p-0.5 transition-shadow focus-within:shadow-sm dark:border-zinc-800">
      <ComposerPrimitive.Input
        autoFocus
        placeholder="Write a message..."
        className="h-12 max-h-40 flex-grow resize-none bg-transparent p-3.5 text-sm outline-none placeholder:text-zinc-950/50 dark:placeholder:text-zinc-50/50"
      />
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send className="m-2 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 text-2xl font-bold shadow transition-opacity disabled:opacity-10 dark:bg-zinc-50">
          <SendHorizonalIcon className="size-4 text-foreground dark:text-zinc-950" />
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel className="m-3.5 flex size-5 items-center justify-center rounded-full border-2 border-zinc-950 dark:border-zinc-50">
          <div className="size-2 rounded-[1px] bg-zinc-950 dark:bg-zinc-50" />
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative mb-6 flex w-full max-w-2xl flex-col items-end gap-2 pl-24">
      <div className="relative mr-1 flex items-start gap-3">
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          className="mt-2"
        >
          <ActionBarPrimitive.Edit asChild>
            <IconButton tooltip="Edit">
              <PencilIcon className="size-4" />
            </IconButton>
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>

        <div className="max-w-xl break-words rounded-3xl bg-zinc-950/5 px-5 py-2.5 text-zinc-950 dark:bg-zinc-50/5 dark:text-zinc-50">
          <MessagePrimitive.Content />
        </div>
      </div>

      <BranchPicker />
    </MessagePrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="mb-4 flex w-full max-w-2xl flex-col gap-2 rounded-xl bg-zinc-950/5 dark:bg-zinc-50/5">
      <ComposerPrimitive.Input className="flex h-8 w-full resize-none bg-transparent p-5 pb-0 text-zinc-950 outline-none dark:text-zinc-50" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="secondary" className="bg-transparent">
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative mb-6 flex w-full max-w-2xl gap-3">
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>

      <div className="mt-2 flex-grow">
        <MessagePrimitive.InProgress className="inline-block size-3 animate-pulse rounded-full bg-zinc-950 dark:bg-zinc-50" />
        <div className="max-w-xl break-words text-zinc-950 dark:text-zinc-50">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>

        <div className="flex pt-2">
          <BranchPicker />

          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            autohideFloat="single-branch"
            className="z-50 flex items-center gap-1 rounded-lg data-[floating]:absolute data-[floating]:border data-[floating]:bg-white data-[floating]:p-1 dark:data-[floating]:bg-zinc-950"
          >
            <ActionBarPrimitive.Copy asChild>
              <IconButton tooltip="Copy">
                <MessagePrimitive.If copied>
                  <CheckIcon className="size-4" />
                </MessagePrimitive.If>
                <MessagePrimitive.If copied={false}>
                  <CopyIcon className="size-4" />
                </MessagePrimitive.If>
              </IconButton>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.Reload asChild>
              <IconButton tooltip="Refresh">
                <RefreshCwIcon className="size-4" />
              </IconButton>
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC = () => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className="inline-flex items-center text-xs text-zinc-950/60 dark:text-zinc-50/60"
    >
      <BranchPickerPrimitive.Previous asChild>
        <IconButton tooltip="Previous">
          <ChevronLeftIcon className="size-4" />
        </IconButton>
      </BranchPickerPrimitive.Previous>
      <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      <BranchPickerPrimitive.Next asChild>
        <IconButton tooltip="Next">
          <ChevronRightIcon className="size-4" />
        </IconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

type IconButton = ButtonProps & { tooltip: string };

const IconButton: FC<IconButton> = ({
  children,
  tooltip,
  className,
  ...rest
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-auto p-1", className)}
          {...rest}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
};
