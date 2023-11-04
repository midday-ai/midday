"use client";

import { Button } from "@midday/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import banks_SE from "public/banks_SE.png";
import { OnboardingStep } from "./onboarding-step";

export function ConnectBank() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = !searchParams.has("step");
  const done =
    searchParams.get("step") === "desktop" ||
    searchParams.get("step") === "apps";

  return (
    <div className="py-6 px-8 border max-w-[900px] rounded-2xl relative">
      <OnboardingStep active={active} done={done} />

      <div className="flex items-between">
        <div className="flex-1 relative">
          <h2 className="mb-2">Connect bank account</h2>
          <p className="text-sm text-[#606060]">
            We need a connection to your bank to get your transactions and
            balance.
          </p>

          <Link href={`${pathname}?step=bank`}>
            <Button className="absolute bottom-0">Connnect</Button>
          </Link>
        </div>
        <Image
          src={banks_SE}
          width={150}
          height={146}
          alt="Banks"
          className="-mt-2 -mr-2"
        />
      </div>
    </div>
  );
}
