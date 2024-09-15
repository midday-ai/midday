import * as React from "react";
import { cn } from "../../utils/cn";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> { }

export function DashboardShell({
    children,
    className,
    ...props
}: DashboardShellProps) {
    return (
        <div className={cn("grid items-start gap-8", className)} {...props}>
            {children}
        </div>
    );
}

interface DashboardHeaderProps {
    heading: string;
    text?: string;
    children?: React.ReactNode;
}

export function DashboardHeader({
    heading,
    text,
    children,
}: DashboardHeaderProps) {
    return (
        <>
            <div className="flex items-center justify-between px-2 pt-[5%]">
                <div className="grid gap-1">
                    <h1 className="font-heading text-2xl md:text-4xl">{heading}</h1>
                    {text && <p className="text-lg text-muted-foreground">{text}</p>}
                </div>

                {children}
            </div>
        </>
    );
}
