import { FileViewer } from "@/components/file-viewer";
import { formatSize } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { X } from "lucide-react";

type Props = {
  file: any;
  onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-4 items-center">
        <div className="border w-[40px] h-[40px] overflow-hidden cursor-pointer">
          {file.isUploading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <FileViewer
              mimeType={file.type}
              url={`/api/proxy?filePath=vault/${file?.path?.join("/")}`}
            />
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
