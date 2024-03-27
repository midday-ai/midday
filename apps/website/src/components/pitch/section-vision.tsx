import Link from "next/link";
import { Card } from "./ui";

export function SectionVision() {
  return (
    <div className="h-screen relative w-screen container">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Vision</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>
      <div className="flex flex-col h-screen min-h-full justify-center">
        <h1 className="text-[122px] font-medium text-center leading-none">
          Our mission is to be the #1 OS for business owners.
        </h1>
      </div>
    </div>
  );
}
