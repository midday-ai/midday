"use client";

import { useAssistantStore } from "@/store/assistant";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
import { useRouter } from "next/navigation";

type Props = {
  filter: Record<string, string>;
  sort?: string[];
  q: string;
};

export function ShowAllButton({ filter, q, sort }: Props) {
  const { setOpen } = useAssistantStore();
  const router = useRouter();

  const params = new URLSearchParams();

  if (q) {
    params.append("q", q);
  }

  if (Object.keys(filter).length > 0) {
    for (const [key, value] of Object.entries(filter)) {
      params.append(key, value);
    }
  }

  if (sort) {
    params.append("sort", `${sort.at(0)}:${sort.at(1)}`);
  }

  const handleOnClick = () => {
    setOpen();
    router.push(`/transactions?${params.toString()}`);
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
