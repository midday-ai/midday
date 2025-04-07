import { FilePreview } from "@/components/file-preview";
import { Tag } from "@/components/tables/vault/tag";
import type { RouterOutputs } from "@/trpc/routers/_app";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@midday/ui/hover-card";
import { isSupportedFilePreview } from "@midday/utils";

type Props = {
  files: RouterOutputs["vault"]["activity"];
};

export function Vault({ files }: Props) {
  const formattedFiles = files?.map((file) => {
    const [_, ...pathWithoutTeamId] = file?.path_tokens ?? [];
    const name = file.name?.split("/").at(-1) ?? "No name";
    const downloadPath = pathWithoutTeamId?.join("/");

    return {
      id: file.id,
      name,
      // @ts-expect-error
      mimetype: file.metadata?.mimetype,
      team_id: file.team_id,
      tag: file.tag ?? undefined,
      src: `/api/proxy?filePath=vault/${file.path_tokens?.join("/")}`,
      downloadUrl: `/api/download/file?path=${downloadPath}&filename=${name}`,
    };
  });

  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {formattedFiles?.map((file) => {
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
                    src={file.src}
                    downloadUrl={file.downloadUrl}
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
