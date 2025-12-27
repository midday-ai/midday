interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CDN_URL = "https://midday.ai";

/**
 * Check if we should skip CDN optimization (not production)
 * Uses environment variables for reliable detection in both SSR and client
 */
function shouldSkipCdn(): boolean {
  // Check Vercel environment
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  // Not production = skip CDN
  return true;
}

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

  // Skip CDN for development/localhost (uses environment variables)
  if (shouldSkipCdn()) {
    // Handle relative paths from require() - these work directly in Next.js
    // Paths like /_next/static/media/stripe.jpg or /static/media/stripe.jpg
    if (src.startsWith("/")) {
      return src;
    }
    // Handle full localhost URLs
    if (
      src.startsWith("http://localhost") ||
      src.startsWith("http://127.0.0.1")
    ) {
      return src;
    }
    // For any other paths in development, return as-is
    return src;
  }

  // Production logic below
  // Handle relative paths from require() - static assets don't need CDN
  // Paths like /static/media/stripe.jpg are served by Next.js
  if (src.startsWith("/") && !src.startsWith("/_next")) {
    return src;
  }

  // Handle Next.js static assets - these are already optimized
  // Only apply CDN to non-static _next paths if needed
  if (src.startsWith("/_next/static")) {
    return src; // Static assets are already optimized, return as-is
  }

  // Other _next paths (like dynamic routes)
  if (src.startsWith("/_next")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/https://app.midday.ai${src}`;
  }

  // For external URLs in production, use CDN
  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
