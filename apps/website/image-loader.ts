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

  // Skip CDN optimization for localhost (local development)
  if (src.includes("localhost") || src.includes("127.0.0.1")) {
    return src;
  }

  // In development, serve local images without CDN
  if (process.env.NODE_ENV === "development") {
    if (src.startsWith("/")) {
      return `${src}?w=${width}&q=${quality}`;
    }
    return src;
  }

  // In preview, skip Cloudflare CDN (not available on preview URLs)
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  if (isPreview && vercelUrl) {
    if (src.startsWith("/")) {
      return `https://${vercelUrl}${src}`;
    }
    return src;
  }

  // Production: use Cloudflare CDN transformation
  if (src.startsWith("/_next")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${CDN_URL}${src}`;
  }

  if (src.startsWith("/")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${CDN_URL}${src}`;
  }

  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
