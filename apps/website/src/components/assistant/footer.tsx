import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useRouter } from "next/navigation";

type Props = {
  onSubmit: () => void;
};

export function Footer({ onSubmit }: Props) {
  const router = useRouter();

  return (
    <div className="flex px-3 h-[40px] w-full border-t-[1px] items-center bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99]">
      <Popover>
        <PopoverTrigger>
          <div className="scale-50 dark:opacity-50 -ml-2">
            <Icons.LogoSmall />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#1A1A1A]/95 p-2 rounded-lg -ml-2 w-auto"
          side="top"
          align="start"
          sideOffset={10}
        >
          <ul className="flex flex-col space-y-2">
            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => router.push("https://x.com/middayai")}
              >
                <Icons.X className="w-[16px] h-[16px]" />
                <span>Follow us</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => router.push("https://go.midday.ai/anPiuRx")}
              >
                <Icons.Discord className="w-[16px] h-[16px]" />
                <span>Join Our Community</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => router.push("https://git.new/midday")}
              >
                <Icons.GithubOutline className="w-[16px] h-[16px]" />
                <span>Github</span>
              </button>
            </li>
          </ul>
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex space-x-4">
        <button
          className="flex space-x-2 items-center text-xs"
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
