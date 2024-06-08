import { cn } from "@midday/ui/cn";

export function Card({ children, className }) {
  return (
    <div
      className={cn(
        "flex border flex-col items-center justify-center border-border bg-[#121212] px-6 pt-8 pb-6 space-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Grid() {
  return (
    <div className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="h-full w-full grid-cols-6 gap-3.5 px-4 grid">
        <div className="border-r-[1px] border-[#161616]" />
        <div className="border-r-[1px] border-[#161616]" />
        <div className="border-r-[1px] border-[#161616]" />
        <div className="border-r-[1px] border-[#161616]" />
        <div className="border-r-[1px] border-[#161616]" />
      </div>
      <div className="h-full w-full absolute flex justify-between flex-col">
        <div className="border-t-[1px] border-[#161616]" />
        <div className="border-t-[1px] border-[#161616]" />
        <div className="border-t-[1px] border-[#161616]" />
        <div className="border-t-[1px] border-[#161616]" />
        <div className="border-t-[1px] border-[#161616]" />
      </div>
    </div>
  );
}
