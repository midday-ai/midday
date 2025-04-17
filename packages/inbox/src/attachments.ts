export function decodeBase64Url(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  return Buffer.from(padded, "base64");
}

export function ensurePdfExtension(filename: string): string {
  if (!filename.toLowerCase().endsWith(".pdf")) {
    return `${filename}.pdf`;
  }
  return filename;
}
