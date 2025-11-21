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
import { ArtifactTabs } from "../artifact-tabs";

interface CanvasHeaderProps {
  title: string;
}

export function CanvasHeader({ title }: CanvasHeaderProps) {
  const { theme } = useTheme();

  const handleDownloadReport = async () => {
    try {
      await generateCanvasPdf({
        filename: `${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`,
        theme,
      });
    } catch {}
  };

  return (
    <div className="flex items-center justify-between dark:bg-[#131313]">
      <ArtifactTabs />

      <div className="flex justify-end mr-1.5">
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
