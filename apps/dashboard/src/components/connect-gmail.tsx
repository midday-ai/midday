"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ConnectGmail() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const active = searchParams.get("step") === "gmail" || searchParams.get("step") === "apps";

  const handleSkip = () => {
    router.push(`${pathname}?step=apps`);
  };

  return (
    <div
      className={cn(
        "py-6 px-8 max-w-[900px] flex items-between opacity-50",
        active && "opacity-1",
      )}
    >
      <div className="flex-1">
        <h2 className="mb-2">Connect Gmail</h2>
        <p className="text-sm text-[#B0B0B0]">
          With Gmail read-only mail extraction we can match invoices to <br />
          transactions for a automated process.
        </p>

        <div className="mt-8 space-x-2 items-center flex">
          <Button disabled={!active} className="space-x-2">
            <Icons.Google />
            <span>Connect</span>
          </Button>
          <Button disabled={!active} variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
