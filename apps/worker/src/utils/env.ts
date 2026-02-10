/**
 * Environment utility functions
 * Centralized logic for checking environment variables
 */

/**
 * Check if the worker is running in production environment
 * Checks WORKER_ENV
 */
export function isProduction(): boolean {
  return process.env.WORKER_ENV === "production";
}

/**
 * Check if the worker is running in staging environment
 * Checks WORKER_ENV or RAILWAY_ENVIRONMENT for staging indicators
 */
export function isStaging(): boolean {
  return (
    process.env.WORKER_ENV === "staging" ||
    process.env.RAILWAY_ENVIRONMENT === "staging"
  );
}

/**
 * Check if the worker is running in a non-production environment
 * Useful for skipping scheduled tasks or enabling debug features
 */
export function isDevelopment(): boolean {
  return !isProduction();
}
