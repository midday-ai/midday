"use client";

import { BotCard } from "@/components/chat/messages";
import { FilePreview } from "@/components/file-preview";
import type { FileType } from "@midday/utils";

type Document = {
  id: string;
  display_name: string;
  size: number;
  file_path: string[];
  content_type: FileType;
};

type Props = {
  data?: Document[];
};

export function DocumentsUI({ data }: Props) {
  return (
    <BotCard className="font-sans space-y-4">
      <div className="w-full overflow-auto space-x-4 flex">
        {data?.map((item) => {
          const filename = item.file_path?.at(-1);
          const [, ...rest] = item.file_path;
          // Without team_id
          const downloadPath = rest.join("/");

          return (
            <FilePreview
              width={150}
              height={198}
              key={item.id}
              preview
              type={item.content_type}
              download
              downloadUrl={`/api/download/file?path=${downloadPath}&filename=${filename}`}
              src={`/api/proxy?filePath=vault/${item?.file_path?.join("/")}`}
            />
          );
        })}
      </div>
    </BotCard>
  );
}
