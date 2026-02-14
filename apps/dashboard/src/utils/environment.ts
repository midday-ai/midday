function normalizeUrl(value?: string) {
  if (!value) {
    return null;
  }

  return value.trim().replace(/\/+$/, "");
}

export function getUrl() {
  const publicUrl = normalizeUrl(process.env.NEXT_PUBLIC_URL);

  if (publicUrl) {
    return publicUrl;
  }

  const vercelUrl = normalizeUrl(process.env.VERCEL_URL);

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3001";
}
