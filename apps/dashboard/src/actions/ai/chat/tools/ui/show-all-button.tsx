"use client";

import { useAssistantStore } from "@/store/assistant";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useRouter } from "next/navigation";

type Props = {
  path: string;
};

export function ShowAllButton({ path }: Props) {
  const { setOpen } = useAssistantStore();
  const router = useRouter();

  const handleOnClick = () => {
    setOpen();
    router.push(path);
  };

  if (isDesktopApp()) {
    // TODO: Fix link in desktop
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleOnClick}
      className="text-[#878787] font-sans"
    >
      Show all
    </button>
  );
}
