"use client";

import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { CopyInput } from "@/components/copy-input";
import { OpenURL } from "@/components/open-url";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import type { ReportType } from "../utils/chart-types";

interface ShareMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReportType;
  from: string;
  to: string;
  currency?: string;
}

export function ShareMetricModal({
  isOpen,
  onClose,
  type,
  from,
  to,
  currency,
}: ShareMetricModalProps) {
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const [expireAt, setExpireAt] = useState<Date | undefined>(
    addDays(new Date(), 30),
  );

  const createReportMutation = useMutation(
    trpc.reports.create.mutationOptions(),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset mutation state when closing
      createReportMutation.reset();
      setExpireAt(addDays(new Date(), 30));
    }
  };

  const handleCreateLink = () => {
    createReportMutation.mutate({
      type,
      from,
      to,
      currency,
      expireAt: expireAt?.toISOString(),
    });
  };

  const shareUrl = createReportMutation.data
    ? `${getUrl()}/r/${createReportMutation.data.linkId}`
    : "";

  const openInX = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://x.com/intent/tweet?url=${url}`, "_blank");
  };

  const openInLinkedIn = () => {
    if (!shareUrl) return;
    // Ensure URL is absolute and properly formatted
    const absoluteUrl = shareUrl.startsWith("http")
      ? shareUrl
      : `https://${shareUrl}`;

    // LinkedIn share URL - encode the URL parameter
    // LinkedIn's share-offsite endpoint requires URL encoding
    const encodedUrl = encodeURIComponent(absoluteUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank",
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Share metric</DialogTitle>
            <DialogDescription>
              Create a public link you can share, the chart is a snapshot in
              time.
            </DialogDescription>
          </DialogHeader>

          {!createReportMutation.data && !createReportMutation.error && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expire-date">Expires</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="expire-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={createReportMutation.isPending}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expireAt ? format(expireAt, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      weekStartsOn={user?.weekStartsOnMonday ? 1 : 0}
                      selected={expireAt}
                      onSelect={setExpireAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <DialogFooter>
                <SubmitButton
                  onClick={handleCreateLink}
                  className="w-full"
                  isSubmitting={createReportMutation.isPending}
                >
                  Create link
                </SubmitButton>
              </DialogFooter>
            </div>
          )}

          {createReportMutation.error && (
            <div className="space-y-4">
              <div className="text-sm text-destructive">
                Failed to create share link. Please try again.
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateLink}
                  variant="outline"
                  className="w-full"
                >
                  Try again
                </Button>
              </DialogFooter>
            </div>
          )}

          {createReportMutation.data && (
            <div className="space-y-4">
              <div className="relative">
                <CopyInput value={shareUrl} className="pr-14" />
                <div className="absolute right-10 top-[11px] border-r border-border pr-2">
                  <OpenURL href={shareUrl}>
                    <Icons.OpenInNew />
                  </OpenURL>
                </div>
              </div>

              {createReportMutation.data.expireAt && (
                <p className="text-xs text-muted-foreground">
                  Expires{" "}
                  {format(new Date(createReportMutation.data.expireAt), "PPP")}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={openInX}>
                  Open in
                  <FaXTwitter className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={openInLinkedIn}
                >
                  Open in
                  <FaLinkedinIn className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
