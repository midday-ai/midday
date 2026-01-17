interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  // In development, serve images without CDN transformation
  if (process.env.NODE_ENV === "development") {
    if (src.startsWith("/")) {
      return `${src}?w=${width}&q=${quality}`;
    }
    return src;
  }

  // In preview, skip Cloudflare CDN (not available on preview URLs)
  if (isPreview && vercelUrl) {
    if (src.startsWith("/")) {
      return `https://${vercelUrl}${src}`;
    }
    return src;
  }

  // Production: use Cloudflare CDN transformation
  const CDN_URL = "https://midday.ai";

  // Handle /_next static assets
  if (src.startsWith("/_next")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${CDN_URL}${src}`;
  }

  // Handle local images (starting with /)
  if (src.startsWith("/")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${CDN_URL}${src}`;
  }

  // Handle external URLs
  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
