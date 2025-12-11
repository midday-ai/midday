interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CDN_URL = "https://midday.ai";

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
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
