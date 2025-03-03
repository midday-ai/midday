import { useAssistantStore } from "@/store/assistant";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { app, platform } from "@todesktop/client-core";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useRouter } from "next/navigation";

type Props = {
  onSubmit: () => void;
};

export function ChatFooter({ onSubmit }: Props) {
  const router = useRouter();
  const { setOpen } = useAssistantStore();

  const handleOpenUrl = (url: string) => {
    if (isDesktopApp()) {
      return platform.os.openURL(url);
    }

    router.push(url);
  };

  return (
    <div className="hidden todesktop:flex md:flex px-3 h-[40px] w-full border-t-[1px] items-center bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99]">
      <Popover>
        <PopoverTrigger>
          <div className="scale-50 opacity-50 -ml-2">
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
                className="flex space-x-2 items-center text-xs hover:bg-[#F2F1EF] dark:hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => handleOpenUrl("https://x.com/middayai")}
              >
                <Icons.X className="w-[16px] h-[16px]" />
                <span>Follow us</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#F2F1EF] dark:hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => handleOpenUrl("https://go.midday.ai/anPiuRx")}
              >
                <Icons.Discord className="w-[16px] h-[16px]" />
                <span>Join Our Community</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#F2F1EF] dark:hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => handleOpenUrl("https://git.new/midday")}
              >
                <Icons.GithubOutline className="w-[16px] h-[16px]" />
                <span>Github</span>
              </button>
            </li>

            <li>
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#F2F1EF] dark:hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1"
                onClick={() => {
                  router.push("/account/assistant");
                  setOpen();
                }}
              >
                <Icons.Settings className="w-[16px] h-[16px]" />
                <span>Settings</span>
              </button>
            </li>

            <li className="hidden todesktop:block">
              <button
                type="button"
                className="flex space-x-2 items-center text-xs hover:bg-[#F2F1EF] dark:hover:bg-[#2b2b2b] rounded-md transition-colors w-full p-1 text-destructive"
                onClick={() => app.quit()}
              >
                <Icons.ExitToApp className="w-[16px] h-[16px]" />
                <span>Quit Midday</span>
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
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 border bg-accent px-1.5 font-mono text-[10px] font-medium">
            <span>↵</span>
          </kbd>
        </button>
      </div>
    </div>
  );
}
