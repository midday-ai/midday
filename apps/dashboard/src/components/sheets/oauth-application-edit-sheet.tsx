"use client";

import { OAuthApplicationForm } from "@/components/forms/oauth-application-form";
import { DeleteOAuthApplicationModal } from "@/components/modals/delete-oauth-application-modal";
import { OAuthApplicationStatusBadge } from "@/components/oauth-application-status-badge";
import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { useTRPC } from "@/trpc/client";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

export function OAuthApplicationEditSheet() {
  const trpc = useTRPC();
  const { toast } = useToast();
  const [, copy] = useCopyToClipboard();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();
  const { setParams, applicationId, editApplication } =
    useOAuthApplicationParams();

  const isOpen = Boolean(applicationId && editApplication);

  const { data: application } = useQuery(
    trpc.oauthApplications.get.queryOptions(
      { id: applicationId! },
      {
        enabled: isOpen,
      },
    ),
  );

  const submitForReviewMutation = useMutation(
    trpc.oauthApplications.updateApprovalStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.get.queryKey(),
        });
        toast({
          title: "Submitted for review",
          description:
            "Your application has been submitted for review and will be visible once approved.",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to submit for review",
          variant: "destructive",
        });
      },
    }),
  );

  const makeDraftMutation = useMutation(
    trpc.oauthApplications.updateApprovalStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.get.queryKey(),
        });
        toast({
          title: "Application moved to draft",
          description:
            "Your application has been moved back to draft status and removed from review.",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to move to draft",
          variant: "destructive",
        });
      },
    }),
  );

  const handleCopyClientId = () => {
    if (application?.clientId) {
      copy(application.clientId);
      toast({
        title: "Client ID copied to clipboard",
        variant: "success",
      });
    }
  };

  const handleSubmitForReview = () => {
    if (applicationId) {
      submitForReviewMutation.mutate({
        id: applicationId,
        status: "pending",
      });
    }
  };

  const handleMakeDraft = () => {
    if (applicationId) {
      makeDraftMutation.mutate({
        id: applicationId,
        status: "draft",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Edit OAuth Application</h2>

          <div className="flex items-center gap-2">
            {application?.status && (
              <OAuthApplicationStatusBadge status={application.status} />
            )}

            {applicationId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button">
                    <Icons.MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={10} align="end">
                  <DropdownMenuItem onClick={handleCopyClientId}>
                    Copy Client ID
                  </DropdownMenuItem>
                  {application?.status === "draft" && (
                    <DropdownMenuItem
                      onClick={handleSubmitForReview}
                      disabled={submitForReviewMutation.isPending}
                    >
                      {submitForReviewMutation.isPending
                        ? "Submitting..."
                        : "Submit for review"}
                    </DropdownMenuItem>
                  )}
                  {application?.status === "pending" && (
                    <DropdownMenuItem
                      onClick={handleMakeDraft}
                      disabled={makeDraftMutation.isPending}
                    >
                      {makeDraftMutation.isPending
                        ? "Cancelling review..."
                        : "Cancel review"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-10" hideScrollbar>
          <OAuthApplicationForm data={application} key={application?.id} />
        </ScrollArea>
      </SheetContent>

      <DeleteOAuthApplicationModal
        applicationId={applicationId!}
        applicationName={application?.name || ""}
        isOpen={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </Sheet>
  );
}
