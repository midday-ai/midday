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
  // Temporarily serve local images directly for development
  // If it's a local image (starts with /), serve it directly
  if (src.startsWith('/')) {
    return src;
  }
  
  // Otherwise, route through CDN
  return `https://midday.ai/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
