import { Icons } from "@midday/ui/icons";

export function SearchFooter() {
  return (
    <div className="flex px-3 h-[40px] w-full border border-border border-t-[0px] items-center bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99]">
      <div className="scale-50 dark:opacity-50 -ml-1">
        <Icons.LogoSmall />
      </div>

      <div className="ml-auto flex space-x-4">
        <div className="flex space-x-2 items-center text-xs">
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 border bg-accent px-1.5 font-mono text-[10px] font-medium">
            <span>↵</span>
          </kbd>
        </div>
      </div>
    </div>
  );
}
