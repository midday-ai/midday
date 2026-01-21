export function getAppUrl() {
  // Allow explicit override via DASHBOARD_URL env var (useful for worker/non-Vercel deployments)
  if (process.env.DASHBOARD_URL) {
    return process.env.DASHBOARD_URL;
  }

  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://app.abacuslabs.com";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3001";
}

export function getEmailUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://abacuslabs.com";
}

export function getWebsiteUrl() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://abacuslabs.com";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getCdnUrl() {
  return process.env.CDN_URL || "https://cdn.midday.ai";
}
