"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Input } from "@midday/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";

type ExcludedSender = NonNullable<
  RouterOutputs["inboxSettings"]["listExcludedSenders"]
>[number];

function ExcludedSenderItem({ sender }: { sender: ExcludedSender }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation(
    trpc.inboxSettings.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inboxSettings.listExcludedSenders.queryKey(),
        });
        setOpen(false);
        toast({
          title: "Sender removed",
          description: "Emails from this sender will no longer be filtered.",
          variant: "success",
        });
      },
      onError: () => {
        toast({
          title: "Failed to remove sender",
          description: "Please try again.",
          variant: "error",
        });
      },
    }),
  );

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{sender.settingValue}</span>
        <span className="text-muted-foreground text-xs">
          Added {formatDistanceToNow(new Date(sender.createdAt))} ago
        </span>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <TooltipProvider delayDuration={70}>
          <Tooltip>
            <AlertDialogTrigger asChild>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full w-7 h-7 flex items-center"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
            </AlertDialogTrigger>
            <TooltipContent className="px-3 py-1.5 text-xs" sideOffset={10}>
              Remove
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Excluded Sender</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this excluded sender? Emails from
              this address will no longer be filtered and will appear in your
              inbox.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate({ id: sender.id })}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExcludedSendersList() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.inboxSettings.listExcludedSenders.queryOptions(),
  );

  if (!data?.length) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          No excluded senders. Add email addresses to filter them from your
          inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 divide-y">
      {data.map((sender) => (
        <ExcludedSenderItem key={sender.id} sender={sender} />
      ))}
    </div>
  );
}

export function InboxExcludedSenders() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const createMutation = useMutation(
    trpc.inboxSettings.createExcludedSender.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inboxSettings.listExcludedSenders.queryKey(),
        });
        setEmail("");
        setOpen(false);
        toast({
          title: "Sender excluded",
          description:
            "Emails from this sender will be filtered from your inbox.",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to exclude sender",
          description:
            error.message || "Please check the email address and try again.",
          variant: "error",
        });
      },
    }),
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    createMutation.mutate({ senderEmail: email.trim() });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEmail("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Excluded Senders</CardTitle>
            <CardDescription>
              Exclude specific email addresses from appearing in your inbox.
              Emails from excluded senders will be filtered during sync and
              won't create inbox items.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Sender
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[455px]">
              <DialogHeader>
                <DialogTitle>Exclude Sender</DialogTitle>
                <DialogDescription>
                  Enter an email address to exclude from your inbox. Future
                  emails from this sender will be filtered automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <Input
                  type="email"
                  placeholder="sender@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createMutation.isPending}
                  autoFocus
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!email.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Exclude Sender"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <Suspense fallback={<div className="px-6 py-8">Loading...</div>}>
        <ExcludedSendersList />
      </Suspense>
    </Card>
  );
}
