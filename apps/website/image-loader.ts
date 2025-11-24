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
  return `https://er0s.co/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
