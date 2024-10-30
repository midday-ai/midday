export function getEnvironmentUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/email";
  }

  return "https://midday.ai/email";
}
