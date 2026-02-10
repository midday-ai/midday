"use client";

import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { X } from "lucide-react";
import { useDocumentParams } from "@/hooks/use-document-params";
import { formatSize } from "@/utils/format";
import { FilePreview } from "./file-preview";

export type Attachment = {
  id?: string;
  type: string;
  name: string;
  size: number;
  isUploading?: boolean;
  path?: string[];
};

type Props = {
  file: Attachment;
  onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
  const { setParams } = useDocumentParams();

  const handleClick = () => {
    if (!file.isUploading && file?.path) {
      setParams({ filePath: file.path.join("/") });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={handleClick}
        className="flex space-x-4 items-center flex-1 text-left hover:opacity-80 transition-opacity"
        type="button"
        disabled={file.isUploading || !file?.path}
      >
        <div className="relative w-[40px] h-[40px] overflow-hidden flex-shrink-0">
          {file.isUploading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <FilePreview
              mimeType={file.type}
              filePath={`${file?.path?.join("/")}`}
              lazy
              fixedSize={{ width: 30, height: 40 }}
            />
          )}
        </div>

        <div className="flex flex-col space-y-0.5 w-80 min-w-0">
          <span className="truncate">{file.name}</span>
          <span className="text-xs text-[#606060]">
            {file.size && formatSize(file.size)}
          </span>
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="w-auto hover:bg-transparent flex flex-shrink-0"
        onClick={handleDeleteClick}
      >
        <X size={14} />
      </Button>
    </div>
  );
}
