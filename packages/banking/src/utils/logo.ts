const CDN_DOMAIN =
  process.env.STORAGE_CDN_DOMAIN ??
  process.env.NEXT_PUBLIC_STORAGE_CDN_DOMAIN ??
  "cdn-engine.midday.ai";

export function getLogoURL(id: string, ext?: string) {
  return `https://${CDN_DOMAIN}/${id}.${ext || "jpg"}`;
}

export function getFileExtension(url: string) {
  return url.split(".").at(-1);
}
