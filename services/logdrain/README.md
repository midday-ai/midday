# Logdrain

<div align="center">
  <img src="../../saasfly-logo.svg" width="128" alt="SaaSfly Logo" />
</div>

## Overview

**Logdrain** is a high-performance, globally distributed service engineered for real-time log collection, processing, and storage from diverse applications. Built with [TypeScript](https://www.typescriptlang.org/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/), Logdrain offers a robust solution for centralized log management at the edge.

Leveraging integration with [Axiom](https://axiom.co/), Logdrain provides advanced querying, visualization, and analytics capabilities. The service employs [Zod](https://github.com/colinhacks/zod) for schema validation, ensuring data integrity and reducing errors. With comprehensive error handling and security measures, Logdrain is an indispensable tool for developers and DevOps teams seeking insights into application behavior and performance.

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
  - [Deployment](#deployment)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
    - [POST /ingest](#post-ingest)
  - [Data Models](#data-models)
  - [Request Validation](#request-validation)
  - [Response Format](#response-format)
  - [Error Handling](#error-handling)
- [Integration with Axiom](#integration-with-axiom)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding New Features](#adding-new-features)
  - [Coding Standards](#coding-standards)
  - [Logging and Monitoring](#logging-and-monitoring)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [License](#license)
- [Support](#support)

## Features

- **Edge Computing with Cloudflare Workers**: Utilize serverless functions at the edge for minimal latency and high scalability, enabling real-time log ingestion globally.

- **Advanced Data Ingestion with Axiom**: Stream logs to Axiom for powerful querying, visualization, and analytics capabilities.

- **TypeScript and Zod Validation**: Ensure type safety and robust log payload validation using TypeScript interfaces and Zod schemas.

- **Flexible Log Processing**: Supports various log types, including application logs, system logs, and custom metrics.

- **Secure and Authorized Access**: Built-in authorization mechanisms to ensure that only authorized sources can send logs, enhancing security.

- **Comprehensive Error Handling**: Detailed exception handling with standardized error responses for seamless debugging.

- **Scalable and Extensible Architecture**: Modular codebase designed for easy extension and integration with other services.

- **Compliance and Data Integrity**: Ensures data integrity through strict validation and supports compliance requirements by integrating with secure storage and processing standards.

## Architecture

Logdrain is architected as a serverless application deployed on Cloudflare Workers, utilizing the global edge network to provide low-latency log ingestion and processing.

![Architecture Diagram](architecture-diagram.png)

**Key Components:**

- **Cloudflare Workers**: Executes log ingestion functions at the edge, providing scalable and distributed processing.

- **Axiom Integration**: Logs are streamed to Axiom for storage, indexing, and analysis.

- **API Gateway**: Routes incoming HTTP requests to the appropriate handlers, performing authentication and authorization checks.

- **Zod Validation Layer**: Validates incoming log payloads against defined schemas to ensure data integrity.

- **Error Handling Middleware**: Captures and formats errors before sending responses, ensuring consistent error reporting.

**Design Principles:**

- **Event-Driven Architecture**: Utilizes non-blocking I/O models facilitated by the V8 JavaScript engine for high concurrency.

- **Modularity**: Components are designed as independent modules that communicate over well-defined interfaces.

- **Security**: Implements authentication and authorization mechanisms to secure log ingestion endpoints.

- **Scalability**: Leverages serverless architecture for automatic scaling based on demand.

- **Reliability**: Employs retry mechanisms and fallback strategies to ensure log delivery.

## Quick Start

To quickly get started with Logdrain:

1. **Clone the Repository and Install Dependencies:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/logdrain.git
   cd logdrain
   npm install
   ```

2. **Set Up Environment Variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   ```

   Edit `.dev.vars` and add your Axiom API token and other necessary configurations.

3. **Start the Development Server:**

   ```bash
   npm run dev
   ```

   The service will be accessible at `http://localhost:8787`.

## Getting Started

### Prerequisites

- **Node.js**: Version 14.x or later
- **npm**: Version 6.x or later
- **Wrangler CLI**: Install globally via `npm install -g wrangler`
- **Axiom Account and API Token**
- **Git**: For version control

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/logdrain.git
   cd logdrain
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   ```

   Edit `.dev.vars` to include your Axiom API token and other configuration parameters.

### Configuration

Logdrain uses environment variables for configuration. Key variables include:

- **AXIOM_TOKEN**: Your Axiom API token.
- **AXIOM_ORG_ID**: Your Axiom organization ID.
- **AXIOM_DATASET**: (Optional) Axiom dataset name, defaults to `logdrain-logs`.
- **AUTHORIZATION**: Authorization token for secure log ingestion.
- **ENVIRONMENT**: Set to `development`, `staging`, or `production`.

**Example `.dev.vars` File:**

```ini
AXIOM_TOKEN=your-axiom-token
AXIOM_ORG_ID=your-axiom-org-id
AXIOM_DATASET=logdrain-logs
AUTHORIZATION=your-authorization-token
ENVIRONMENT=development
```

Ensure all variables are securely managed and not committed to version control.

## Usage

### Running Locally

To start the development server:

```bash
npm run dev
```

This will use `wrangler dev` to run the Cloudflare Worker locally. The service will be accessible at `http://localhost:8787`.

### Deployment

Before deploying, ensure that your `wrangler.toml` is correctly configured with your Cloudflare account details.

**Deploy to Production:**

```bash
npm run deploy
```

This executes `wrangler publish` to deploy the service to your production environment.

**Deploy to Staging:**

Set up a staging environment in `wrangler.toml`:

```toml
[env.staging]
name = "logdrain-staging"
account_id = "your-cloudflare-account-id"
workers_dev = true
```

Deploy to staging with:

```bash
npm run deploy:staging
```

## API Reference

### Authentication

Logdrain uses token-based authentication. Include the `Authorization` header in your HTTP requests:

```
Authorization: Bearer YOUR_AUTHORIZATION_TOKEN
```

### Endpoints

#### POST `/ingest`

Ingest logs into Logdrain.

- **URL:** `/ingest`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_AUTHORIZATION_TOKEN`

##### Request Body Schema

The request body should be a JSON object or array of log entries.

**Example:**

```json
[
  {
    "timestamp": "2023-10-25T14:30:00Z",
    "level": "info",
    "message": "User logged in",
    "service": "auth-service",
    "context": {
      "userId": "user_12345",
      "ipAddress": "192.168.1.1"
    }
  },
  {
    "timestamp": "2023-10-25T14:31:00Z",
    "level": "error",
    "message": "Failed to connect to database",
    "service": "database-service",
    "context": {
      "error": "ConnectionTimeout",
      "retry": true
    }
  }
]
```

- **timestamp** (string): ISO 8601 formatted timestamp.
- **level** (string): Log level (`info`, `warn`, `error`, etc.).
- **message** (string): Log message.
- **service** (string): Name of the service or application.
- **context** (object, optional): Additional contextual information.

##### Response

A successful ingestion returns a `204 No Content` status code with no body.

##### Error Responses

- **400 Bad Request**: Invalid request payload.
- **401 Unauthorized**: Missing or invalid authorization token.
- **500 Internal Server Error**: Server encountered an unexpected condition.

### Data Models

#### LogEntry

TypeScript interface representing a log entry.

```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  context?: { [key: string]: any };
}
```

### Request Validation

All incoming requests are validated using Zod schemas to ensure data integrity.

**Example Zod Schema for LogEntry:**

```typescript
import { z } from 'zod';

const logEntrySchema = z.object({
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid timestamp format",
  }),
  level: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  message: z.string().min(1),
  service: z.string().min(1),
  context: z.record(z.any()).optional(),
});
```

Validation errors will result in a `400 Bad Request` response with details about the validation failure.

### Response Format

- **Successful Ingestion**: `204 No Content`
- **Error Responses**: JSON object with error details.

**Error Response Example:**

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid log entry format.",
    "details": [
      {
        "path": ["0", "timestamp"],
        "message": "Invalid timestamp format."
      }
    ]
  }
}
```

### Error Handling

Errors are handled gracefully and returned in a standardized format.

- **Error Codes**:
  - `INVALID_REQUEST` (400)
  - `UNAUTHORIZED` (401)
  - `INTERNAL_SERVER_ERROR` (500)

## Integration with Axiom

All logs are streamed to Axiom for storage and analysis.

### Configuration

Set the following environment variables:

- **AXIOM_TOKEN**: Your Axiom API token.
- **AXIOM_ORG_ID**: Your Axiom organization ID.
- **AXIOM_DATASET**: (Optional) The dataset to which logs will be sent. Defaults to `logdrain-logs`.

### Data Ingestion

Logs are sent to Axiom using their HTTP ingest API. Each log entry is structured with relevant metadata.

**Example Log Entry to Axiom:**

```json
{
  "timestamp": "2023-10-25T14:30:00Z",
  "level": "info",
  "message": "User logged in",
  "service": "auth-service",
  "context": {
    "userId": "user_12345",
    "ipAddress": "192.168.1.1"
  },
  "environment": "production"
}
```

### Querying Data

Use Axiom's query language to perform analyses, such as:

- Filtering logs by service or level.
- Aggregating logs over time.
- Searching for specific error messages.

### Visualization

Create dashboards in Axiom to visualize:

- Log levels over time.
- Service performance metrics.
- Error rates and alerts.

## Development

### Project Structure

```
logdrain/
├── src/
│   ├── handlers/
│   │   ├── ingest.ts          # Handler for POST /ingest
│   ├── models/
│   │   └── LogEntry.ts        # TypeScript interfaces and Zod schemas
│   ├── utils/
│   │   ├── axiomClient.ts     # Axiom integration utilities
│   │   ├── validation.ts      # Request validation logic
│   │   └── errorHandler.ts    # Error handling middleware
│   ├── index.ts               # Entry point for the Worker
│   └── config.ts              # Configuration management
├── tests/
│   ├── handlers/
│   │   └── ingest.test.ts
│   └── utils/
├── wrangler.toml              # Cloudflare Workers configuration
├── package.json
└── tsconfig.json
```

### Adding New Features

1. **Create a Feature Branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Feature:**

   - Add new modules or update existing ones.
   - Follow the project's coding standards and patterns.

3. **Update Tests:**

   - Write unit tests for new code in the `tests/` directory.
   - Ensure code coverage remains high.

4. **Documentation:**

   - Update the README and API documentation to reflect your changes.

5. **Commit and Push:**

   ```bash
   git commit -am 'Add new feature: description'
   git push origin feature/your-feature-name
   ```

6. **Pull Request:**

   - Submit a pull request to the `main` branch.
   - Fill out the PR template, detailing the changes and any issues addressed.

### Coding Standards

- **TypeScript Best Practices:**

  - Use strict typing (`strict` mode in `tsconfig.json`).
  - Prefer `const` and `let` over `var`.
  - Use arrow functions and async/await syntax.

- **ESLint Configuration:**

  - The project uses ESLint with TypeScript support.
  - Run `npm run lint` to check for linting errors.
  - Auto-fixable issues can be fixed with `npm run lint:fix`.

- **Naming Conventions:**

  - Use `PascalCase` for types and classes.
  - Use `camelCase` for variables and functions.
  - Use `UPPER_CASE` for constants.

- **Documentation:**

  - Use JSDoc comments for functions, interfaces, and classes.
  - Provide clear descriptions and parameter explanations.

- **Error Handling:**

  - Use `try/catch` blocks for asynchronous operations.
  - Throw custom errors with meaningful messages.

### Logging and Monitoring

- **Structured Logging:**

  - Use consistent log formats for easier parsing and analysis.

- **Monitoring:**

  - Integrate with monitoring tools to track performance and error rates.

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

Security is a top priority for Logdrain. If you discover a security vulnerability, please report it privately.

- **Contact:** security@solomon-ai.co
- **PGP Key:** Available upon request.

All security vulnerabilities will be addressed promptly in accordance with our [Security Policy](SECURITY.md).

**Note:** Do not open public issues for security vulnerabilities.

## License

This project is licensed under the **AGPL License**. See the [LICENSE](LICENSE) file for detailed terms.

## Support

For support:

- **Issue Tracker:** Use the GitHub [Issues](https://github.com/SolomonAIEngineering/logdrain/issues) for bug reports and feature requests.
- **Email:** Contact us at support@solomon-ai.co
- **Documentation:** Refer to the project [Wiki](https://github.com/SolomonAIEngineering/logdrain/wiki) for detailed guides and FAQs.
- **Community Discussions:** Join our [Slack Channel](https://join.slack.com/t/solomon-ai/shared_invite/).

---

Made with ❤️ by the **Solomon AI Engineering Team**

[![Solomon AI Logo](solomon-ai-logo.png)](https://www.solomon-ai.co)

---