export function getEnvironmentUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://app.midday.ai";
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }

  return `https://${process.env.VERCEL_URL}`;
}
