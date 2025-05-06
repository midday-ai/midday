"use client";

import { FilePreview } from "@/components/file-preview";
import { useDocumentParams } from "@/hooks/use-document-params";
import { formatSize } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { X } from "lucide-react";

type Props = {
  file: any;
  onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
  const { setParams } = useDocumentParams();

  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-4 items-center">
        <div className="border w-[40px] h-[40px] overflow-hidden cursor-pointer">
          {file.isUploading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <button
              onClick={() => setParams({ filePath: file.path.join("/") })}
              className="w-full h-full"
              type="button"
            >
              <FilePreview
                mimeType={file.type}
                filePath={`${file?.path?.join("/")}`}
              />
            </button>
          )}
        </div>

        <div className="flex flex-col space-y-0.5 w-80">
          <span className="truncate">{file.name}</span>
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
}
