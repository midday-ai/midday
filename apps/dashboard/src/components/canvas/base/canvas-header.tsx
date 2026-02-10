"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { useTheme } from "next-themes";
import {
  generateCanvasPdf,
  generateCanvasPdfBlob,
} from "@/utils/canvas-to-pdf";
import { ArtifactTabs } from "../artifact-tabs";

interface CanvasHeaderProps {
  title: string;
}

export function CanvasHeader({ title }: CanvasHeaderProps) {
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();

  const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`;

  const handleDownloadReport = async () => {
    try {
      await generateCanvasPdf({
        filename,
        theme: resolvedTheme,
      });
    } catch {}
  };

  const handleShareReport = async () => {
    try {
      // Check if Web Share API is available
      if (!navigator.share) {
        // Fallback to download if Web Share API is not supported
        await handleDownloadReport();
        return;
      }

      // Generate PDF blob silently
      const blob = await generateCanvasPdfBlob({
        filename,
        theme: resolvedTheme,
      });

      // Create File object from blob
      const file = new File([blob], filename, {
        type: "application/pdf",
      });

      // Share using Web Share API
      await navigator.share({
        title: title,
        files: [file],
      });
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          duration: 2500,
          title: "Failed to share report",
          description: "Please try downloading the report instead.",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-[#131313]">
      <ArtifactTabs />

      <div className="flex justify-end mr-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="p-0 h-6 w-6">
              <Icons.MoreVertical size={15} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShareReport} className="text-xs">
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownloadReport}
              className="text-xs"
            >
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
