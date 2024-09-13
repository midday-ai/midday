import { useRouter } from "next/navigation";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";

type Props = {
  onSubmit: () => void;
};

export function Footer({ onSubmit }: Props) {
  const router = useRouter();

  return (
    <div className="flex h-[40px] w-full items-center border-t-[1px] bg-background px-3 backdrop-blur-lg backdrop-filter dark:border-[#2C2C2C] dark:bg-[#151515]/[99]">
      <Popover>
        <PopoverTrigger>
          <div className="-ml-2 scale-50 opacity-50">
            <Icons.LogoSmall />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="-ml-2 w-auto rounded-lg bg-background p-2 backdrop-blur-lg backdrop-filter dark:border-[#2C2C2C] dark:bg-[#1A1A1A]/95"
          side="top"
          align="start"
          sideOffset={10}
        >
          <ul className="flex flex-col space-y-2">
            <li>
              <button
                type="button"
                className="flex w-full items-center space-x-2 rounded-md p-1 text-xs transition-colors hover:bg-[#2b2b2b]"
                onClick={() => router.push("https://x.com/middayai")}
              >
                <Icons.X className="h-[16px] w-[16px]" />
                <span>Follow us</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex w-full items-center space-x-2 rounded-md p-1 text-xs transition-colors hover:bg-[#2b2b2b]"
                onClick={() => router.push("https://discord.com/")}
              >
                <Icons.Discord className="h-[16px] w-[16px]" />
                <span>Join Our Community</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className="flex w-full items-center space-x-2 rounded-md p-1 text-xs transition-colors hover:bg-[#2b2b2b]"
                onClick={() =>
                  router.push(
                    "https://github.com/SolomonAIEngineering/frontend-financial-platform",
                  )
                }
              >
                <Icons.GithubOutline className="h-[16px] w-[16px]" />
                <span>Github</span>
              </button>
            </li>
          </ul>
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex space-x-4">
        <button
          className="flex items-center space-x-2 text-xs"
          type="button"
          onClick={onSubmit}
        >
          <span>Submit</span>
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-accent px-1.5 font-mono text-[10px] font-medium">
            <span>↵</span>
          </kbd>
        </button>
      </div>
    </div>
  );
}
