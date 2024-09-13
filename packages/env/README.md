# Environment Configuration and Feature Flags

This document outlines the environment configuration and feature flag system used in our project. It provides information on how to use environment variables and feature flags in different parts of the application, as well as guidelines for maintaining and extending the system.

## Table of Contents

1. [Overview](#overview)
2. [Usage](#usage)
   - [Global Environment](#global-environment)
   - [Dashboard Environment](#dashboard-environment)
   - [Website Environment](#website-environment)
3. [Feature Flags](#feature-flags)
4. [Updating Exports](#updating-exports)
5. [Environment Validation](#environment-validation)
6. [TypeScript Support](#typescript-support)
7. [Contributing](#contributing)

## Overview

Our project uses a modular approach to manage environment variables and feature flags. This allows for flexible configuration across different parts of the application while maintaining type safety and ease of use.

## Usage

### Global Environment

For global components and utilities:

```typescript
import { environment, featureFlags } from './src/global-env';

// Use environment variables
console.log(environment.NEXT_PUBLIC_SUPABASE_URL);

// Use feature flags
if (featureFlags.isAuthEnabled) {
  // Initialize authentication
}
```

### Dashboard Environment

For dashboard-specific components and utilities:

```typescript
import { environment, featureFlags } from './src/dashboard-env';

function DashboardComponent() {
  if (featureFlags.isAnalyticsEnabled) {
    console.log(`Analytics modules: ${featureFlags.analyticsModules.join(', ')}`);
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Supabase URL: {environment.NEXT_PUBLIC_SUPABASE_URL}</p>
      {featureFlags.isDarkModeEnabled && <DarkModeToggle />}
    </div>
  );
}
```

### Website Environment

For website-specific components:

```typescript
import { environment, featureFlags } from './src/website-env';

function WebsiteComponent() {
  return (
    <div>
      <h1>Welcome to our website</h1>
      {featureFlags.isNewsletterEnabled && <NewsletterSignup />}
      {featureFlags.isDarkModeEnabled && <DarkModeToggle />}
    </div>
  );
}
```

## Feature Flags

The project uses various feature flags to control functionality. Some key feature flags include:

- Authentication: `NEXT_PUBLIC_ENABLE_AUTH`
- Analytics: `NEXT_PUBLIC_ENABLE_ANALYTICS`
- Dark Mode: `NEXT_PUBLIC_ENABLE_DARK_MODE`
- Smart Goals: `NEXT_PUBLIC_ENABLE_SMART_GOALS`
- Forecasts: `NEXT_PUBLIC_ENABLE_FORECASTS`

Refer to `src/env/feature-flag.env` for a complete list of available feature flags.

## Updating Exports

To update the package exports automatically:

1. Run the `update-exports.ts` script:
   ```
   npx ts-node update-exports.ts
   ```
2. This will update the `exports` field in `package.json` based on the current project structure.

## Environment Validation

The project uses `@t3-oss/env-nextjs` for environment validation. If you need to skip validation during development, you can set `SKIP_ENV_VALIDATION=true` in your `.env` file.

## TypeScript Support

The `env.d.ts` file provides TypeScript definitions for the `ImportMeta.env` object, ensuring type safety when accessing environment variables.

## Contributing

When adding new environment variables or feature flags:

1. Update the relevant `*-env.ts` file with the new variable or flag.
2. Add the variable or flag to `src/env/feature-flag.env` with a default value.
3. Update this README if necessary to reflect any significant changes.
4. If adding a new feature flag, consider which environments (global, dashboard, website) it should be available in and update the respective files.
5. Update the TypeScript interfaces in `src/types/environment.ts` to include the new variables or flags.

Remember to maintain backwards compatibility when modifying existing variables or flags. If a breaking change is necessary, communicate this clearly in your pull request and update all relevant documentation.