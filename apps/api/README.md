# Supabase Local Development Guide for Solomon AI Platform

## Introduction

This comprehensive guide outlines the process for setting up a local Supabase instance with essential features and third-party authentication for the Solomon AI Platform. Following these instructions will ensure your Supabase instance starts correctly and all required features are enabled, which is critical for proper application functionality.

## Prerequisites

Before beginning, ensure you have the following tools installed on your development machine:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://docs.deno.com/runtime/manual/getting_started/installation)

## Installation and Configuration

### 1. Repository Setup

Clone the Solomon AI Platform repository and navigate to the Supabase package:

```bash
git clone git@github.com:SolomonAIEngineering/solomon-ai-platform.git
cd ./packages/supabase
```

### 2. Environment Configuration

Create a `.env` file in the directory above the Supabase package root. This file should contain the following environment variables:

```env
SUPABASE_AUTH_GITHUB_CLIENT_ID=
SUPABASE_AUTH_GITHUB_SECRET=
SUPABASE_AUTH_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_GOOGLE_SECRET=
SUPABASE_AUTH_APPLE_CLIENT_ID=
SUPABASE_AUTH_APPLE_SECRET=
SUPABASE_AUTH_SLACK_CLIENT_ID=
SUPABASE_AUTH_SLACK_SECRET=
```

Populate these variables with the appropriate client IDs and secrets from your third-party authentication providers.

### 3. Supabase Initialization

Start your local Supabase instance using one of the following methods:

Option A: Using Supabase CLI

```bash
supabase start
```

Option B: Using Docker Desktop and Make commands

```bash
make supabase-restart
make supabase-migrate
```

### 4. Accessing Supabase Studio

Once your Supabase instance is running, access the Supabase Studio web interface at `http://localhost:54323` for project management.

## Third-Party Authentication Setup

Supabase supports various third-party authentication providers. Register your application with each provider to obtain the necessary credentials:

- [GitHub OAuth Application](https://github.com/settings/developers)
- [Google OAuth 2.0](https://console.developers.google.com/apis/credentials)
- [Apple Sign In](https://developer.apple.com/documentation/sign_in_with_apple)
- [Slack App](https://api.slack.com/apps)

## Troubleshooting

If you encounter issues during setup or operation, consider the following:

- **Supabase Startup Failure**: Verify that Docker is running and the `.env` file is correctly configured with valid credentials.
- **Authentication Issues**: Double-check that the client IDs and secrets in the `.env` file are correct and correspond to your registered applications.

## Useful Commands

For managing your Supabase instance:

- Stop Supabase: `supabase stop`
- Reset Supabase database: `supabase db reset`
- Check Supabase status: `supabase status`

## Additional Development Tools

### Local Development with Supabase

For a more integrated development experience:

1. Install [Docker](https://www.docker.com/get-started/).
2. Create `.env.local` and `.env` files from their respective example files.
3. Start Supabase and run migrations:
   ```bash
   bunx supabase:start
   ```
4. Link your local instance to your Supabase project:
   ```bash
   bunx supabase:link
   ```
5. Manage schema changes and data:
   - Pull schema changes: `bunx supabase:pull`
   - Generate seed data: `bunx supabase:generate-seed`
   - Reset database: `bunx supabase:reset`
   - Generate TypeScript types: `bunx supabase:generate-types`
   - Generate migration file: `bunx supabase:generate-migration`
   - Push changes to remote: `bunx supabase:push`

### NOTE

To wipe the database and start fresh, run `npx supabase db reset --linked`

### Stripe Integration for Payment Processing

To test Stripe webhooks locally:

1. Install and log in to the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Start local webhook forwarding:
   ```bash
   bunx stripe:listen
   ```
3. Configure the `STRIPE_WEBHOOK_SECRET` in your `.env.local` file with the provided webhook secret.
4. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` using test mode keys from your Stripe dashboard.

### Running the Next.js Client

Start the development server:

```bash
bunx dev
```

Access the application at [http://localhost:3000](http://localhost:3000).

## Production Deployment

When preparing for production deployment:

1. Archive all test mode Stripe products.
2. Switch Stripe from test mode to production mode.
3. Update Stripe API keys and create a new production webhook.
4. Update environment variables in your production environment (e.g., Vercel) with the production values.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub Repository](https://github.com/supabase/supabase)
- [Supabase Community Forum](https://community.supabase.com/)

By following this guide, you should be able to set up and run a local Supabase instance with third-party authentication for the Solomon AI Platform. For further assistance, consult the provided resources or reach out to the development team.
