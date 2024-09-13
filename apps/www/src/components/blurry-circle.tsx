import { cn } from "@midday/ui/cn";

export function BlurryCircle({ className }) {
  return (
    <div
      className={cn(
        "pointer-events-none h-[216px] w-[216px] rounded-full blur-2xl",
        className,
      )}
    />
  );
}
