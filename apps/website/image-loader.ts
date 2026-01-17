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
  // In development, serve local images with width as query param (satisfies Next.js loader check)
  if (process.env.NODE_ENV === "development") {
    if (src.startsWith("/")) {
      return `${src}?w=${width}&q=${quality}`;
    }
    return src;
  }

  // In production, route all images through Cloudflare CDN
  const imageSrc = src.startsWith("/")
    ? `https://midday.ai${src}`
    : src;

  return `https://midday.ai/cdn-cgi/image/width=${width},quality=${quality}/${imageSrc}`;
}
