export function getLogoURL(id: string, ext?: string) {
  return `https://cdn-engine.midday.ai/${id}.${ext || "jpg"}`;
}

export function getFileExtension(url: string) {
  return url.split(".").pop();
}
