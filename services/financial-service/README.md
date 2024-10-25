# Financial Service API

<div align="center">
    <img src="../../saasfly-logo.svg" width="128" alt="SaaSfly Logo" />
</div>

## Overview

The **Financial Service API** is a high-performance, distributed microservices platform designed for seamless integration with multiple financial data providers. Engineered with [TypeScript](https://www.typescriptlang.org/) and leveraging [WebAssembly (WASM)](https://webassembly.org/) modules for compute-intensive tasks, the API ensures deterministic performance across Cloudflare's global edge network.

Deployed on [Cloudflare Workers](https://workers.cloudflare.com/), the API utilizes serverless execution, KV storage for low-latency data access, and adheres to event-driven, non-blocking I/O models powered by the V8 JavaScript engine. This architecture enables high concurrency, throughput, and scalability, making it an ideal solution for financial applications requiring real-time data processing and minimal latency.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Running Locally](#running-locally)
  - [Testing](#testing)
  - [Deployment](#deployment)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Rate Limits](#rate-limits)
  - [Base URL](#base-url)
  - [Endpoints](#endpoints)
    - [List Institutions](#list-institutions)
    - [Get User's Linked Accounts](#get-users-linked-accounts)
    - [Fetch Transactions](#fetch-transactions)
    - [Check Account Balance](#check-account-balance)
    - [List Available Bank Statements](#list-available-bank-statements)
    - [Download Bank Statement PDF](#download-bank-statement-pdf)
    - [Check API Health](#check-api-health)
  - [Data Models](#data-models)
  - [Error Handling](#error-handling)
- [Integration with Financial Providers](#integration-with-financial-providers)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding a New Provider](#adding-a-new-provider)
  - [Coding Standards](#coding-standards)
  - [Performance Optimization](#performance-optimization)
  - [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [License](#license)
- [Support](#support)

## Features

- **Multi-Provider Integration Layer**: A modular abstraction layer facilitating seamless integration with multiple financial data providers such as [Plaid](https://plaid.com/), [GoCardless](https://gocardless.com/), [Teller](https://teller.io/), and [Stripe](https://stripe.com/). Each provider module adheres to a unified interface contract defined via TypeScript interfaces and abstract classes, ensuring extensibility and interoperability.

- **Unified Data Schema**: Consistent data models defined using [JSON Schema](https://json-schema.org/) and TypeScript types, ensuring uniform data representation across disparate provider APIs. This simplifies downstream processing, validation, and data integrity.

- **Advanced Account Information Retrieval**: Offers detailed account metadata, including account hierarchies, ownership structures, and account attributes, normalized from provider-specific formats into a standardized schema.

- **Efficient Transaction Fetching**: Implements paginated transaction retrieval with support for advanced filtering parameters such as date ranges, transaction types, categories, and merchant details. Utilizes provider APIs' bulk data endpoints where available to optimize performance and reduce latency.

- **Real-Time Balance Checking**: Provides instantaneous account balance information by leveraging WebSocket connections or provider-specific real-time APIs. Ensures data freshness and consistency through cache invalidation strategies and periodic synchronization tasks.

- **Comprehensive Institution Data**: Maintains an up-to-date repository of supported financial institutions, including metadata such as routing numbers, SWIFT codes, and institution capabilities. Data is synchronized periodically via provider APIs and stored in a distributed key-value store for low-latency access.

- **Bank Statement Retrieval**: Facilitates the retrieval and generation of bank statements in PDF format, utilizing provider APIs or synthesizing documents via templating engines and data aggregation when native support is not available.

- **Health Monitoring and Observability**: Exposes health check endpoints and integrates with monitoring tools (e.g., [Prometheus](https://prometheus.io/), [Grafana](https://grafana.com/)) to provide real-time metrics on API performance, error rates, and provider integration statuses. Utilizes structured logging and distributed tracing ([OpenTelemetry](https://opentelemetry.io/)) for debugging and performance analysis.

- **TypeScript and WebAssembly Support**: Leverages TypeScript's advanced language features for robust application development and employs WebAssembly modules for performance-critical code paths, enabling near-native execution speeds within a JavaScript environment.

- **Edge Computing with Cloudflare Workers**: Deployed across Cloudflare's edge network, the API benefits from reduced latency and improved performance due to proximity to end-users. Utilizes Cloudflare Workers for serverless execution, KV storage for distributed data persistence, and Durable Objects for stateful interactions.

- **Webhook Event Handling**: Implements webhook listeners and dispatchers for real-time event handling, such as transaction updates or account changes, utilizing message queues and event-driven architectures to ensure reliable and scalable processing.

## Architecture

The Financial Service API is architected as a set of microservices deployed on Cloudflare Workers, taking full advantage of Cloudflare's global network of data centers to execute code at the edge.

![Architecture Diagram](architecture-diagram.png)

**Key Components:**

- **Cloudflare Workers**: Serverless functions running at the edge, providing low-latency execution.

- **Provider Modules**: Abstracted interfaces and implementations for each financial data provider, enabling modular integration.

- **KV Storage**: Cloudflare's key-value store for distributed, low-latency data access.

- **Durable Objects**: For maintaining stateful interactions when necessary.

- **WebAssembly Modules**: High-performance execution of compute-intensive tasks within the Workers environment.

- **API Gateway**: Routes incoming requests to the appropriate services, handles authentication and rate limiting.

- **Monitoring and Logging**: Integration with observability tools for real-time monitoring and alerting.

**Design Principles:**

- **Modularity**: Components are designed as independent modules that communicate over well-defined interfaces.

- **Scalability**: Leveraging serverless architecture for automatic scaling based on demand.

- **Resilience**: Implementing retry mechanisms, circuit breakers, and fallback strategies.

- **Security**: Employing best practices in authentication, encryption, and data handling.

## Quick Start

To set up the Financial Service API in a development environment, follow these steps:

1. **Clone the Repository and Install Dependencies:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/financial-service-api.git
   cd financial-service-api
   npm install
   ```

   Ensure that you have Node.js (v14 or later) and npm (v6 or later) installed.

2. **Configure Environment Variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   ```

   Populate `.dev.vars` with your provider API keys, Cloudflare account details, and other necessary configurations.

3. **Start the Development Server:**

   ```bash
   npm run dev
   ```

   This command initializes a local development server using `wrangler dev`, emulating the Cloudflare Workers environment.

4. **Test API Connectivity:**

   ```bash
   curl http://localhost:8787/v1/health
   ```

   A successful response indicates that the API is operational.

For detailed setup instructions, refer to the [Getting Started](#getting-started) section.

## Getting Started

### Prerequisites

- **Node.js**: Version 14.x or later (LTS recommended)
- **npm**: Version 6.x or later
- **Wrangler CLI**: Install globally via `npm install -g wrangler`
- **Provider API Credentials**:
  - [Plaid](https://plaid.com/) API keys
  - [GoCardless](https://gocardless.com/) API keys
  - [Teller](https://teller.io/) API keys
  - [Stripe](https://stripe.com/) API keys
- **Cloudflare Account**: With Workers and KV storage enabled

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/financial-service-api.git
   cd financial-service-api
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   ```

   Edit `.dev.vars` to include your API keys and other configuration parameters.

### Configuration

**Key Environment Variables:**

- **Plaid Integration:**
  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_ENV` (e.g., `sandbox`, `development`, `production`)

- **GoCardless Integration:**
  - `GOCARDLESS_ACCESS_TOKEN`
  - `GOCARDLESS_ENVIRONMENT` (`sandbox` or `live`)

- **Teller Integration:**
  - `TELLER_APPLICATION_ID`
  - `TELLER_ACCESS_KEY`

- **Stripe Integration:**
  - `STRIPE_SECRET_KEY`

- **Cloudflare Configuration:**
  - `CF_ACCOUNT_ID`
  - `CF_API_TOKEN`
  - `CF_NAMESPACE_ID` (for KV storage)

**Example `.dev.vars` File:**

```ini
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

GOCARDLESS_ACCESS_TOKEN=your-gocardless-token
GOCARDLESS_ENVIRONMENT=sandbox

TELLER_APPLICATION_ID=your-teller-app-id
TELLER_ACCESS_KEY=your-teller-access-key

STRIPE_SECRET_KEY=your-stripe-secret-key

CF_ACCOUNT_ID=your-cloudflare-account-id
CF_API_TOKEN=your-cloudflare-api-token
CF_NAMESPACE_ID=your-kv-namespace-id

ENVIRONMENT=development
PORT=8787
```

Ensure all variables are securely managed and not committed to version control.

## Usage

### Running Locally

Start the development server using Wrangler:

```bash
npm run dev
```

This command runs `wrangler dev`, which starts a local server emulating the Cloudflare Workers environment. The API will be accessible at `http://localhost:8787`.

### Testing

Run the test suite:

```bash
npm test
```

For a coverage report:

```bash
npm run test:coverage
```

This executes tests using Jest and generates a coverage report in the `coverage/` directory.

### Deployment

**Deploy to Production:**

Ensure your `wrangler.toml` is configured with your production environment settings.

```bash
npm run deploy
```

This runs `wrangler publish`, deploying the API to Cloudflare Workers in your production environment.

**Deploy to Staging:**

Set up a staging environment in `wrangler.toml`:

```toml
[env.staging]
name = "financial-service-api-staging"
account_id = "your-cloudflare-account-id"
workers_dev = true
kv_namespaces = [
  { binding = "KV_NAMESPACE", id = "your-staging-kv-namespace-id" }
]
```

Deploy to staging with:

```bash
npm run deploy:staging
```

## API Reference

### Authentication

The API uses Bearer Token authentication. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits

- **Per IP Address**: 100 requests per minute
- **Per API Key**: 1000 requests per hour

Exceeding these limits will result in a `429 Too Many Requests` response.

### Base URL

```
https://financial-service.solomon-ai-platform.com/v1
```

### Endpoints

#### List Institutions

**Endpoint:**

```
GET /institutions
```

**Query Parameters:**

- `country` (optional): ISO 3166-1 alpha-2 code (e.g., `US`, `GB`)
- `search` (optional): Institution name search term
- `limit` (optional): Number of records to return (default: `50`, max: `100`)
- `offset` (optional): Pagination offset (default: `0`)

**Example Request:**

```http
GET /institutions?country=US&search=Bank&limit=25 HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response:**

```json
{
  "institutions": [
    {
      "id": "ins_12345",
      "name": "Bank of Example",
      "logo": "https://example.com/logo.png",
      "country": "US",
      "products": ["auth", "transactions", "balance"],
      "routing_numbers": ["123456789"],
      "swift_codes": ["BOEUS3MXXX"]
    }
  ],
  "pagination": {
    "total": 500,
    "limit": 25,
    "offset": 0
  }
}
```

#### Get User's Linked Accounts

**Endpoint:**

```
GET /accounts
```

**Query Parameters:**

- `provider` (optional): Filter by provider (`plaid`, `gocardless`, `teller`, `stripe`)
- `limit` (optional): Number of records to return (default: `50`, max: `100`)
- `offset` (optional): Pagination offset (default: `0`)

**Example Request:**

```http
GET /accounts?provider=plaid HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response:**

```json
{
  "accounts": [
    {
      "id": "acc_67890",
      "provider": "plaid",
      "institution_id": "ins_12345",
      "name": "Checking Account",
      "type": "depository",
      "subtype": "checking",
      "mask": "1234",
      "currency": "USD",
      "balance": {
        "current": 1500.50,
        "available": 1450.50
      },
      "created_at": "2023-10-25T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

#### Fetch Transactions

**Endpoint:**

```
GET /transactions
```

**Query Parameters:**

- `account_id` (required): The ID of the account to fetch transactions for.
- `start_date` (optional): Start date in `YYYY-MM-DD` format.
- `end_date` (optional): End date in `YYYY-MM-DD` format.
- `limit` (optional): Number of records to return (default: `100`, max: `500`)
- `offset` (optional): Pagination offset (default: `0`)

**Example Request:**

```http
GET /transactions?account_id=acc_67890&start_date=2023-01-01&end_date=2023-01-31 HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response:**

```json
{
  "transactions": [
    {
      "id": "txn_abcdef",
      "account_id": "acc_67890",
      "date": "2023-01-15",
      "amount": -50.00,
      "currency": "USD",
      "description": "ACME Store",
      "category": "Shopping",
      "merchant": {
        "name": "ACME Store",
        "location": {
          "address": "123 Main St",
          "city": "Anytown",
          "region": "CA",
          "postal_code": "12345",
          "country": "US"
        }
      },
      "pending": false
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 100,
    "offset": 0
  }
}
```

#### Check Account Balance

**Endpoint:**

```
GET /accounts/balance
```

**Query Parameters:**

- `account_id` (required): The ID of the account to check balance for.

**Example Request:**

```http
GET /accounts/balance?account_id=acc_67890 HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response:**

```json
{
  "balance": {
    "current": 1500.50,
    "available": 1450.50,
    "limit": 2000.00,
    "currency": "USD"
  },
  "last_updated": "2023-10-25T14:30:00Z"
}
```

#### List Available Bank Statements

**Endpoint:**

```
GET /statements
```

**Query Parameters:**

- `account_id` (required): The ID of the account.
- `start_date` (optional): Start date in `YYYY-MM-DD` format.
- `end_date` (optional): End date in `YYYY-MM-DD` format.

**Example Request:**

```http
GET /statements?account_id=acc_67890&start_date=2023-01-01&end_date=2023-03-31 HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response:**

```json
{
  "statements": [
    {
      "id": "stmt_12345",
      "account_id": "acc_67890",
      "start_date": "2023-01-01",
      "end_date": "2023-01-31",
      "document_type": "PDF",
      "available_at": "2023-02-01T00:00:00Z"
    }
  ]
}
```

#### Download Bank Statement PDF

**Endpoint:**

```
GET /statements/pdf
```

**Query Parameters:**

- `statement_id` (required): The ID of the statement to download.

**Example Request:**

```http
GET /statements/pdf?statement_id=stmt_12345 HTTP/1.1
Host: financial-service.solomon-ai-platform.com
Authorization: Bearer YOUR_API_KEY
```

**Response Headers:**

- `Content-Type`: `application/pdf`
- `Content-Disposition`: `attachment; filename="statement_2023-01.pdf"`

**Response:**

Binary PDF data of the requested bank statement.

#### Check API Health

**Endpoint:**

```
GET /health
```

**Example Request:**

```http
GET /health HTTP/1.1
Host: financial-service.solomon-ai-platform.com
```

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "dependencies": {
    "plaid": "operational",
    "gocardless": "operational",
    "teller": "degraded",
    "stripe": "operational"
  },
  "timestamp": "2023-10-25T15:00:00Z"
}
```

### Data Models

#### Institution

```typescript
interface Institution {
  id: string;
  name: string;
  logo?: string;
  country: string;
  products: string[];
  routing_numbers?: string[];
  swift_codes?: string[];
}
```

#### Account

```typescript
interface Account {
  id: string;
  provider: string;
  institution_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
  currency: string;
  balance?: {
    current: number;
    available?: number;
    limit?: number;
  };
  created_at: string;
}
```

#### Transaction

```typescript
interface Transaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  merchant?: Merchant;
  pending: boolean;
}

interface Merchant {
  name: string;
  location?: Location;
}

interface Location {
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}
```

### Error Handling

Errors are returned with appropriate HTTP status codes and a standardized JSON structure.

**Error Response Structure:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message.",
    "details": {
      "field": "account_id",
      "issue": "Missing or invalid"
    },
    "status": 400
  }
}
```

**Common Error Codes:**

- `UNAUTHORIZED` (401)
- `RATE_LIMIT_EXCEEDED` (429)
- `RESOURCE_NOT_FOUND` (404)
- `INVALID_REQUEST` (400)
- `PROVIDER_ERROR` (502)
- `INTERNAL_SERVER_ERROR` (500)

## Integration with Financial Providers

The API integrates with multiple financial data providers through provider modules, each implementing a common interface.

### Provider Modules

- **Plaid**
- **GoCardless**
- **Teller**
- **Stripe**

### Unified Interface

Each provider module implements the `FinancialProvider` interface:

```typescript
interface FinancialProvider {
  getAccounts(userId: string): Promise<Account[]>;
  getTransactions(accountId: string, options: TransactionOptions): Promise<Transaction[]>;
  getBalance(accountId: string): Promise<Balance>;
  getInstitutions(options: InstitutionOptions): Promise<Institution[]>;
  // Additional methods as needed
}
```

### Error Handling and Retry Logic

Provider modules include error handling and retry mechanisms to handle transient errors and ensure reliability.

### Data Normalization

Data from different providers is normalized into the API's unified data models, ensuring consistent responses regardless of the underlying provider.

## Development

### Project Structure

```
financial-service-api/
├── src/
│   ├── providers/
│   │   ├── plaid/
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── gocardless/
│   │   ├── teller/
│   │   └── stripe/
│   ├── routes/
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   ├── statements.ts
│   │   └── health.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── utils/
│   ├── types/
│   ├── index.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── tasks/
│   ├── sync-institutions.ts
│   ├── cleanup.ts
│   └── cron.ts
├── docs/
├── package.json
├── tsconfig.json
└── wrangler.toml
```

### Adding a New Provider

1. **Create Provider Module:**

   - Add a new directory under `src/providers/` (e.g., `src/providers/finicity/`).
   - Implement `client.ts`, `types.ts`, and `utils.ts`.

2. **Implement Provider Interface:**

   - Ensure the new provider module implements the `FinancialProvider` interface.

3. **Configure Environment Variables:**

   - Add new variables to `.dev.vars-example` and update configuration loading in `config.ts`.

4. **Update Route Handlers:**

   - Modify existing route handlers in `src/routes/` to support the new provider, if necessary.

5. **Write Tests:**

   - Add unit tests in `tests/unit/providers/`.
   - Add integration tests in `tests/integration/`.

6. **Update Documentation:**

   - Update the README and API Reference with details about the new provider.

### Coding Standards

- **TypeScript Best Practices:**

  - Enable strict mode in `tsconfig.json`.
  - Use interfaces and types to define data structures.
  - Leverage generics where appropriate.

- **Linting and Formatting:**

  - Use ESLint with TypeScript support.
  - Run `npm run lint` to check for issues.
  - Format code using Prettier (`npm run format`).

- **Testing:**

  - Write unit tests for all functions and modules.
  - Maintain high test coverage (>90%).
  - Use Jest as the testing framework.

- **Documentation:**

  - Use TSDoc comments for functions, classes, and interfaces.
  - Generate API documentation as needed.

- **Code Reviews:**

  - All changes must be reviewed and approved via pull requests before merging.

### Performance Optimization

- **Caching:**

  - Implement in-memory and distributed caching (e.g., Cloudflare KV) for frequently accessed data.

- **Asynchronous Operations:**

  - Use `async/await` and Promise patterns to handle asynchronous tasks efficiently.

- **Lazy Loading:**

  - Load modules and dependencies only when necessary to reduce initial load time.

- **Batching Requests:**

  - Combine multiple API calls into batch requests where supported by providers.

- **Resource Management:**

  - Use connection pooling.
  - Clean up resources after use to prevent memory leaks.

### Security Considerations

- **Data Encryption:**

  - Use TLS 1.2+ for data in transit.
  - Encrypt sensitive data at rest using AES-256 encryption.

- **Authentication and Authorization:**

  - Implement OAuth 2.0 where applicable.
  - Use role-based access control (RBAC).

- **Vulnerability Management:**

  - Keep dependencies up to date.
  - Use tools like Snyk or npm audit to detect vulnerabilities.

- **Compliance:**

  - Ensure compliance with PCI DSS, GDPR, and other relevant regulations.

- **Monitoring and Logging:**

  - Implement structured logging.
  - Use monitoring tools to detect anomalies.

- **Incident Response:**

  - Have a documented incident response plan.
  - Regularly train the team on security best practices.

## Contributing

We welcome contributions from the community! To contribute:

1. **Fork the Repository**

2. **Create a Feature Branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Implement Changes and Write Tests**

4. **Run Tests:**

   ```bash
   npm test
   ```

5. **Commit Changes:**

   ```bash
   git commit -am 'Add new feature: description'
   ```

6. **Push to Your Branch:**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## Security Policy

Security is a top priority. If you discover a vulnerability, please report it privately.

- **Contact:** security@solomon-ai.co
- **PGP Key:** Available upon request.

All security vulnerabilities will be addressed promptly in accordance with our [Security Policy](SECURITY.md).

**Note:** Do not open public issues for security vulnerabilities.

## License

This project is licensed under the **AGPL License**. See the [LICENSE](LICENSE) file for detailed terms.

## Support

For support:

- **Issue Tracker:** Use the GitHub [Issues](https://github.com/SolomonAIEngineering/financial-service-api/issues) for bug reports and feature requests.
- **Email:** Contact us at support@solomon-ai.co
- **Documentation:** Refer to the project [Wiki](https://github.com/SolomonAIEngineering/financial-service-api/wiki) for detailed guides and FAQs.
- **Community Discussions:** Join our [Slack Channel](https://join.slack.com/t/solomon-ai/shared_invite/).

---

Made with ❤️ by the **Solomon AI Engineering Team**

[![Solomon AI Logo](solomon-ai-logo.png)](https://www.solomon-ai.co)

---