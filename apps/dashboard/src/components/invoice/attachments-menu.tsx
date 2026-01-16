"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/cn";
import { stripSpecialCharacters } from "@midday/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentsMenu() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { invoiceId } = useInvoiceParams();
  const { data: user } = useUserQuery();
  const { uploadFile, isLoading: isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing attachments
  const { data: attachments = [], isLoading: isLoadingAttachments } = useQuery({
    ...trpc.invoiceAttachments.getByInvoiceId.queryOptions({
      invoiceId: invoiceId!,
    }),
    enabled: !!invoiceId,
  });

  const createAttachmentsMutation = useMutation(
    trpc.invoiceAttachments.createMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceAttachments.getByInvoiceId.queryKey({
            invoiceId: invoiceId!,
          }),
        });
        toast({
          title: "Attachment uploaded",
          description: "The file has been attached to the invoice.",
        });
      },
      onError: (error) => {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to attach file to invoice.",
          variant: "error",
        });
      },
    }),
  );

  const deleteAttachmentMutation = useMutation(
    trpc.invoiceAttachments.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceAttachments.getByInvoiceId.queryKey({
            invoiceId: invoiceId!,
          }),
        });
        toast({
          title: "Attachment removed",
          description: "The file has been removed from the invoice.",
        });
      },
      onError: () => {
        toast({
          title: "Failed to remove attachment",
          variant: "error",
        });
      },
    }),
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate we haven't exceeded the limit
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum attachments reached",
        description: `You can only attach up to ${MAX_ATTACHMENTS} files per invoice.`,
        variant: "error",
      });
      return;
    }

    // Filter and validate files
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      // Check file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: `"${file.name}" is not a PDF. Only PDF files are allowed.`,
          variant: "error",
        });
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `"${file.name}" exceeds the 10MB limit.`,
          variant: "error",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Only take files up to the remaining slots
    const filesToUpload = validFiles.slice(0, remainingSlots);

    try {
      // Upload files to storage
      const uploadedFiles = await Promise.all(
        filesToUpload.map(async (file) => {
          const filename = stripSpecialCharacters(file.name);
          const path = [
            user?.teamId ?? "",
            "invoice-attachments",
            invoiceId!,
            `${Date.now()}-${filename}`,
          ];

          await uploadFile({
            bucket: "vault",
            path,
            file,
          });

          return {
            name: filename,
            path,
            size: file.size,
            invoiceId: invoiceId!,
          };
        }),
      );

      // Create database records
      createAttachmentsMutation.mutate(uploadedFiles);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "error",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (attachmentId: string) => {
    deleteAttachmentMutation.mutate({ id: attachmentId });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Don't render if there's no invoice ID (new invoice that hasn't been saved yet)
  if (!invoiceId) {
    return (
      <button
        type="button"
        className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground cursor-not-allowed opacity-50"
        disabled
        title="Save invoice first to add attachments"
      >
        <Icons.Attachments className="size-4" />
      </button>
    );
  }

  const isPending =
    isUploading ||
    createAttachmentsMutation.isPending ||
    deleteAttachmentMutation.isPending;

  const canAddMore = attachments.length < MAX_ATTACHMENTS;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={isPending || !canAddMore}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-9 w-9 flex items-center justify-center border border-border hover:bg-accent transition-colors relative",
              isPending && "opacity-50",
            )}
            disabled={isPending}
          >
            {isPending ? (
              <Spinner size={16} />
            ) : (
              <>
                <Icons.Attachments className="size-4" />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {isLoadingAttachments ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size={16} />
            </div>
          ) : (
            <>
              {attachments.length > 0 && (
                <>
                  {attachments.map((attachment) => (
                    <DropdownMenuItem
                      key={attachment.id}
                      className="flex items-center justify-between group cursor-default"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icons.PdfOutline className="size-4 shrink-0 text-red-500" />
                        <span className="text-xs truncate">{attachment.name}</span>
                        {attachment.size && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatFileSize(attachment.size)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={() => handleDelete(attachment.id)}
                        disabled={deleteAttachmentMutation.isPending}
                      >
                        <Icons.Delete className="size-3 text-destructive" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddMore || isPending}
                className="text-xs cursor-pointer"
              >
                <Icons.Add className="mr-2 size-4" />
                {canAddMore
                  ? `Add PDF (${attachments.length}/${MAX_ATTACHMENTS})`
                  : `Maximum ${MAX_ATTACHMENTS} attachments`}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
