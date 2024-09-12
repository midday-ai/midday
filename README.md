<div align="center" width="100%">
    <img src="./saasfly-logo.svg" width="128" alt="" />
</div>

<p align="center">
	<h1 align="center"><b>Solomon AI</b></h1>
<p align="center">
    We help new fintech companies launch faster by providing a suite of essential services and tools.
    <br />
    <br />
    <a href="https://go.Solomon AI.ai/anPiuRx">Discord</a>
    ·
    <a href="https://solomon-ai.app">Website</a>
    ·
    <a href="https://github.comSolomonAIEngineering/SolomonAIEngineering-frontend-financial-platform/issues">Issues</a>
  </p>
</p>

## About Solomon AI

Solomon AI is a fintech company that helps companies ship products faster. We are a team of 3 people that are passionate about building products that help people live better lives.

## Features

### Workspace/File-Storage as a Service

- Secure cloud storage for sensitive financial documents
- Version control for important files
- Collaborative workspaces for team members
- Integration with popular productivity tools
- Compliance-ready storage solutions adhering to financial regulations

### Workflows as a Service

- Customizable workflow templates for common fintech processes
- Automation of repetitive tasks such as KYC (Know Your Customer) checks
- Visual workflow builders for non-technical users
- Integration with external APIs and services
- Audit trails and logging for regulatory compliance

### Financial Engine/Provider as a Service

- Modular architecture for various financial products (loans, investments, insurance)
- Real-time transaction processing capabilities
- Integration with major payment gateways and banking systems
- Sandbox environments for testing financial products

### Financial Ledger as a Service

- Double-entry bookkeeping system
- Real-time balance sheet and income statement generation
- Multi-currency support
- Automated reconciliation tools
- Audit-ready financial reporting

### Analytics as a Service

- Comprehensive API suite for financial analytics:

  - User financial health scoring
  - Spending pattern analysis
  - Income stability assessment
  - Debt-to-income ratio calculations
  - Savings rate and goal tracking

- Real-time data processing:

  - Up-to-the-12h financial metrics
  - Instant transaction categorization
  - Live budget tracking and alerts

- Predictive analytics for risk management:

  - Credit risk scoring models
  - Default probability predictions
  - Cash flow forecasting
  - Investment risk analysis

- Developer-friendly features:
  - Comprehensive API documentation
  - SDKs for popular programming languages
  - Sandbox environment for testing and integration

### Team Management (Social) as a Service

Our Team Management service provides a robust API suite that enables fintech startups to build powerful, secure, and compliant team collaboration features. This service acts as a specialized social network for financial teams, offering:

- Conversation and Interaction APIs:

  - Real-time messaging endpoints for team discussions
  - Thread-based conversation management
  - File sharing and collaborative document editing
  - Tagging and mention functionality
  - Reaction and comment systems

- Team Structure and Permissions API:

  - Dynamic role-based access control management
  - Team creation and member invitation endpoints
  - Hierarchical team structure support
  - Custom permission set creation and assignment

- Task and Workflow Management API:

  - Task creation, assignment, and tracking
  - Workflow template management
  - Progress tracking and reporting
  - Deadline and reminder systems

- Activity Feeds and Notifications API:

  - Customizable activity streams for users and teams
  - Push notification management for mobile and web
  - Email digest generation for team activities

- Security and Encryption:

  - End-to-end encryption for all communications
  - Multi-factor authentication integration
  - Secure file storage and sharing
  - Data retention and deletion policies

- Integration Capabilities:

  - Webhook support for real-time event notifications
  - OAuth 2.0 for secure authorization
  - SSO (Single Sign-On) compatibility

- Developer Tools:
  - Comprehensive API documentation
  - SDKs for major programming languages
  - Sandbox environment for testing and integration

## 🚀 Getting Started

### 📋 Prerequisites

Before you start, make sure you have the following installed:

1. [Bun](https://bun.sh/) & [Node.js](https://nodejs.org/) & [Git](https://git-scm.com/)

   1. Linux

   ```bash
     curl -sL https://gist.github.com/tianzx/874662fb204d32390bc2f2e9e4d2df0a/raw -o ~/downloaded_script.sh && chmod +x ~/downloaded_script.sh && source ~/downloaded_script.sh
   ```

   2. MacOS

   ```bash
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     brew install git
     brew install oven-sh/bun/bun
     brew install nvm
   ```

2. [PostgreSQL](https://www.postgresql.org/)
   1. You can use Vercel Postgres or a local PostgreSQL server(add POSTGRES_URL env in .env.local)
      ```bash
         POSTGRES_URL = ''
      ```

### Installation

To get started with this boilerplate, we offer two options:

1. Use the `bun create` command(🌟Strongly recommend🌟):

```bash
bun create saasfly
```

2. Manually clone the repository:

```
bash git@github.com:PlaybookMediaEngineering/tesseract-engineering.git
cd tesseract-engineering
bun install
```

### Setup

Follow these steps to set up your project:

1. Set up the environment variables:

```bash
cp .env.example .env.local
// (you must have a database prepared before running this command)
bun db:push
```

2. Run the development server:

```bash
bun run dev:web
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

4. (Optional alpha)`bun run tailwind-config-viewer` Open [http://localhost:3333](http://localhost:3333) in your browser to see your Tailwind CSS configuration

## ⭐ Features

### 🐭 Frameworks

- **[Next.js](https://nextjs.org/)** - The React Framework for the Web (with **App Directory**)
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js
- **[Kysely](https://kysely.dev/)** - The type-safe SQL query builder for TypeScript
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM for Node.js and TypeScript, used as a schema management tool
- **[React-email](https://react.email/)** - A React renderer for creating beautiful emails using React components

### 🐮 Platforms

- **[Vercel](https://vercel.com/)** – Deploy your Next.js app with ease
- **[Stripe](https://stripe.com/)** – Payment processing for internet businesses
- **[Resend](https://resend.com/)** – Email marketing platform for developers

### 🐯 Enterprise Features

- **[i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)** - Support for internationalization
- **[SEO](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)** - Search engine optimization
- **[MonoRepo](https://turbo.build/)** - Monorepo for better code management
- **[T3 Env](https://env.t3.gg/)** - Manage your environment variables with ease

### 🐰 Data Fetching

- **[trpc](https://trpc.io/)** – End-to-end typesafe APIs made easy
- **[tanstack/react-query](https://react-query.tanstack.com/)** – Hooks for fetching, caching and updating asynchronous data in React

### 🐲 Global State Management

- **[Zustand](https://zustand.surge.sh/)** – Small, fast and scalable state management for React

### 🐒 UI

- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first CSS framework for rapid UI development
- **[Shadcn/ui](https://ui.shadcn.com/)** – Re-usable components built using Radix UI and Tailwind CSS
- **[Framer Motion](https://framer.com/motion)** – Motion library for React to animate components with ease
- **[Lucide](https://lucide.dev/)** – Beautifully simple, pixel-perfect icons
- **[next/font](https://nextjs.org/docs/basic-features/font-optimization)** – Optimize custom fonts and remove external network requests for improved performance

### 🐴 Code Quality

- **[TypeScript](https://www.typescriptlang.org/)** – Static type checker for end-to-end type safety
- **[Prettier](https://prettier.io/)** – Opinionated code formatter for consistent code style
- **[ESLint](https://eslint.org/)** – Pluggable linter for Next.js and TypeScript
- **[Husky](https://typicode.github.io/husky)** – Git hooks made easy

### 🐑 Performance

- **[Vercel Analytics](https://vercel.com/analytics)** – Real-time performance metrics for your Next.js app
- **[bun.sh](https://bun.sh/)** – npm alternative for faster and more reliable package management

### 🐘 Database

- **[PostgreSQL](https://www.postgresql.org/)** – The world's most advanced open source database

## 📦 Apps and Packages

- `web`: The main Next.js application
- `ui`: Shared UI components
- `db`: Database schema and utilities
- `auth`: Authentication utilities
- `email`: Email templates and utilities

## 📜 License

This project is licensed under the MIT License. For more information, see the [LICENSE](./LICENSE) file.

## 🙏 Credits

This project was inspired by shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy) and t3-oss's [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo).

Made with [contrib.rocks](https://contrib.rocks).

<!-- Badges and links -->

[check-workflow-badge]: https://img.shields.io/github/actions/workflow/status/saasfly/saasfly/ci.yml?label=ci
[github-license-badge]: https://img.shields.io/badge/License-MIT-green.svg
[discord-badge]: https://img.shields.io/discord/1204690198382911488?color=7b8dcd&link=https%3A%2F%2Fsaasfly.io%2Fdiscord
[made-by-nextify-badge]: https://img.shields.io/badge/made_by-nextify-blue?color=FF782B&link=https://nextify.ltd/
[check-workflow-badge-link]: https://github.com/saasfly/saasfly/actions/workflows/check.yml
[github-license-badge-link]: https://github.com/saasfly/saasfly/blob/main/LICENSE
[discord-badge-link]: https://discord.gg/8SwSX43wnD
[made-by-nextify-badge-link]: https://nextify.ltd
