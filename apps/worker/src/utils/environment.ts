/**
 * Valid application environments
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

/**
 * Get current environment with fallback to development
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.ENVIRONMENT?.toLowerCase();
  if (env === ENVIRONMENTS.PRODUCTION) return ENVIRONMENTS.PRODUCTION;
  if (env === ENVIRONMENTS.STAGING) return ENVIRONMENTS.STAGING;
  return ENVIRONMENTS.DEVELOPMENT;
}

/**
 * Check if scheduled jobs should run in current environment
 * Only production environment runs scheduled jobs to prevent duplicate processing
 */
export function shouldRunScheduledJobs(): boolean {
  return getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION;
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION;
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === ENVIRONMENTS.STAGING;
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT;
}
