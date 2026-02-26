import { useUserQuery } from "@/hooks/use-user";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useState } from "react";

type Deal = {
  id: string;
  dealNumber: string | null;
};

export function useDownloadDealsZip() {
  const { data: user } = useUserQuery();
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleDownloadZip = async (deals: Deal[]) => {
    if (deals.length === 0 || !user?.fileKey) {
      return;
    }

    setIsPending(true);
    setProgress({ current: 0, total: deals.length });

    try {
      const zip = new JSZip();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // Track used filenames to avoid duplicates
      const usedFilenames = new Set<string>();

      // Fetch each deal PDF and add to zip
      const filePromises = deals.map(async (deal, index) => {
        try {
          const url = new URL(`${apiUrl}/files/download/deal`);
          url.searchParams.set("id", deal.id);
          url.searchParams.set("fk", user.fileKey!);

          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(
              `Failed to fetch deal ${deal.id}: ${response.statusText}`,
            );
          }

          const blob = await response.blob();

          // Generate unique filename
          const baseName = deal.dealNumber ?? `deal-${deal.id}`;
          let filename = `${baseName}.pdf`;
          let counter = 1;
          while (usedFilenames.has(filename)) {
            filename = `${baseName}-${counter}.pdf`;
            counter++;
          }
          usedFilenames.add(filename);

          zip.file(filename, blob);

          setProgress({ current: index + 1, total: deals.length });
        } catch (error) {
          console.error(`Error processing deal ${deal.id}:`, error);
          // Continue with other deals even if one fails
        }
      });

      await Promise.all(filePromises);

      // Check if any files were added to the zip
      const fileCount = Object.keys(zip.files).length;
      if (fileCount === 0) {
        throw new Error("No deals could be downloaded. Please try again.");
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9,
        },
      });

      const timestamp = new Date().toISOString().split("T")[0];
      saveAs(zipBlob, `deals-${timestamp}.zip`);
    } catch (error) {
      console.error("Failed to create deal ZIP:", error);
      throw error;
    } finally {
      setIsPending(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return {
    handleDownloadZip,
    isPending,
    progress,
  };
}
