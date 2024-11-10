import { formatSize } from "@/utils/format";
import { Button } from "@midday/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { Skeleton } from "@midday/ui/skeleton";
import { isSupportedFilePreview } from "@midday/utils";
import { X } from "lucide-react";
import { FilePreview } from "./file-preview";

type Props = {
  file: any;
  onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
  const filePreviewSupported = isSupportedFilePreview(file.type);

  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-4 items-center">
        <HoverCard openDelay={200}>
          <HoverCardTrigger>
            <div className="border w-[40px] h-[40px] overflow-hidden cursor-pointer">
              {file.isUploading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <FilePreview
                  src={`/api/proxy?filePath=vault/${file?.path?.join("/")}`}
                  name={file.name}
                  type={file.type}
                  preview
                  width={45}
                  height={100}
                  // Wait for the sheet to open before loading the file
                  delay={100}
                />
              )}
            </div>
          </HoverCardTrigger>
          {filePreviewSupported && (
            <HoverCardContent
              className="w-[273px] h-[358px] p-0 overflow-hidden"
              side="left"
              sideOffset={55}
            >
              <FilePreview
                src={`/api/proxy?filePath=vault/${file?.path?.join("/")}`}
                downloadUrl={`/api/download/file?path=${file?.path
                  ?.slice(1)
                  .join("/")}&filename=${file.name}`}
                name={file.name}
                type={file.type}
                width={280}
                height={365}
              />
            </HoverCardContent>
          )}
        </HoverCard>

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
