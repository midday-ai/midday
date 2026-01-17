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
  // In development, serve images without CDN transformation
  if (process.env.NODE_ENV === "development") {
    // For local images, just return with width param
    if (src.startsWith("/")) {
      return `${src}?w=${width}&q=${quality}`;
    }
    // For external URLs in dev, return as-is
    return src;
  }

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
