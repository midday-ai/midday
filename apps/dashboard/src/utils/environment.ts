export function getUrl() {
  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  }

  return "http://localhost:3001";
}
