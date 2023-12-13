"use client";

import { createAttachmentsAction } from "@/actions/create-attachments-action";
import { deleteAttachmentAction } from "@/actions/delete-attachment-action";
import { useUpload } from "@/hooks/use-upload";
import { formatSize } from "@/utils/format";
import { createClient } from "@midday/supabase/client";
import { getCurrentUserTeamQuery } from "@midday/supabase/queries";
import { Button } from "@midday/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { cn } from "@midday/ui/utils";
import { File, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const Item = ({ file, onDelete, id }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-4 items-center">
        <HoverCard openDelay={300}>
          <HoverCardTrigger>
            <div className="rounded-md border w-[40px] h-[40px] flex items-center justify-center overflow-hidden cursor-pointer">
              {/* <File size={18} /> */}

              <embed
                src={`https://service.midday.ai/storage/v1/object/public/vault/${file.path}#toolbar=0`}
                title={file.name}
                className="w-[40px] h-[40px] pointer-none"
              />
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            className="w-70 h-[350px]"
            side="left"
            sideOffset={55}
          >
            <embed
              src={`https://service.midday.ai/storage/v1/object/public/vault/${file.path}#toolbar=0`}
              title={file.name}
              className="w-80 h-full"
            />
          </HoverCardContent>
        </HoverCard>

        <div className="flex flex-col space-y-0.5 w-80">
          <a
            href={`/api/download/file?path=transactions/${id}/${file.name}&filename=${file.name}`}
            download
            className="truncate"
          >
            {file.name}
          </a>
          <span className="text-xs text-[#606060]">
            {file.size && formatSize(file.size)}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-auto hover:bg-transparent flex"
        onClick={onDelete}
      >
        <X size={14} />
      </Button>
    </div>
  );
};

type Attachment = {
  type: string;
  name: string;
  size: number;
};

export function Attachments({ id, data }) {
  const supabase = createClient();
  const [files, setFiles] = useState<Attachment[]>([]);
  const { uploadFile } = useUpload();

  const handleOnDelete = async (id: string) => {
    setFiles((files) => files.filter((file) => file.id !== id));
    await deleteAttachmentAction(id);
  };

  const onDrop = async (acceptedFiles: Array<Attachment>) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);

    const { data: userData } = await getCurrentUserTeamQuery(supabase);

    const uploadedFiles = await Promise.all(
      acceptedFiles.map(async (acceptedFile) => {
        const { path } = await uploadFile({
          bucket: "vault",
          path: `${userData?.team_id}/transactions/${id}`,
          file: acceptedFile,
        });

        return {
          path,
          name: acceptedFile.name,
          size: acceptedFile.size,
          transaction_id: id,
          type: acceptedFile.type,
        };
      })
    );

    const { data: newFiles } = await createAttachmentsAction(uploadedFiles);
    const uniqueFiles = new Set([...files, ...newFiles]);
    setFiles([...uniqueFiles]);
  };

  useEffect(() => {
    if (data) {
      setFiles(data);
    }
  }, [data]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div
        className={cn(
          "w-full h-[120px] border-dotted border-2 border-border rounded-xl text-center flex flex-col justify-center space-y-1 transition-colors text-[#606060]",
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
          <Item
            key={file.name}
            id={id}
            file={file}
            onDelete={() => handleOnDelete(file.id)}
          />
        ))}
      </ul>
    </div>
  );
}
