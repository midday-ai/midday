"use client";

export function FlipCounter() {
  return (
    <div className="space-x-4 md:space-x-8 flex">
      <div className="relative">
        <span className="md:text-[260px] text-[180px] leading-[230px] md:leading-[340px] font-mono font-medium bg-background rounded-3xl border border-border px-6">
          3
        </span>
        <div className="absolute top-[50%] -mt-2 h-[3px] w-full bg-background" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] left-0 top-[50%] -mt-[15px] z-10" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] right-0 top-[50%] -mt-[15px] z-10" />
      </div>

      <div className="relative">
        <span className="md:text-[260px] text-[180px] leading-[230px] md:leading-[340px] font-mono font-medium bg-background rounded-3xl border border-border px-6">
          0
        </span>
        <div className="absolute top-[50%] -mt-2 h-[3px] w-full bg-background" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] left-0 top-[50%] -mt-[15px] z-10" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] right-0 top-[50%] -mt-[15px] z-10" />
      </div>
    </div>
  );
}
