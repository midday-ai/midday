import { useUserQuery } from "@/hooks/use-user";
import { useMemo } from "react";

type FileUrlOptions =
  | {
      type: "proxy" | "preview" | "download";
      filePath: string;
      filename?: string;
    }
  | {
      type: "url";
      url: string;
    };

/**
 * Hook to get an authenticated file URL with fileKey.
 * Handles both constructing URLs from file paths and adding fileKey to existing URLs.
 *
 * @param options - Either file path options or an existing URL
 * @returns Object with `url` (authenticated URL), `isLoading`, and `hasFileKey` state
 */
export function useFileUrl(options: FileUrlOptions | null) {
  const { data: user, isLoading } = useUserQuery();

  const result = useMemo(() => {
    if (!options || !user?.fileKey) {
      return {
        url: null as string | null,
        isLoading,
        hasFileKey: !!user?.fileKey,
      };
    }

    if (options.type === "url") {
      // Add fileKey to existing URL
      const url = new URL(options.url);
      url.searchParams.set("fk", user.fileKey);
      return {
        url: url.toString(),
        isLoading: false,
        hasFileKey: true,
      };
    }

    // Build URL from file path
    const { type, filePath, filename } = options;
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/files/${type}`;
    const url = new URL(baseUrl);

    if (type === "download") {
      url.searchParams.set("path", filePath);
      if (filename) {
        url.searchParams.set("filename", filename);
      }
    } else {
      url.searchParams.set("filePath", filePath);
    }

    url.searchParams.set("fk", user.fileKey);

    return {
      url: url.toString(),
      isLoading: false,
      hasFileKey: true,
    };
  }, [options, user?.fileKey, isLoading]);

  return result;
}
