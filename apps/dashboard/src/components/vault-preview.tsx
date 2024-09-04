"use client";

import { FilePreview } from "@/components/file-preview";
import { formatSize } from "@/utils/format";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { type FileType, isSupportedFilePreview } from "@midday/utils";
import { FileIcon } from "./file-icon";

type Props = {
  preview?: boolean;
  height?: number;
  width?: number;
  file: {
    id: string;
    path: string[];
    mimetype: FileType;
    size?: number;
  };
};

export function VaultPreview({
  file,
  preview = true,
  width = 45,
  height = 57,
}: Props) {
  const filename = file.path?.at(-1);
  const [, ...rest] = file.path;
  // Without team_id
  const downloadPath = rest.join("/");

  if (isSupportedFilePreview(file.mimetype)) {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger
          className="text-center flex flex-col items-center"
          key={file.id}
        >
          <div
            className="bg-[#F2F1EF] dark:bg-secondary flex items-center justify-center p-2 overflow-hidden mb-2"
            style={{ width: width + 20, height: height + 20 }}
          >
            <FilePreview
              src={`/api/proxy?filePath=vault/${file?.path?.join("/")}`}
              name={filename ?? ""}
              type={file.mimetype}
              preview
              width={width}
              height={height}
            />
          </div>

          <span className="text-sm truncate w-[70px]">{filename}</span>
          {file.size && (
            <span className="text-sm mt-1 text-[#878787]">
              {formatSize(file.size)}
            </span>
          )}
        </HoverCardTrigger>
        {preview && (
          <HoverCardContent
            className="w-[273px] h-[358px] p-0 overflow-hidden"
            sideOffset={-40}
          >
            <FilePreview
              src={`/api/proxy?filePath=vault/${file?.path?.join("/")}`}
              downloadUrl={`/api/download/file?path=${downloadPath}&filename=${filename}`}
              name={filename ?? ""}
              type={file.mimetype}
              width={280}
              height={365}
            />
          </HoverCardContent>
        )}
      </HoverCard>
    );
  }

  return (
    <div className="text-center flex flex-col items-center" key={file.id}>
      <FileIcon
        isFolder={false}
        mimetype={file.mimetype}
        name={filename ?? ""}
        size={65}
        className="dark:text-[#2C2C2C] mb-0"
      />
      <span className="text-sm truncate w-[70px]">{filename}</span>
      <span className="text-sm mt-1 text-[#878787]">
        {file.size && formatSize(file.size)}
      </span>
    </div>
  );
}
