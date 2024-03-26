"use client";

import Link from "next/link";

export function SectionSix() {
  return (
    <div className="h-screen relative w-screen container">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Demo - Version 0.5 (Private beta)</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>

      <div className="flex flex-col h-screen min-h-full justify-center">
        <div className="flex justify-between space-x-8"></div>
      </div>
    </div>
  );
}
