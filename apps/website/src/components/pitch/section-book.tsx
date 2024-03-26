import { CalEmbed } from "@/components/cal-embed";
import Link from "next/link";

export function SectionBook() {
  return (
    <div className="h-screen relative w-screen container">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Book a meeting</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>

      <div className="flex flex-col h-screen min-h-full justify-center">
        <div className="h-[600px]">
          <CalEmbed calLink="pontus-midday/midday-x-vc" />
        </div>
      </div>
    </div>
  );
}
