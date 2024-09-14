import { cn } from "@midday/ui/cn";
import { HTMLAttributes } from "react";

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export const Divider = ({ className, orientation = 'vertical', ...props }: DividerProps) => {
    const dividerClass = orientation === 'vertical' 
        ? "w-px mx-4" 
        : "h-px my-4";

    return <div className={cn("bg-foreground/2", dividerClass, className)} {...props} />;
};