export function getAppUrl() {
  // Allow explicit override via DASHBOARD_URL env var
  if (process.env.DASHBOARD_URL) {
    return process.env.DASHBOARD_URL;
  }

  if (
    process.env.RAILWAY_ENVIRONMENT === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://app.midday.ai";
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return "http://localhost:3001";
}

export function getEmailUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://midday.ai";
}

export function getWebsiteUrl() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://midday.ai";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getCdnUrl() {
  return "https://cdn.midday.ai";
}

export function getApiUrl() {
  // Allow explicit override via API_URL env var
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (
    process.env.RAILWAY_ENVIRONMENT === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://api.midday.ai";
  }

  return "http://localhost:3002";
}
