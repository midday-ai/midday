<div align="center" width="100%">
    <img src="./saasfly-logo.svg" width="128" alt="" />
</div>

<p align="center">
	<h1 align="center"><b>Solomon AI</b></h1>
<p align="center">
  The Open Source Financial Workspace For Your Business
    <br />
    <br />
    <a href="https://go.Solomon AI.ai/anPiuRx">Discord</a>
    ·
    <a href="https://solomon-ai.app">Website</a>
    ·
    <a href="https://github.comSolomonAIEngineering/financial-platform-as-a-service/issues">Issues</a>
  </p>
</p>


## About Solomon AI

**Solomon AI** is an open-source financial workspace, purpose-built for the unique demands of cyclical businesses and brick-and-mortar establishments. Building on the innovations of __[Midday](https://midday.ai)__, we’ve created a comprehensive platform designed to empower seasonal entrepreneurs and local business owners by helping them navigate their distinct financial challenges.

### Our Mission
At Solomon AI, we are dedicated to democratizing access to powerful financial tools and AI-driven insights, giving businesses with fluctuating demand and location-based challenges the resources they need to thrive. Our platform integrates cutting-edge AI with robust financial services, offering a suite of tools that streamline operations, improve decision-making, and mitigate the uncertainties of cyclical markets.

### Why Solomon AI?
Solomon AI stands out by focusing on the often-overlooked needs of brick-and-mortar businesses and seasonal operations, ensuring you have the right tools to tackle your financial landscape.

- **Open-Source at Heart**: We believe in the power of community. With Solomon AI, transparency and adaptability come first. Our open-source codebase invites collaboration and customization, empowering businesses to tailor the platform to their specific needs while benefiting from continuous community-driven enhancements.
  
- **Designed for Cyclical Businesses**: Our platform is tailored to meet the distinct needs of businesses that experience seasonal fluctuations, such as retail stores, hospitality venues, restaurants, wineries, breweries, real estate agencies, construction firms, dealerships, urgent care centers, and tourism-related businesses. Solomon AI ensures you’re prepared for both peak seasons and slower periods, with AI-powered tools that anticipate and adapt to changes in demand.

- **Brick-and-Mortar Optimization**: Managing physical storefronts comes with its own set of financial challenges, and Solomon AI is built to handle them all. From inventory management and foot traffic analysis to insights on local market trends, our tools help you stay ahead in the dynamic world of brick-and-mortar business.

- **AI-Powered Forecasting & Insights**: With artificial intelligence at its core, Solomon AI delivers smart, data-driven insights on seasonal trends, demand forecasting, and cash flow management, ensuring your business can make informed decisions during both high-traffic and slower periods.

- **Comprehensive Financial Toolkit**: Whether you’re managing basic bookkeeping or diving into advanced analytics, Solomon AI provides a full suite of financial tools designed to meet the needs of businesses with physical locations and cyclical demand patterns.

- **Scalable Growth**: Solomon AI grows with you. Whether you’re running a single shop or managing a chain of locations, our platform adapts to the evolving financial needs of expanding businesses, providing consistent support no matter the scale.

- **Developer Platform**: We’ve built a powerful developer ecosystem to extend Solomon AI’s capabilities. By offering access to our APIs, developers can integrate Solomon AI’s financial tools directly into their own applications and workflows, creating custom solutions that leverage the platform’s robust insights.

### Building on [Midday](https://midday.ai)
By expanding upon Midday’s innovative foundation, Solomon AI is setting a new standard for financial management in cyclical and brick-and-mortar businesses. We bring enterprise-grade tools to the hands of local entrepreneurs in an accessible, open-source package. 

From seasonal forecasting to managing a storefront’s day-to-day finances, Solomon AI is here to help you succeed at every turn. Our developer platform allows businesses to seamlessly integrate our financial utilities into a wide range of applications, unlocking even greater potential for growth.


To download the full app, visit our homepage at __https://solomon-ai.app__.

## Engineering Stack
| Tool/Framework | Description |
|----------------|-------------|
| [Next.js](https://nextjs.org/) | Framework |
| [Turborepo](https://turbo.build) | Build system |
| [Expo](https://expo.com) | Mobile Development system |
| [Biome](https://biomejs.dev) | Linter, formatter |
| [TailwindCSS](https://tailwindcss.com/) | Styling |
| [Shadcn](https://ui.shadcn.com/) | UI components |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Supabase](https://supabase.com/) | Authentication, database, storage |
| [Upstash](https://upstash.com/) | Cache and rate limiting |
| [React Email](https://react.email/) | Email templates |
| [Resend](https://resend.com/) | Email delivery |
| [i18n](https://next-international.vercel.app/) | Internationalization |
| [Sentry](https://sentry.io/) | Error handling/monitoring |
| [Dub](https://dub.sh/) | Sharable links |
| [Trigger.dev](https://trigger.dev/) | Background jobs |
| [OpenPanel](https://openpanel.dev/) | Analytics |
| [Polar](https://polar.sh) | Billing (coming soon) |
| [react-safe-action](https://next-safe-action.dev) | Validated Server Actions |
| [nuqs](https://nuqs.47ng.com/) | Type-safe search params state manager |
| [next-themes](https://next-themes-example.vercel.app/) | Theme manager |

## Directory Structure

This structure showcases a well-organized monorepo setup with clear separation of concerns:

1. The `apps` directory contains different applications within the project.
2. The `internal` directory houses internal modules and utilities.
3. The `packages` directory includes shared packages used across the project.
4. The `services` directory contains various microservices.
5. The `tooling` directory manages development and build tools configurations.
6. Configuration files at the root level manage the overall project setup.

This structure allows for efficient code sharing, easier maintenance, and scalability across different parts of the project.

```
.
├── CHANGELOG.md
├── LICENSE
├── README.md
├── apps                        # App Workspace
│   ├── api                     # Supabase API
│   ├── dashboard               # Dashboard application
│   ├── docs                    # Documentation app
│   ├── engine                  # Core engine app
│   ├── lead                    # Lead generation app
│   ├── mobile                  # Mobile app
│   ├── website                 # Main website app
│   └── www                     # Public-facing web app
├── biome.json
├── bun.lockb
├── bunfig.toml
├── commitlint.config.ts
├── docs                        # Documentation files
│   ├── developer               # Developer-specific docs
│   └── platform                # Platform-specific docs
├── github.png
├── internal                    # Internal modules and utilities
│   ├── app-config              # Application configuration
│   ├── backend-client          # Backend client utilities
│   ├── billing                 # Billing-related utilities
│   ├── cache                   # Caching utilities
│   ├── db                      # Database utilities
│   ├── email                   # Email-related utilities
│   ├── encoding                # Encoding utilities
│   ├── encryption              # Encryption utilities
│   ├── error                   # Error handling utilities
│   ├── events                  # Event handling utilities
│   ├── hash                    # Hashing utilities
│   ├── id                      # ID generation utilities
│   ├── keys                    # Key management utilities
│   ├── logs                    # Logging utilities
│   ├── metrics                 # Metrics and monitoring utilities
│   ├── providers               # Service providers
│   ├── resend                  # Resend-related utilities
│   ├── schema                  # Schema definitions
│   ├── store                   # Data store utilities
│   ├── tinybird                # Tinybird integration utilities
│   ├── vercel                  # Vercel-related utilities
│   ├── worker-logging          # Worker logging utilities
│   └── zod                     # Zod schema utilities
├── midday.code-workspace
├── package.json
├── packages                    # Shared packages
│   ├── analytics               # Analytics package
│   ├── app-store               # App store integration package
│   ├── assets                  # Shared assets
│   ├── documents               # Document handling package
│   ├── editor                  # Editor package
│   ├── email                   # Email handling package
│   ├── env                     # Environment configuration package
│   ├── events                  # Event handling package
│   ├── import                  # Import utilities package
│   ├── inbox                   # Inbox management package
│   ├── jobs                    # Job scheduling package
│   ├── kv                      # Key-Value store package
│   ├── location                # Location services package
│   ├── notification            # Notification package
│   ├── stripe                  # Stripe integration package
│   ├── supabase                # Supabase integration package
│   ├── tsconfig                # Shared TypeScript configuration
│   ├── ui                      # Shared UI components
│   └── utils                   # Shared utilities
├── saasfly-logo.svg
├── services                    # Microservices
│   ├── gateway                 # API gateway service
│   ├── latency-benchmarks      # Service for performance testing
│   ├── logdrain                # Logging service
│   └── semantic-cache          # Caching service with semantic understanding
├── tooling                     # Development and build tools
│   ├── eslint-config           # ESLint configuration
│   ├── prettier-config         # Prettier configuration
│   ├── tailwind-config         # Tailwind CSS configuration
│   └── typescript-config       # TypeScript configuration
├── tsconfig.json               # TypeScript configuration for the project
├── turbo                       # Turborepo configuration
│   └── generators              # Code generators for Turborepo
├── turbo.json                  # Turborepo pipeline configuration
├── types                       # Global type definitions
│   └── index.ts                # Main types file
└── vercel.json                 # Vercel deployment configuration
```

| Prerequisite | Description |
|--------------|-------------|
| Bun          | JavaScript runtime and package manager, used for running and managing the project |
| Docker       | Containerization platform, used for creating consistent development and deployment environments |
| Upstash      | Serverless database and messaging service, likely used for data storage and real-time features |
| Dub          | Open source link management system |
| Trigger.dev  | Workflow automation platform, used for background jobs and scheduled tasks |
| Resend       | Email API service, used for sending transactional and marketing emails |
| Supabase     | Open-source Firebase alternative, provides backend services including database, authentication, and storage |
| Sentry       | Error tracking and performance monitoring service, used for identifying and diagnosing issues in production |
| OpenPanel    | Open source telemetry and monitoring platform |

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
         bun install -g supabase
      ```

### Installation


2. Manually clone the repository:

```bash 
git clone git@github.com:SolomonAIEngineering/financial-platform-as-a-service.git
cd financial-platform-as-a-service
```

3. Install dependencies using bun:

```sh
bun i
```

4. Copy `.env.example` to `.env` and update the variables.

```sh
# Copy .env.example to .env for each app
cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/web/.env.example apps/web/.env
```

5. Start the development server from either bun or turbo:

```ts
bun dev // starts everything in development mode (web, app, api, email)
bun dev:web // starts the web app in development mode
bun dev:app // starts the app in development mode
bun dev:api // starts the api in development mode
bun dev:email // starts the email app in development mode

// Database
bun migrate // run migrations
bun seed // run seed
```

## ⭐ Features | In Development/On Roadmap

#### Smart Workspace
- **Secure Cloud Storage**: Safeguard sensitive financial documents with encrypted, cloud-based solutions.
- **Version Control**: Maintain a detailed version history for critical files.
- **Collaborative Workspaces**: Empower team collaboration with shared workspaces and real-time updates.
- **Tool Integrations**: Seamless compatibility with popular productivity apps.
- **Compliance-Ready**: Meet financial regulations with built-in secure storage solutions.

#### App Marketplace & Workflow Management
- **Customizable Templates**: Pre-built workflow templates for common fintech operations.
- **Task Automation**: Automate repetitive processes for your financial team.
- **Visual Workflow Builder**: User-friendly tools for non-technical users to build workflows.
- **API Integrations & Marketplace**: Connect to external services and APIs effortlessly.
- **Regulatory Compliance**: Track every action with audit logs and detailed reporting.

#### Financial Engine (Project Wise)
- **Modular Architecture**: Build on top of financial products such as loans, and investments with a flexible framework.
- **Real-Time Processing**: Handle transactions in real time with high efficiency.
- **Payment Gateway Integration**: Connect with leading payment systems and banking networks.

#### Financial Reporting
- **Real-Time Financials**: Generate balance sheets and income statements instantly.
- **Multi-Currency Support**: Easily manage transactions across currencies.
- **Automated Reconciliation**: Reconcile accounts automatically, ensuring accuracy.
- **Audit-Ready Reports**: Generate compliant reports ready for regulatory review.

#### Analytics
- **Comprehensive Analytics API**: Access advanced financial insights, including:
  - User financial health scoring
  - Spending pattern analysis
  - Income stability assessment
  - Debt-to-income ratio
  - Savings rate tracking
- **Real-Time Data**: Up-to-the-day financial metrics, including:
  - Instant transaction categorization
  - Live budget tracking and alerts
- **Predictive Risk Analytics**: Leverage advanced forecasting models for:
  - Default probability prediction
  - Cash flow forecasting
  - Business risk analysis
- **Developer Tools**: Full API documentation, SDKs, and a sandbox environment for testing.

#### Team Management & Collaboration
- **Real-Time Collaboration**: Messaging, file sharing, and document editing APIs designed for financial teams.
- **Thread-Based Conversations**: Manage structured discussions and feedback in one place.
- **Role-Based Access Control**: Dynamic team roles and permission management with API support.
- **Task & Workflow Management**: Endpoints for task assignment, tracking, and workflow automation.
- **Activity Feeds & Notifications**: Customizable activity streams, push notifications, and email digests for team updates.
- **Security & Encryption**: End-to-end encryption, multi-factor authentication, and secure file sharing.
- **Integration & Compatibility**: OAuth 2.0, SSO, and webhook support for real-time event notifications.
  
## Contributing

We welcome contributions from the community! Whether you're fixing a bug, improving the documentation, or adding a new feature, we appreciate your help in making Solomon AI better. There is a lot of context involved and we understand it can be overwhelming when first trying to join the project. Here is a quick summary of key information and how we currently work together:

- The Solomon AI Team conducts "Missions", which are 1-week sprints aimed at completing high-priority issues. We select the most critical tasks for these missions. Our goal is to complete these high-priority issues within the 1-week timeframe. You can view current open missions on our project board.
- Outside of dedicated Missions, we have numerous issues (including good first issues) available for contribution. When tackling these, please leave a comment on the issue to indicate you're working on it (and check for existing comments). We welcome pull requests at any time and strive to review them promptly.
- We have a lot on our plate so it's easy for us to miss something. The best way to get our attention is to ping us directly in our Discord server.
- Please review our coding Contributing Guide to set up your coding environment. For any questions, join the Solomon AI Discord!

For more detailed information on how to contribute, please see our [CONTRIBUTING.md](.github/CONTRIBUTING.md) file.


## 📜 License

This project is licensed under the AGPL License. For more information, see the [LICENSE](./LICENSE) file.

## 🙏 Credits

This project is a fork of [Midday](https://github.com/midday-ai/midday)

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

