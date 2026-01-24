interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CDN_URL = "https://abacuslabs.com";

// Set to true when Cloudflare Image Resizing is enabled on your plan
const USE_CLOUDFLARE_CDN = false;

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
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

  // In preview, serve from Vercel preview URL
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  if (isPreview && vercelUrl) {
    if (src.startsWith("/")) {
      return `https://${vercelUrl}${src}`;
    }
    return src;
  }

  // Production: serve directly (CDN transformation disabled)
  if (!USE_CLOUDFLARE_CDN) {
    if (src.startsWith("/")) {
      return `${CDN_URL}${src}`;
    }
    return src;
  }

  // Production with Cloudflare CDN: use image transformation
  // SVGs don't need transformation - serve directly
  if (src.endsWith(".svg")) {
    if (src.startsWith("/")) {
      return `${CDN_URL}${src}`;
    }
    return src;
  }

  if (src.startsWith("/_next") || src.startsWith("/")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${CDN_URL}${src}`;
  }

  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
