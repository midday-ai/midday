import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "font-mono rounded-none bg-transparent text-[10px] font-normal border-border border text-primary",
        tag: "font-mono text-[#878787] bg-[#F2F1EF] text-[10px] dark:bg-[#1D1D1D] border-none font-normal rounded-none",
        "tag-rounded":
          "font-mono text-[#878787] bg-[#F2F1EF] text-[12px] dark:bg-[#1D1D1D] font-normal px-3 py-1 border-none",
        "tag-outline":
          "border-transparent bg-zinc-700 text-zinc-200 hover:bg-zinc-700/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
