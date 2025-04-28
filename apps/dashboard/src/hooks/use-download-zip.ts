import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { saveAs } from "file-saver";
import JSZip from "jszip";

function getFilenameFromPath(path: string): string {
  return path.split("/").at(-1) || path;
}

async function zipAndDownloadFiles(
  signedUrls: string[],
  originalFilePaths: string[],
): Promise<void> {
  const validSignedFiles: { path: string; signedUrl: string; name: string }[] =
    [];

  for (const signedUrl of signedUrls) {
    let foundMatch = false;
    for (const originalPath of originalFilePaths) {
      try {
        // Parse the signed URL to extract the pathname
        const url = new URL(signedUrl);
        const pathname = decodeURIComponent(url.pathname); // Decode potentially encoded characters in the path

        // Check if the decoded pathname includes the original file path.
        // This assumes the originalPath is a unique segment within the signed URL's path.
        if (pathname.includes(originalPath)) {
          const derivedName = getFilenameFromPath(originalPath);

          validSignedFiles.push({
            path: originalPath,
            signedUrl: signedUrl,
            name: derivedName,
          });

          foundMatch = true;
          break; // Found the match for this signedUrl, move to the next one
        }
      } catch (e) {
        // Log error if URL parsing fails
        console.error("Invalid URL encountered during matching:", signedUrl, e);
      }
    }

    if (!foundMatch) {
      console.warn(
        "Could not reliably associate signed URL with an original file path:",
        signedUrl,
      );
    }
  }

  if (validSignedFiles.length === 0 && originalFilePaths.length > 0) {
    console.error("No valid signed URLs could be generated or matched.");
    throw new Error("Failed to generate download links for selected files.");
  }

  const zip = new JSZip();

  const filePromises = validSignedFiles.map(async (file) => {
    try {
      const res = await fetch(file.signedUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${file.name}: ${res.statusText}`);
      }
      const blob = await res.blob();
      zip.file(file.name, blob);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  });

  await Promise.all(filePromises);

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  saveAs(zipBlob, `download-${Date.now()}.zip`);
}

export function useDownloadZip() {
  const trpc = useTRPC();

  const { mutateAsync, isPending, error } = useMutation(
    trpc.documents.signedUrls.mutationOptions(),
  );

  const handleDownloadZip = async (filePaths: string[]) => {
    const data = await mutateAsync(filePaths);
    await zipAndDownloadFiles(data, filePaths);
  };

  return {
    handleDownloadZip,
    isPending,
    error,
  };
}
