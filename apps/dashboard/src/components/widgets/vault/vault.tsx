import { FilePreview } from "@/components/file-preview";
import { Tag } from "@/components/tables/vault/tag";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { isSupportedFilePreview } from "@midday/utils";

type Props = {
  files: {
    id: string;
    name: string;
    tag?: string;
    mimetype: string;
    team_id: string;
    filePath: string;
  }[];
};

export function Vault({ files }: Props) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {files?.map((file) => {
        const filePreviewSupported = isSupportedFilePreview(file.mimetype);

        return (
          <li key={file.id}>
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <div className="flex items-center py-3">
                  <div className="w-[55%]">
                    <span className="text-sm line-clamp-1">{file.name}</span>
                  </div>

                  <div className="ml-auto w-[40%] flex justify-end">
                    <Tag name={file.tag} />
                  </div>
                </div>
              </HoverCardTrigger>
              {filePreviewSupported && (
                <HoverCardContent className="w-[273px] h-[358px] p-0 overflow-hidden">
                  <FilePreview
                    width={280}
                    height={365}
                    src={`/api/proxy?filePath=vault/${file.team_id}/${file.filePath}/${file.name}`}
                    downloadUrl={`/api/download/file?path=${file.filePath}/${file.name}&filename=${file.name}`}
                    name={file.name}
                    type={file?.mimetype}
                  />
                </HoverCardContent>
              )}
            </HoverCard>
          </li>
        );
      })}
    </ul>
  );
}
