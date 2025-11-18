"use client";

import { Skeleton } from "@/components/canvas/base/skeleton";
import { generateCanvasPdf } from "@/utils/canvas-to-pdf";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useTheme } from "next-themes";

interface CanvasHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function CanvasHeader({
  title,
  description,
  isLoading = false,
  actions,
  className,
}: CanvasHeaderProps) {
  const { theme } = useTheme();

  const handleDownloadReport = async () => {
    try {
      await generateCanvasPdf({
        filename: `${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`,
        theme,
      });
    } catch {}
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="space-y-2">
          <Skeleton width="8rem" height="1.125rem" />
          {description && <Skeleton width="12rem" height="0.875rem" />}
        </div>
        {actions && (
          <div className="flex gap-2">
            <Skeleton width="3rem" height="2rem" />
            <Skeleton width="3rem" height="2rem" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex justify-between items-center mb-4", className)}>
      <div>
        <h2 className="text-[12px] leading-[23px] text-[#707070] dark:text-[#666666]">
          {title}
        </h2>
        {description && (
          <p className="text-[12px] text-[#707070] dark:text-[#666666] mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="p-0 h-6 w-6">
              <Icons.MoreVertical size={15} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadReport}>
              Download Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
