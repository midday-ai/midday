export function getEnvironmentUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/email";
  }

  return "https://midday.ai/email";
}

export function getAppUrl() {
  if (process.env.VERCEL_ENV === "production") {
    return "https://app.midday.ai";
  }

  return "http://localhost:3001";
}
