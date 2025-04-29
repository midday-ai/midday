"use client";

import type { GetTransactionsResult } from "@/lib/tools/get-transactions";
import { useAssistantStore } from "@/store/assistant";
import { useRouter } from "next/navigation";

type Props = {
  params: GetTransactionsResult["params"];
};

export function ShowMoreButton({ params }: Props) {
  const { setOpen } = useAssistantStore();
  const router = useRouter();

  const handleOnClick = () => {
    setOpen();
    router.push(`/transactions?q=${params.q}`);
  };

  // TODO: Handle more params
  if (!params.q) return null;

  return (
    <button
      type="button"
      onClick={handleOnClick}
      className="text-[#878787] font-sans text-sm mt-2"
    >
      Show more
    </button>
  );
}
