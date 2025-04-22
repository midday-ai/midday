import type { RouterOutputs } from "@/trpc/routers/_app";

type Props = {
  files: RouterOutputs["vault"]["activity"];
};

export function Vault({ files }: Props) {
  return (
    <ul className="bullet-none divide-y cursor-pointer overflow-auto scrollbar-hide aspect-square pb-24">
      {files?.map((file) => {
        return (
          <li key={file.id}>
            <div className="flex items-center py-3">
              <span className="text-sm line-clamp-1">
                {file.name?.split("/").pop()}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
