import { Icons } from "@midday/ui/icons";

export function SearchFooter() {
  return (
    <div className="search-footer flex px-3 h-[40px] w-full border border-border border-t-[0px] items-center bg-background backdrop-filter backdrop-blur-lg dark:bg-[#0C0C0C]/[99]">
      <div className="scale-50 dark:opacity-50 -ml-1">
        <Icons.LogoSmall />
      </div>

      <div className="ml-auto flex space-x-2">
        <div className="size-6 select-none items-center border bg-accent flex justify-center">
          <Icons.ArrowUpward className="size-3 dark:text-[#666666] text-black" />
        </div>

        <div className="size-6 select-none items-center border bg-accent flex justify-center">
          <Icons.ArrowDownward className="size-3 dark:text-[#666666] text-black" />
        </div>

        <div className="size-6 select-none items-center border bg-accent flex justify-center">
          <Icons.SubdirectoryArrowLeft className="size-3 dark:text-[#666666] text-black" />
        </div>
      </div>
    </div>
  );
}
