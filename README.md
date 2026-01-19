![hero](github.png)

<p align="center">
	<h1 align="center"><b>Abacus</b></h1>
<p align="center">
    Your AI-Powered MCA Portfolio Management Platform
    <br />
    <br />
    <a href="https://github.com/midday-ai/midday/issues">Issues</a>
  </p>
</p>

<p align="center">
  <a href="https://go.midday.ai/K7GwMoQ">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </a>
</p>

## About Abacus

Abacus is a portfolio management platform built for **MCA funders and collections teams**. It brings together loan tracking, payment monitoring, collections workflows, and reporting into a single, modern system—replacing scattered spreadsheets and legacy tools with a cohesive platform.

### Who is Abacus for?

- **MCA Funders**: Manage merchant cash advance portfolios with full lifecycle tracking
- **Collections Teams**: Monitor delinquencies, track payments, manage risk
- **Funder Reps**: Oversee merchant relationships and payment performance
- **Operations Teams**: Sync data, generate reports, and maintain compliance

---

## Features

### Authentication & Access Control
- **Dual auth system**: Borrower authentication via Supabase, Admin authentication via NextAuth
- **Role-based access control**: ADMIN, BORROWER, FUNDER_REP, COLLECTIONS roles
- **Protected routes**: Middleware-enforced route protection

### Borrower Dashboard
- Active loans overview with summary cards
- Payment history and ledger view
- Balance burndown visualization
- PDF/CSV export capabilities
- Visual progress indicators (loan completion percentage)

### Admin Dashboard
- Portfolio overview with aggregate metrics
- Comprehensive loan list with advanced filtering
- Data sync controls (Google Sheets integration)
- User management and loan oversight
- Performance analytics and reporting

### Collections Panel
- **Risk score calculation**: Auto-calculated from payment performance
- Weekly/daily payment tracking
- Performance percentage monitoring
- Last payment column with status indicators
- Customizable column visibility
- Delinquency bucket categorization

### Loan Management
- Complete loan lifecycle tracking (funding → payoff)
- Financial calculations:
  - Principal amount
  - Payback amount
  - Commission
  - Net funding
- NSF (Non-Sufficient Funds) management
- Renewal detection and lump sum handling
- Days past due (DPD) tracking

### Data Synchronization
- **Google Sheets integration** for existing workflows
- Intelligent upsert with change tracking
- Error handling and sync logging
- Dual sheet support (main data + payment detail)

### Merchant View
- Admin impersonation for customer support
- Searchable merchant directory
- Full borrower experience access for troubleshooting

### Reporting & Analytics
- Upcoming renewals identification
- Almost finished loans tracking
- Delinquency buckets and categorization
- Performance tables with sorting/filtering
- Portfolio health metrics

### Letter Generation (Planned)
- Collection letters
- Payment reminders
- Compliance documentation

---

## Platform Capabilities

### Bank Connectors
- **Plaid**: Bank connections in US and Canada
- **GoCardless**: Bank connections in the EU
- **Teller**: Bank connections in the US

### UX & Visualizations
- Modern data tables with sorting, filtering, and pagination
- Responsive design for desktop and mobile
- Real-time updates and notifications

### Multi-User Surfaces
- Rep management interfaces
- Collections team dashboards
- User profile management

### Background Jobs
- Trigger.dev for async processing
- Scheduled tasks and webhooks
- Data sync automation

### AI Integration
- **Gemini**: Intelligent document processing
- **OpenAI**: Financial insights and assistance

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Database** | PostgreSQL via Supabase + Prisma |
| **Auth** | Supabase Auth + NextAuth.js |
| **Monorepo** | Bun + Turbo |
| **Desktop** | Tauri |
| **Mobile** | Expo |
| **Testing** | Playwright |

---

## App Architecture

### Monorepo Structure

```
apps/
├── api/          # Backend API (tRPC)
├── dashboard/    # Main web application
├── desktop/      # Tauri desktop app
├── website/      # Marketing site
└── ...
```

### Hosting

| Service | Purpose |
|---------|---------|
| **Supabase** | Database, storage, realtime, auth |
| **Vercel** | Website, Dashboard |
| **Fly.io** | API/tRPC |

### Services

| Service | Purpose |
|---------|---------|
| **Trigger.dev** | Background jobs |
| **Resend** | Transactional & marketing email |
| **GitHub Actions** | CI/CD |
| **GoCardless** | Bank connection (EU) |
| **Plaid** | Bank connection (US/Canada) |
| **Teller** | Bank connection (US) |
| **OpenPanel** | Events and analytics |
| **Polar** | Payment processing |
| **Typesense** | Search |
| **Gemini** | AI processing |
| **OpenAI** | AI assistance |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Docker](https://www.docker.com/) (for local Supabase)
- Node.js 18+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/abacus.git
   cd abacus
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables for:
   - Supabase connection
   - Authentication providers
   - Third-party services (Plaid, Resend, etc.)

4. **Start local Supabase**
   ```bash
   bunx supabase start
   ```

5. **Run database migrations**
   ```bash
   bun db:migrate
   ```

6. **Start development server**
   ```bash
   bun dev
   ```

The dashboard will be available at `http://localhost:3000`.

---

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/96aae855e5dd87c30d53c1d154b37cf7aa5a89b3.svg "Repobeats analytics image")

---

## License

This project is licensed under the **[AGPL-3.0](https://opensource.org/licenses/AGPL-3.0)** for non-commercial use.

### Commercial Use

For commercial use or deployments requiring a setup fee, please contact us for a commercial license.

By using this software, you agree to the terms of the license.
