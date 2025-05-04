"use client";

import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AttachmentItem } from "./attachment-item";
import { SelectAttachment } from "./select-attachment";

type Attachment = {
  id?: string;
  type: string;
  name: string;
  size: number;
};

type Props = {
  id: string;
  data?: Attachment[];
};

export function TransactionAttachments({ id, data }: Props) {
  const { toast } = useToast();
  const [files, setFiles] = useState<Attachment[]>([]);
  const { uploadFile } = useUpload();
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();

  const processDocumentMutation = useMutation(
    trpc.documents.processDocument.mutationOptions(),
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
      },
    }),
  );

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
          path: [user?.team_id, "transactions", id, filename],
          file: acceptedFile as File,
        });

        return {
          path,
          name: filename,
          size: acceptedFile.size,
          type: acceptedFile.type,
        };
      }),
    );

    createAttachmentsMutation.mutate(
      uploadedFiles.map((file) => ({
        ...file,
        transaction_id: id,
      })),
    );

    processDocumentMutation.mutate(
      uploadedFiles.map((file) => ({
        file_path: file.path,
        mimetype: file.type,
        size: file.size,
      })),
    );
  };

  const handleOnSelectFile = (file) => {
    const filename = stripSpecialCharacters(file.name);

    const item = {
      name: filename,
      size: file.data.size,
      type: file.data.content_type,
      path: file.data.file_path,
      transaction_id: id,
    };

    setFiles((prev) => [item, ...prev]);
    createAttachmentsMutation.mutate([item]);
  };

  useEffect(() => {
    if (data) {
      setFiles(data);
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
    maxSize: 5000000, // 5MB
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
            <p className="text-xs text-dark-gray">5MB file limit.</p>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-4">
        {files.map((file, idx) => (
          <AttachmentItem
            key={`${file.name}-${idx}`}
            id={file.name}
            file={file}
            onDelete={() => handleOnDelete(file?.id)}
          />
        ))}
      </ul>
    </div>
  );
}
