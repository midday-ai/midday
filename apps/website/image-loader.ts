interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

// Use VERCEL_URL for preview deployments, otherwise use production CDN
const getBaseUrl = () => {
  // Development
  if (process.env.NODE_ENV === "development") {
    return "";
  }

  // Preview deployments on Vercel
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Production
  return "https://midday.ai";
};

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
  // In development, serve images without CDN transformation
  if (process.env.NODE_ENV === "development") {
    // For local images, just return with width param
    if (src.startsWith("/")) {
      return `${src}?w=${width}&q=${quality}`;
    }
    // For external URLs in dev, return as-is
    return src;
  }

  const baseUrl = getBaseUrl();
  const isPreview = process.env.VERCEL_ENV === "preview";

  // In preview, skip Cloudflare CDN transformation (not available on preview URLs)
  if (isPreview) {
    if (src.startsWith("/")) {
      return `${baseUrl}${src}`;
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
