export function getEnvironmentUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://app.midday.ai";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3001";
}
