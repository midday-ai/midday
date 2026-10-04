export type SocialProvider = "google" | "github" | "apple" | "microsoft";
export function socialProvidersConfig() {
  return {
    ...(process.env.AUTH_GOOGLE_CLIENT_ID &&
    process.env.AUTH_GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
            prompt: "select_account" as const,
          },
        }
      : {}),
    ...(process.env.AUTH_GITHUB_CLIENT_ID &&
    process.env.AUTH_GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.AUTH_GITHUB_CLIENT_ID,
            clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.AUTH_APPLE_CLIENT_ID && process.env.AUTH_APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: process.env.AUTH_APPLE_CLIENT_ID,
            clientSecret: process.env.AUTH_APPLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.AUTH_MICROSOFT_CLIENT_ID &&
    process.env.AUTH_MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.AUTH_MICROSOFT_CLIENT_ID,
            clientSecret: process.env.AUTH_MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.AUTH_MICROSOFT_TENANT_ID ?? "common",
          },
        }
      : {}),
  };
}
export function getEnabledSocialProviders(): SocialProvider[] {
  return Object.keys(socialProvidersConfig()) as SocialProvider[];
}
