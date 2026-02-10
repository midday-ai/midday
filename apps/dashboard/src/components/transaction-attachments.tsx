"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount } from "@/utils/format";
import { type Attachment, AttachmentItem } from "./attachment-item";
import { SelectAttachment } from "./select-attachment";

const normalizePath = (path: unknown): string[] => {
  if (Array.isArray(path)) return path;
  if (typeof path === "string") return path.split("/");
  return [];
};

type Props = {
  id: string;
  data?: NonNullable<RouterOutputs["transactions"]["getById"]>["attachments"];
  onUpload?: (files: Attachment[]) => void;
};

export function TransactionAttachments({ id, data, onUpload }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<Attachment[]>([]);
  const { uploadFile } = useUpload();
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();
  const [pollingForTax, setPollingForTax] = useState(false);

  const processTransactionAttachmentMutation = useMutation(
    trpc.transactionAttachments.processAttachment.mutationOptions(),
  );

  const createAttachmentsMutation = useMutation(
    trpc.transactionAttachments.createMany.mutationOptions({
      onSuccess: () => {
        // invalidate the transaction list query
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id }),
        });

        // Start polling for tax information
        if (
          pollingTransaction?.taxRate !== pollingTransaction?.category?.taxRate
        ) {
          setPollingForTax(true);
        }
      },
    }),
  );

  const deleteattachmentMutation = useMutation(
    trpc.transactionAttachments.delete.mutationOptions({
      onSuccess: () => {
        // invalidate the transaction details query
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        // Invalidate inbox queries since inbox items may be connected to this attachment
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const updateInvoiceMutation = useMutation(
    trpc.invoice.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoice.get.queryKey(),
        });
      },
    }),
  );

  // Polling query for tax information
  const { data: pollingTransaction } = useQuery({
    ...trpc.transactions.getById.queryOptions({ id }),
    enabled: pollingForTax,
    refetchInterval: pollingForTax ? 1000 : false,
  });

  // Handle tax information detection
  useEffect(() => {
    if (
      pollingForTax &&
      pollingTransaction?.taxRate &&
      pollingTransaction?.taxRate > 0 &&
      pollingTransaction?.taxType
    ) {
      toast({
        variant: "success",
        duration: 8000,
        title: `${getTaxTypeLabel(pollingTransaction?.taxType)} extracted and applied`,
        description: `${pollingTransaction?.taxRate}% ${getTaxTypeLabel(pollingTransaction?.taxType)} (${formatAmount(
          {
            amount: pollingTransaction?.taxAmount!,
            currency: pollingTransaction?.currency!,
            locale: user?.locale,
          },
        )}) was detected from the uploaded receipt and added to this transaction.`,
      });

      // invalidate the transaction details query
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.getById.queryKey({ id }),
      });

      // invalidate the transaction list query
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.infiniteQueryKey(),
      });

      setPollingForTax(false);
    }
  }, [
    pollingTransaction,
    pollingForTax,
    toast,
    trpc.transactions.getById.queryKey,
    queryClient.invalidateQueries,
    user?.locale,
    trpc.transactions.get.infiniteQueryKey,
    id,
  ]);

  // Stop polling after 10 seconds
  useEffect(() => {
    if (pollingForTax) {
      const timeout = setTimeout(() => {
        setPollingForTax(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [pollingForTax]);

  const handleOnDelete = (id: string) => {
    setFiles((files) => files.filter((file) => file?.id !== id));
    deleteattachmentMutation.mutate({ id });
  };

  const onDrop = async (acceptedFiles: Array<Attachment>) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((a) => ({
        name: stripSpecialCharacters(a.name),
        size: a.size,
        type: a.type,
        isUploading: true,
      })),
    ]);

    const uploadedFiles = await Promise.all(
      acceptedFiles.map(async (acceptedFile) => {
        const filename = stripSpecialCharacters(acceptedFile.name);

        const { path } = await uploadFile({
          bucket: "vault",
          path: [user?.teamId ?? "", "transactions", id, filename],
          file: acceptedFile as File,
        });

        return {
          path: path,
          name: filename,
          size: acceptedFile.size,
          type: acceptedFile.type,
        };
      }),
    );

    onUpload?.(uploadedFiles);

    createAttachmentsMutation.mutate(
      uploadedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        path: file.path,
        size: file.size,
        transactionId: id,
      })),
    );

    processTransactionAttachmentMutation.mutate(
      uploadedFiles.map((file) => ({
        filePath: file.path,
        mimetype: file.type,
        transactionId: id,
      })),
    );
  };

  // @ts-expect-error
  const handleOnSelectFile = async (file) => {
    const isInvoice = file.type === "invoice";

    if (isInvoice) {
      // Handle invoice selection
      try {
        // Fetch transaction to get the date
        const transactionData = await queryClient.fetchQuery(
          trpc.transactions.getById.queryOptions({ id }),
        );

        if (!transactionData?.date) {
          toast({
            variant: "error",
            duration: 2500,
            title: "Failed to get transaction date",
          });
          return;
        }

        // Convert transaction date (ISO date string) to ISO datetime for paidAt
        const transactionDate = parseISO(transactionData.date).toISOString();

        // Update invoice status to paid
        await updateInvoiceMutation.mutateAsync({
          id: file.data.id,
          status: "paid",
          paidAt: transactionDate,
        });

        // Create transaction attachment using invoice filePath
        if (!file.data.filePath || file.data.filePath.length === 0) {
          toast({
            variant: "error",
            duration: 2500,
            title: "Invoice PDF not found",
          });
          return;
        }

        const invoiceFilename =
          file.data.invoiceNumber || `invoice-${file.data.id}.pdf`;

        const attachmentItem = {
          name: stripSpecialCharacters(invoiceFilename),
          size: file.data.size ?? 0,
          type: "application/pdf",
          path: file.data.filePath,
          transactionId: id,
        };

        setFiles((prev) => [attachmentItem, ...prev]);
        createAttachmentsMutation.mutate([attachmentItem]);
      } catch (error) {
        console.error("Error handling invoice selection:", error);
        toast({
          variant: "error",
          duration: 2500,
          title: "Failed to attach invoice",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } else {
      // Handle inbox item selection (existing logic)
      const filename = stripSpecialCharacters(file.name);

      const item = {
        name: filename,
        size: file.data.size,
        type: file.data.contentType,
        path: file.data.filePath,
        transactionId: id,
      };

      setFiles((prev) => [item, ...prev]);
      createAttachmentsMutation.mutate([item]);
    }
  };

  useEffect(() => {
    if (data) {
      setFiles(
        data.map((item) => ({
          id: item.id,
          name: item.filename!,
          path: normalizePath(item?.path),
          size: item.size,
          type: item.type,
        })),
      );
    }
  }, [data]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: ([reject]) => {
      if (reject?.errors.find(({ code }) => code === "file-too-large")) {
        toast({
          duration: 2500,
          variant: "error",
          title: "File size to large.",
        });
      }

      if (reject?.errors.find(({ code }) => code === "file-invalid-type")) {
        toast({
          duration: 2500,
          variant: "error",
          title: "File type not supported.",
        });
      }
    },
    maxSize: 3000000, // 3MB
    accept: {
      "image/*": [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".heic",
        ".heif",
        ".avif",
        ".tiff",
        ".bmp",
      ],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div>
      <SelectAttachment
        placeholder="Search attachment"
        onSelect={handleOnSelectFile}
        transactionId={id}
      />
      <div
        className={cn(
          "mt-4 w-full h-[120px] border-dotted border-2 border-border text-center flex flex-col justify-center space-y-1 transition-colors text-[#606060]",
          isDragActive && "bg-secondary text-primary",
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div>
            <p className="text-xs">Drop your files upload</p>
          </div>
        ) : (
          <div>
            <p className="text-xs">
              Drop your files here, or{" "}
              <span className="underline underline-offset-1">
                click to browse.
              </span>
            </p>
            <p className="text-xs text-dark-gray">3MB file limit.</p>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-4">
        {files.map((file, idx) => (
          <AttachmentItem
            key={`${file.name}-${idx}`}
            file={file}
            onDelete={() => handleOnDelete(file?.id!)}
          />
        ))}
      </ul>
    </div>
  );
}
