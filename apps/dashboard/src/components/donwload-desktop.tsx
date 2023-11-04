"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { OnboardingStep } from "./onboarding-step";

export function DownloadDesktop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get("step") === "desktop";
  const done = searchParams.get("step") === "apps";

  return (
    <div className="py-6 px-8 max-w-[900px] flex items-between relative">
      <div
        className={cn(
          "flex items-between opacity-30",
          active && "opacity-1",
          done && "opacity-1",
        )}
      >
        <OnboardingStep active={active} done={done} />
        <div className="flex-1">
          <div className="flex items-start space-x-2">
            <h2 className="mb-2">Download Mac App</h2>
          </div>
          <p className="text-sm text-[#606060]">
            Etiam neque arcu, semper nec varius et, sollicitudin ut nisl. Nulla
            <br />
            facilisi. In laoreet mauris ac felis faucibus pulvinar.
          </p>

          <div className="mt-8">
            <Button variant="outline" disabled={!active}>
              Download
            </Button>

            <Button
              disabled={!active}
              variant="ghost"
              onClick={() => router.push(`${pathname}?step=apps`)}
              className="font-normal text-sm hover:bg-transparent text-[#606060]"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
