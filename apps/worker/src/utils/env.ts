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
 * Check if the worker is running in a non-production environment
 * Useful for skipping scheduled tasks or enabling debug features
 */
export function isDevelopment(): boolean {
  return !isProduction();
}
