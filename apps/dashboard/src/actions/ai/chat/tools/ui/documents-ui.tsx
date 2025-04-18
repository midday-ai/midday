"use client";

import { BotCard } from "@/components/chat/messages";
import { FileViewer } from "@/components/file-viewer";

type Document = {
  id: string;
  display_name: string;
  size: number;
  file_path: string[];
  content_type: string;
};

type Props = {
  data?: Document[];
};

export function DocumentsUI({ data }: Props) {
  if (!data?.length) {
    return (
      <BotCard>
        No documents were found for your request. Please try a different
        message.
      </BotCard>
    );
  }

  return (
    <BotCard className="font-sans space-y-4">
      <p className="font-mono">
        We found {data.length} documents based on your search
      </p>

      <div className="w-full overflow-auto space-x-4 flex scrollbar-hide max-w-[671px] pr-4">
        {data?.map((item) => {
          return (
            <div key={item.id}>
              <FileViewer
                mimeType={item.content_type}
                url={`/api/proxy?filePath=vault/${item?.file_path?.join("/")}`}
              />
            </div>
          );
        })}
      </div>
    </BotCard>
  );
}
