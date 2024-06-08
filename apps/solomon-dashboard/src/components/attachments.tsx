"use client";

import { createAttachmentsAction } from "@/actions/create-attachments-action";
import { deleteAttachmentAction } from "@/actions/delete-attachment-action";
import { useUpload } from "@/hooks/use-upload";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { cn } from "@midday/ui/cn";
import { useToast } from "@midday/ui/use-toast";
import { stripSpecialCharacters } from "@midday/utils";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AttachmentItem } from "./attachment-item";
import { SelectAttachment } from "./select-attachment";

type Attachment = {
  type: string;
  name: string;
  size: number;
};

export function Attachments({ id, data }) {
  const supabase = createClient();
  const { toast } = useToast();
  const [files, setFiles] = useState<Attachment[]>([]);
  const { uploadFile } = useUpload();

  const createAttachments = useAction(createAttachmentsAction, {
    onSuccess: (newFiles) => {
      const uniqueFiles = new Set([...files, ...newFiles]);
      setFiles([...uniqueFiles]);
    },
  });

  const handleOnDelete = async (id: string) => {
    setFiles((files) => files.filter((file) => file?.id !== id));
    await deleteAttachmentAction(id);
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

    const { data: userData } = await getCurrentUserTeamQuery(supabase);

    const uploadedFiles = await Promise.all(
      acceptedFiles.map(async (acceptedFile) => {
        const filename = stripSpecialCharacters(acceptedFile.name);

        const { path } = await uploadFile({
          bucket: "vault",
          path: [userData?.team_id, "transactions", id, filename],
          file: acceptedFile,
        });

        return {
          path,
          name: filename,
          size: acceptedFile.size,
          transaction_id: id,
          type: acceptedFile.type,
        };
      })
    );

    createAttachments.execute(uploadedFiles);
  };

  const handleOnSelectFile = (file) => {
    const item = {
      transaction_id: id,
      name: file.name,
      size: file.data.size,
      type: file.data.content_type,
      path: file.data.file_path,
    };

    setFiles((prev) => [item, ...prev]);
    createAttachments.execute([item]);
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
    maxSize: 3000000, // 3MB
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
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
          "mt-4 w-full h-[120px] border-dotted border-2 border-border rounded-xl text-center flex flex-col justify-center space-y-1 transition-colors text-[#606060]",
          isDragActive && "bg-secondary text-primary"
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
        {files.map((file) => (
          <AttachmentItem
            key={file.name}
            id={id}
            file={file}
            onDelete={() => handleOnDelete(file?.id)}
          />
        ))}
      </ul>
    </div>
  );
}
