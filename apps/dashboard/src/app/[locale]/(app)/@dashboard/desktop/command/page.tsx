"use client";

import { CommandComponent } from "@/components/command-menu";
import { MenuOption, useCommandStore } from "@/store/command";
import { Command } from "@midday/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { platform } from "@todesktop/client-core";
import { app } from "@todesktop/client-core";

export default function CommandDesktop() {
  const { selected } = useCommandStore();

  return (
    <Command>
      <CommandComponent selected={selected ?? MenuOption.Root} />
      <div className="fixed flex px-3 bottom-0 h-[45px] w-full border-t-[1px] items-center bg-background">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="scale-50 opacity-50">
              <Icons.LogoSmall />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="ml-4" sideOffset={15}>
            <DropdownMenuItem
              className="flex space-x-1 items-center"
              onClick={() => platform.os.openURL("https://x.com/middayai")}
            >
              <Icons.X className="w-[16px] h-[16px]" />
              <span>Follow us</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex space-x-1 items-center"
              onClick={() =>
                platform.os.openURL("https://github.com/midday-ai/midday")
              }
            >
              <Icons.GithubOutline className="w-[16px] h-[16px]" />
              <span>Github</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex space-x-1 items-center"
              onClick={() => platform.os.openURL("https://discord.gg/ZmqcvWKH")}
            >
              <Icons.Discord className="w-[16px] h-[16px]" />
              <span>Join Our Community</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex space-x-1 items-center text-[#F84E4E]"
              onClick={() => app.quit()}
            >
              <Icons.ExitToApp className="w-[16px] h-[16px]" />
              <span>Quit Midday</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto">
          <div className="flex space-x-2 items-center text-xs">
            <span>Open Application</span>
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span>↵</span>
            </kbd>
          </div>
        </div>
      </div>
    </Command>
  );
}
