import Link from "next/link";
import { Card } from "./ui";

export function SectionSubscription() {
  return (
    <div className="h-screen relative w-screen container">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Subscription</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>
      <div className="flex flex-col h-screen min-h-full justify-center">
        <div className="grid grid-cols-3 gap-8"></div>
      </div>
    </div>
  );
}
