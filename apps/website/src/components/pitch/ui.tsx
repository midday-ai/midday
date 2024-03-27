import { cn } from "@midday/ui/utils";

export function Card({ children, className }) {
  return (
    <div
      className={cn(
        "flex border flex-col items-center justify-center border-border bg-[#121212] rounded-xl px-6 pt-8 pb-6 space-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}
