import { cn } from "@midday/ui/cn";

type Props = {
  className?: string;
};

export function Experimental({ className }: Props) {
  return (
    <span
      className={cn(
        "flex items-center py-[3px] px-3 rounded-full border border-primary text-[10px] h-full font-normal",
        className
      )}
    >
      Experimental
    </span>
  );
}
