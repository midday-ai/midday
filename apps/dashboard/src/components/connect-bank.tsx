"use client";

import { Button } from "@midday/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import banks_SE from "public/banks_SE.png";

export function ConnectBank() {
  const pathname = usePathname();

  return (
    <div className="py-6 px-8 border max-w-[900px] rounded-2xl flex items-between opacity-1">
      <div className="flex-1 relative">
        <h2 className="mb-2">Connect bank account</h2>
        <p className="text-sm text-[#B0B0B0]">
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
  );
}
