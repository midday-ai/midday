import { isLocalBackend } from "@midday/utils/backend";

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CDN_URL = process.env.NEXT_PUBLIC_IMAGE_CDN_URL || "https://midday.ai";

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
  if (isLocalBackend()) {
    const storageHosts = (process.env.NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean);
    try {
      const url = new URL(src);
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        storageHosts.includes(url.host)
      )
        return src;
    } catch {
      // Relative image sources follow the existing loader path below.
    }
    if (
      process.env.NODE_ENV !== "production" &&
      !process.env.NEXT_PUBLIC_IMAGE_CDN_URL
    )
      return src;
  }

  // Handle authenticated API URLs (preserve query parameters like fk token)
  if (src.includes("/files/proxy")) {
    // Parse URL to preserve query parameters
    try {
      const url = new URL(src);

      // Skip CDN optimization for localhost (local development)
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return src; // Return URL as-is for local development
      }

      const params = url.searchParams.toString();
      const baseUrl = url.origin + url.pathname;
      return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${baseUrl}${params ? `?${params}` : ""}`;
    } catch {
      // Fallback if URL parsing fails - check if it's localhost
      if (src.includes("localhost") || src.includes("127.0.0.1")) {
        return src; // Return URL as-is for local development
      }
      return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
    }
  }

  // Existing logic for other URLs
  if (src.startsWith("/_next")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/https://app.midday.ai${src}`;
  }
  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
