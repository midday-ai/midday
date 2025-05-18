export function getUrl() {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === "preview") {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return "http://localhost:3001";
}
