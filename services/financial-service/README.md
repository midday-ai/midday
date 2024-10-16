# Financial Service API

## Overview

The Financial Service API is a robust and scalable backend service designed to simplify access to banking and financial information. By integrating with multiple financial data providers (Plaid, GoCardless, Teller, and Stripe), it offers a unified interface for developers to retrieve account information, transactions, balances, and more.

Built with TypeScript and deployed on Cloudflare Workers, this API provides a high-performance, globally distributed solution for fintech applications and services.

<div align="center" width="100%">
    <img src="../../saasfly-logo.svg" width="128" alt="" />
</div>

## Table of Contents

- [Features](#features)
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
  - [Error Handling](#error-handling)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding a New Provider](#adding-a-new-provider)
  - [Coding Standards](#coding-standards)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

## Features

- **Multi-provider Support**: Seamless integration with Plaid, GoCardless, Teller, and Stripe
- **Unified Data Model**: Consistent data structure across all providers
- **Account Information**: Retrieve detailed account data
- **Transaction Fetching**: Access transaction history with advanced filtering
- **Balance Checking**: Real-time account balance information
- **Institution Data**: Comprehensive list of supported financial institutions
- **Bank Statements**: Retrieve and download bank statements in PDF format
- **Health Monitoring**: Endpoint for checking API and integration health
- **Typescript Support**: Full TypeScript support for improved developer experience
- **Cloudflare Workers**: Leverages edge computing for low-latency, globally distributed API access
- **Webhook Support**: Real-time notifications for account updates and transactions

## Quick Start

To quickly get started with the Financial Service API:

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/financial-service-api.git
   cd financial-service-api
   npm install
   ```

2. Set up your environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   # Edit .dev.vars with your API keys
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Make your first API call:
   ```bash
   curl http://localhost:3002/v1/health
   ```

For more detailed setup instructions, see the [Getting Started](#getting-started) section.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Wrangler CLI (for Cloudflare Workers development)
- API keys for the financial data providers you plan to use

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/financial-service-api.git
   cd financial-service-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   ```
   Edit `.dev.vars` and fill in your API keys and other configuration values.

### Configuration

The Financial Service API uses environment variables for configuration. Key variables include:

- `PLAID_CLIENT_ID`: Your Plaid client ID
- `PLAID_SECRET`: Your Plaid secret key
- `GOCARDLESS_ACCESS_TOKEN`: Your GoCardless access token
- `TELLER_APPLICATION_ID`: Your Teller application ID
- `STRIPE_SECRET_KEY`: Your Stripe secret key

Refer to `.dev.vars-example` for a complete list of required environment variables.

## Usage

### Running Locally

To start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3002`.

### Testing

Run the test suite:

```bash
npm test
```

For coverage report:

```bash
npm run test:coverage
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

For staging deployment:

```bash
npm run deploy:staging
```

## API Reference

### Authentication

The Financial Service API uses bearer token authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### Rate Limits

- 100 requests per minute per IP address
- 1000 requests per hour per API key

### Base URL

All API requests should be made to:

```
https://financial-service.solomon-ai-platform.com/v1
```

### Endpoints

#### List Institutions

Retrieve a list of supported financial institutions.

```
GET /institutions
```

Query Parameters:
- `country` (optional): ISO 3166-1 alpha-2 country code to filter institutions
- `search` (optional): Search term to filter institutions by name

Example Response:
```json
{
  "institutions": [
    {
      "id": "ins_12345",
      "name": "Bank of Example",
      "logo": "https://example.com/logo.png",
      "country": "US",
      "products": ["auth", "transactions", "balance"]
    }
  ]
}
```

#### Get User's Linked Accounts

Retrieve a list of user's linked financial accounts.

```
GET /accounts
```

Query Parameters:
- `provider` (optional): Filter accounts by provider (e.g., "plaid", "gocardless")

Example Response:
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
      "mask": "1234"
    }
  ]
}
```

#### Fetch Transactions

Retrieve transactions for a specific account.

```
GET /transactions
```

Query Parameters:
- `account_id` (required): ID of the account to fetch transactions for
- `start_date` (optional): Start date for transaction range (YYYY-MM-DD)
- `end_date` (optional): End date for transaction range (YYYY-MM-DD)
- `limit` (optional): Number of transactions to return (default: 100, max: 500)
- `offset` (optional): Number of transactions to skip (for pagination)

Example Response:
```json
{
  "transactions": [
    {
      "id": "txn_abcdef",
      "account_id": "acc_67890",
      "date": "2023-04-15",
      "amount": -50.00,
      "currency": "USD",
      "description": "ACME Store",
      "category": "Shopping",
      "pending": false
    }
  ],
  "total_count": 1500,
  "has_more": true
}
```

#### Check Account Balance

Retrieve current balance information for an account.

```
GET /accounts/balance
```

Query Parameters:
- `account_id` (required): ID of the account to check balance for

Example Response:
```json
{
  "balance": {
    "current": 1500.50,
    "available": 1450.50,
    "limit": 2000.00,
    "currency": "USD"
  },
  "last_updated": "2023-04-15T14:30:00Z"
}
```

#### List Available Bank Statements

Retrieve a list of available bank statements.

```
GET /statements
```

Query Parameters:
- `account_id` (required): ID of the account to fetch statements for
- `start_date` (optional): Start date for statement range (YYYY-MM-DD)
- `end_date` (optional): End date for statement range (YYYY-MM-DD)

Example Response:
```json
{
  "statements": [
    {
      "id": "stmt_12345",
      "account_id": "acc_67890",
      "start_date": "2023-03-01",
      "end_date": "2023-03-31",
      "document_type": "PDF"
    }
  ]
}
```

#### Download Bank Statement PDF

Download a specific bank statement as a PDF.

```
GET /statements/pdf
```

Query Parameters:
- `statement_id` (required): ID of the statement to download

Response:
- Content-Type: application/pdf
- Binary PDF data

#### Check API Health

Check the health status of the API and its integrations.

```
GET /health
```

Example Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "providers": {
    "plaid": "operational",
    "gocardless": "operational",
    "teller": "degraded",
    "stripe": "operational"
  },
  "last_checked": "2023-04-15T15:00:00Z"
}
```

### Error Handling

All endpoints may return the following error structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message."
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Invalid or missing API key
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `INVALID_REQUEST`: Malformed request or invalid parameters
- `PROVIDER_ERROR`: Error from the underlying financial data provider
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Development

### Project Structure

```
financial-service-api/
├── src/
│   ├── providers/
│   │   ├── plaid/
│   │   ├── gocardless/
│   │   ├── teller/
│   │   └── stripe/
│   ├── routes/
│   ├── utils/
│   └── index.ts
├── tests/
├── tasks/
├── docs/
└── package.json
```

### Adding a New Provider

1. Create a new directory under `src/providers/` for the provider
2. Implement the provider API client, following the pattern in existing providers
3. Create transformation functions to standardize the provider's data format
4. Update the `Provider` interface in `src/providers/interface.ts`
5. Add the new provider to the `Providers` enum in `src/common/schema.ts`
6. Implement necessary route handlers in `src/routes/`
7. Add tests for the new provider in `tests/providers/`

### Runnable Tasks

#### Download Logos

```
bun tasks/download-teller.ts
```

#### Sync CDN

```
rclone copy logos r2demo:engine-assets -v --progress
```

#### Import Institutions

```
bun tasks/import.ts
```

### Coding Standards

- Follow the TypeScript best practices and coding style guide
- Maintain 100% test coverage for critical paths
- Document all public functions and classes using JSDoc comments
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

### Performance Optimization

- Use caching strategies to reduce API calls to financial providers
- Implement request batching for bulk operations
- Utilize Cloudflare Workers' edge caching capabilities
- Optimize database queries and indexing

## Contributing

We welcome contributions to the Financial Service API! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and write tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Security

Security is a top priority for the Financial Service API. We implement the following security measures:

- End-to-end encryption for all data in transit
- Regular security audits and penetration testing
- Compliance with financial industry standards (PCI DSS, SOC 2)
- Strict access controls and authentication mechanisms
- Continuous monitoring for suspicious activities

If you discover a security vulnerability, please send an e-mail to security@solomon-ai.co. All security vulnerabilities will be promptly addressed.

Please refer to our [Security Policy](SECURITY.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact our support team at support@solomon-ai.co.

---

Made with ❤️ by the Solomon AI Engineering Team