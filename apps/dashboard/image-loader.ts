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
  return `https://midday.ai/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
