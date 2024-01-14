import { useCommandStore } from "@/store/command";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@midday/ui/command";

import { useRouter } from "next/navigation";

export function CommandTracker() {
  const { isOpen, setOpen } = useCommandStore();
  const router = useRouter();

  return (
    <div>
      <CommandList>wef</CommandList>
      wfwef
    </div>
  );
}
