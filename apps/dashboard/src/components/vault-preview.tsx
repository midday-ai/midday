"use client";

import { FilePreview } from "@/components/file-preview";
import { formatSize } from "@/utils/format";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { isSupportedFilePreview } from "@midday/utils";
import { FileIcon } from "./file-icon";

export function VaultPreview({ file }) {
  const filename = file.name.split("/").pop();
  // NOTE: Remove teamId from path
  const [, ...rest] = file.path;
  const downloadPath = [rest, filename].join("/");

  if (isSupportedFilePreview(file.mimetype)) {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger
          className="text-center flex flex-col items-center"
          key={file.id}
        >
          <div className="w-[65px] h-[75px] bg-[#F2F1EF] dark:bg-secondary flex items-center justify-center p-2 overflow-hidden mb-2">
            <FilePreview
              src={`/api/proxy?filePath=vault/${file.name}`}
              name={file.name}
              type={file.mimetype}
              preview
              width={45}
              height={57}
            />
          </div>

          <span className="text-sm truncate w-[70px]">{filename}</span>
          <span className="text-sm mt-1 text-[#878787]">
            {formatSize(file.size)}
          </span>
        </HoverCardTrigger>
        <HoverCardContent
          className="w-[273px] h-[358px] p-0 overflow-hidden"
          sideOffset={-40}
        >
          <FilePreview
            src={`/api/proxy?filePath=vault/${file.name}`}
            downloadUrl={`/api/download/file?path=${downloadPath}&filename=${filename}`}
            name={file.name}
            type={file.mimetype}
            width={280}
            height={365}
            onOpen={() => setOpen(false)}
          />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <div className="text-center flex flex-col items-center" key={file.id}>
      <FileIcon
        isFolder={false}
        mimetype={file.mimetype}
        name={file.name}
        size={65}
        className="dark:text-[#2C2C2C] mb-0"
      />
      <span className="text-sm truncate w-[70px]">{filename}</span>
      <span className="text-sm mt-1 text-[#878787]">
        {formatSize(file.size)}
      </span>
    </div>
  );
}
