# Contributing to Solomon AI

Thank you for your interest in contributing to Solomon AI! We're excited to have you join our open-source community. Your contributions help make Solomon AI a powerful financial workspace for small businesses.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [How to Contribute](#how-to-contribute)
4. [Development Workflow](#development-workflow)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Coding Guidelines](#coding-guidelines)
7. [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository to your GitHub account.
2. Clone your fork to your local machine:
   ```sh
   git clone https://github.com/YOUR_USERNAME/financial-platform-as-a-service.git
   cd financial-platform-as-a-service
   ```
3. Set up the development environment by following our [Getting Started Guide](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/docs/contributing/getting-started).

## How to Contribute

1. Check existing [issues](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/issues) and [pull requests](https://github.com/SolomonAIEngineering/financial-platform-as-a-service/pulls) to avoid duplication.
2. If you're addressing a new issue, create one before starting development.
3. For feature requests or large-scale refactoring, wait for approval (removal of `needs-approval` label) before coding.
4. For bugs, security issues, or documentation improvements, you can start coding immediately.

## Development Workflow

1. Create a new branch for your work:
   ```sh
   git switch -c feature/your-feature-name
   ```
2. Make your changes, following our [Coding Guidelines](#coding-guidelines).
3. Commit your changes with clear, descriptive messages.
4. Push your branch to your fork:
   ```sh
   git push origin feature/your-feature-name
   ```

### Installing Dependencies

We use [Corepack](https://nodejs.org/api/corepack.html) and [BUN](https://bun.io/) for package management.

1. Enable Corepack:
   ```sh
   corepack enable
   ```
2. Install dependencies:
   ```sh
   bun install
   ```

### Building the Project

Build the project using:
```bash
bun build
```

### Linting and Formatting

Check and fix code formatting:
```bash
bun fmt
```
## Project Structure

Our project follows a monorepo structure to maintain organization and clarity:

```bash
.
├── CHANGELOG.md
├── LICENSE
├── README.md
├── apps
│   ├── api
│   ├── dashboard
│   ├── docs
│   ├── engine
│   ├── lead
│   ├── mobile
│   ├── website
│   └── www
├── biome.json
├── bun.lockb
├── bunfig.toml
├── commitlint.config.ts
├── docs
│   ├── developer
│   └── platform
├── github.png
├── internal
│   ├── app-config
│   ├── backend-client
│   ├── billing
│   ├── cache
│   ├── db
│   ├── email
│   ├── encoding
│   ├── encryption
│   ├── error
│   ├── events
│   ├── hash
│   ├── id
│   ├── keys
│   ├── logs
│   ├── metrics
│   ├── providers
│   ├── resend
│   ├── schema
│   ├── store
│   ├── tinybird
│   ├── vercel
│   ├── worker-logging
│   └── zod
├── midday.code-workspace
├── package.json
├── packages
│   ├── analytics
│   ├── app-store
│   ├── assets
│   ├── documents
│   ├── editor
│   ├── email
│   ├── env
│   ├── events
│   ├── import
│   ├── inbox
│   ├── jobs
│   ├── kv
│   ├── location
│   ├── notification
│   ├── stripe
│   ├── supabase
│   ├── tsconfig
│   ├── ui
│   └── utils
├── saasfly-logo.svg
├── services
│   ├── gateway
│   ├── latency-benchmarks
│   ├── logdrain
│   └── semantic-cache
├── tooling
│   ├── eslint-config
│   ├── prettier-config
│   ├── tailwind-config
│   └── typescript-config
├── tsconfig.json
├── turbo
│   └── generators
├── turbo.json
├── types
│   └── index.ts
└── vercel.json
```

Key directories and their purposes:

- `apps/`: Contains individual applications (e.g., api, dashboard, docs, engine, lead, mobile, website, www)
- `docs/`: Documentation for developers and platform
- `internal/`: Internal modules and utilities (e.g., app-config, backend-client, billing, cache, db)
- `packages/`: Shared packages and modules (e.g., analytics, app-store, assets, documents, editor)
- `services/`: Microservices and specialized services (e.g., gateway, latency-benchmarks, logdrain)
- `tooling/`: Development and build tools (e.g., eslint-config, prettier-config, tailwind-config)
- `types/`: Global TypeScript type definitions

Other important files:

- `biome.json`: Configuration for Biome (linter/formatter)
- `bun.lockb`: Bun package manager lock file
- `bunfig.toml`: Bun configuration file
- `commitlint.config.ts`: Commit message linting configuration
- `turbo.json`: Turborepo configuration for monorepo management
- `vercel.json`: Vercel deployment configuration

This structure allows for better code organization, shared resources, and easier management of multiple applications and services within the Solomon AI ecosystem.

## Coding Guidelines

- Write concise, well-documented TypeScript code.
- Use functional components with TypeScript interfaces.
- Follow functional and declarative programming patterns; avoid classes.
- Use descriptive variable names with auxiliary verbs (e.g., `isLoading`, `hasError`).
- Prefer iteration and modularization over code duplication.
- Use Shadcn UI, Radix UI, and Tailwind CSS for components and styling.
- Implement responsive design with a mobile-first approach.
- Optimize for performance, especially in React and Next.js components:
  - Minimize use of `use client`, `useEffect`, and `useState`.
  - Favor React Server Components (RSC) where possible.
  - Use dynamic loading for non-critical components.
- Use `next-safe-action` for all server actions with proper validation and error handling.
- Utilize `useQueryState` for query state management.

## Testing

- Write unit tests for new features or bug fixes using Jest and React Testing Library.
- Aim for high test coverage, especially for critical functionality.
- Run tests before submitting a pull request:
  ```bash
  bun test
  ```

## Documentation

- Update relevant documentation when adding or modifying features.
- Use clear, concise language in comments and documentation.
- For significant changes, update the README.md file if necessary.

## Submitting a Pull Request

1. Create a pull request from your fork to the `main` branch of the Solomon AI repository.
2. Ensure you check "Allow edits from maintainers".
3. Link related issues using `refs #XXX` or `fixes #XXX` in the PR description.
4. Fill out the PR template completely, including:
   - A clear title and description of your changes
   - Any breaking changes
   - Steps to test the changes
   - Screenshots or GIFs for UI changes
5. Ensure all tests pass and there are no linting errors.
6. Wait for review and address any feedback.

## Review Process

- All contributions will be reviewed by maintainers.
- Be open to feedback and be prepared to make changes to your code.
- Reviewers will look for code quality, test coverage, and adherence to project guidelines.
- Once approved, a maintainer will merge your PR.

## Community

- Join our [Discord server](https://discord.gg/solomonai) for discussions and support.
- Follow us on [Twitter](https://twitter.com/SolomonAIEng) for updates.
- Subscribe to our [newsletter](https://solomonai.com/newsletter) for important announcements.
- Attend our monthly community calls (schedule available on Discord).

Thank you for contributing to Solomon AI! Your efforts help empower small businesses with advanced financial tools.