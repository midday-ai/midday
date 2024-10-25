# Latency Benchmarks API

<div align="center" width="100%">
    <img src="../../saasfly-logo.svg" width="128" alt="SaaSfly Logo" />
</div>

## Overview

The **Latency Benchmarks API** is a high-performance, globally distributed service engineered to measure, log, and analyze network latency for specified endpoints. Leveraging the power of [TypeScript](https://www.typescriptlang.org/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/), this API offers a scalable and efficient solution for real-time monitoring of website and API responsiveness across multiple geographic regions.

Integration with [Axiom](https://axiom.co/) enables advanced data ingestion and analytics capabilities, allowing for in-depth visualization and trend analysis over time. The API supports customizable benchmarks, robust validation with [Zod](https://github.com/colinhacks/zod), and comprehensive error handling, making it an indispensable tool for developers and DevOps teams aiming to optimize performance and reliability.

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
  - [Endpoints](#endpoints)
    - [POST /benchmark](#post-benchmark)
    - [GET /stats](#get-stats)
  - [Data Models](#data-models)
  - [Request Validation](#request-validation)
  - [Response Format](#response-format)
  - [Error Handling](#error-handling)
- [Integration with Axiom](#integration-with-axiom)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Code Generation](#code-generation)
  - [Logging and Monitoring](#logging-and-monitoring)
  - [Adding New Features](#adding-new-features)
  - [Coding Standards](#coding-standards)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

## Features

- **Multi-Region Latency Testing**: Perform concurrent latency measurements from Cloudflare's global edge network, covering over 200 cities worldwide.
- **Edge Computing with Cloudflare Workers**: Utilize serverless functions at the edge for minimal latency and high scalability.
- **Advanced Data Logging with Axiom**: Stream latency metrics and logs to Axiom for powerful querying and visualization capabilities.
- **TypeScript and Zod Validation**: Ensure type safety and robust request payload validation using TypeScript interfaces and Zod schemas.
- **Customizable Benchmarks**: Configure parameters such as HTTP methods, headers, body payloads, timeout thresholds, and concurrency limits.
- **Historical Data Analysis**: Persist latency data for long-term trend analysis and performance auditing.
- **Real-Time Alerts and Notifications**: Integrate with monitoring tools to trigger alerts based on predefined latency thresholds.
- **Comprehensive Error Handling**: Detailed exception handling with standardized error responses for seamless debugging.
- **Scalable and Extensible Architecture**: Modular codebase designed for easy extension and integration with other services.

## Architecture

The Latency Benchmarks API is built on a microservices architecture, deployed on Cloudflare Workers, and utilizes Cloudflare's global network to execute functions at the edge. This ensures low-latency access and high availability.

![Architecture Diagram](architecture-diagram.png)

Key components:

- **Cloudflare Workers**: Executes the latency benchmark functions at the edge.
- **Axiom Integration**: Collects and stores logs and metrics for analysis.
- **API Gateway**: Routes incoming HTTP requests to the appropriate handlers.
- **Zod Validation Layer**: Validates incoming requests against defined schemas.
- **Concurrency Control**: Manages concurrent requests to prevent overload.
- **Error Handling Middleware**: Captures and formats errors before sending responses.

## Quick Start

To quickly set up and run the Latency Benchmarks API locally:

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/latency-benchmarks.git
   cd latency-benchmarks
   npm install
   ```

2. **Set up your environment variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   # Open .dev.vars and add your Axiom API token and other configurations
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Make your first API call:**

   ```bash
   curl -X POST http://localhost:8787/benchmark \
   -H "Content-Type: application/json" \
   -d '[
     {
       "url": "https://example.com",
       "name": "Example",
       "method": "GET"
     }
   ]'
   ```

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v14 or later)
- **npm** (v6 or later)
- **Wrangler CLI** (v2.x) for Cloudflare Workers development
  - Install via `npm install -g wrangler`
- **Axiom Account and API Token**
- **Git** for version control

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/latency-benchmarks.git
   cd latency-benchmarks
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   ```bash
   cp .dev.vars-example .dev.vars
   ```

   Edit `.dev.vars` and provide your Axiom API token and any other necessary configurations.

### Configuration

The API relies on environment variables for configuration. Key variables include:

- **AXIOM_TOKEN**: Your Axiom API token.
- **AXIOM_DATASET**: (Optional) Axiom dataset name, defaults to `latency-benchmarks`.
- **BENCHMARK_INTERVAL**: Interval between benchmark runs in milliseconds (e.g., `60000` for 1 minute).
- **TIMEOUT_THRESHOLD**: Maximum allowed time for a request before timing out in milliseconds.
- **MAX_CONCURRENT_REQUESTS**: Maximum number of concurrent requests allowed.
- **ENVIRONMENT**: Set to `development`, `staging`, or `production`.

These can be set in the `.dev.vars` file for local development or configured in `wrangler.toml` for deployment.

**Example `.dev.vars` file:**

```ini
AXIOM_TOKEN=your-axiom-token
AXIOM_DATASET=latency-benchmarks
BENCHMARK_INTERVAL=60000
TIMEOUT_THRESHOLD=5000
MAX_CONCURRENT_REQUESTS=100
ENVIRONMENT=development
```

## Usage

### Running Locally

To start the development server with live reload:

```bash
npm run dev
```

This will use `wrangler dev` to run the Cloudflare Worker locally. The API will be accessible at `http://localhost:8787`.

### Testing

Run the test suite with:

```bash
npm test
```

This executes all tests located in the `tests/` directory using Jest.

For a coverage report:

```bash
npm run test:coverage
```

### Deployment

Before deploying, ensure that your `wrangler.toml` is correctly configured with your Cloudflare account details.

**Deploy to Production:**

```bash
npm run deploy
```

This executes `wrangler publish` to deploy the API to your production environment.

**Deploy to Staging:**

```bash
npm run deploy:staging
```

Ensure that your `wrangler.toml` has a `[env.staging]` section configured.

**Example `wrangler.toml` for Staging:**

```toml
[env.staging]
name = "latency-benchmarks-staging"
route = "https://staging.example.com/*"
```

## API Reference

### Endpoints

#### POST `/benchmark`

Initiate a latency benchmark for one or more specified URLs.

- **URL:** `/benchmark`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`

##### Request Body Schema

The request body should be a JSON array of objects, each representing a target to benchmark.

**Example:**

```json
[
  {
    "url": "https://example.com/api/v1/resource",
    "name": "Example API",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer token123",
      "Content-Type": "application/json"
    },
    "body": "{\"key\": \"value\"}",
    "timeout": 5000
  },
  {
    "url": "https://another.example.com",
    "name": "Another Site",
    "method": "GET"
  }
]
```

- **url** (string): The full URL to benchmark.
- **name** (string): A friendly name for the target.
- **method** (string, optional): HTTP method (`GET`, `POST`, `PUT`, etc.). Defaults to `GET`.
- **headers** (object, optional): HTTP headers to include in the request.
- **body** (string, optional): Request body, required for methods like `POST` or `PUT`.
- **timeout** (number, optional): Timeout in milliseconds for this request.

##### Response Body Schema

The response will contain the latency results for each target.

**Example:**

```json
{
  "results": [
    {
      "url": "https://example.com/api/v1/resource",
      "name": "Example API",
      "latency": 145,
      "status": 200,
      "region": "DFW",
      "timestamp": "2023-10-25T14:30:00Z"
    },
    {
      "url": "https://another.example.com",
      "name": "Another Site",
      "latency": 98,
      "status": 200,
      "region": "LHR",
      "timestamp": "2023-10-25T14:30:01Z"
    }
  ]
}
```

- **latency** (number): Measured latency in milliseconds.
- **status** (number): HTTP status code returned by the target.
- **region** (string): Cloudflare edge region where the benchmark was executed.
- **timestamp** (string): ISO 8601 timestamp of the benchmark.

#### GET `/stats`

Retrieve aggregated statistics for all benchmarked URLs.

- **URL:** `/stats`
- **Method:** `GET`
- **Query Parameters:**
  - `from` (optional): Start time in ISO 8601 format.
  - `to` (optional): End time in ISO 8601 format.

##### Response Body Schema

**Example:**

```json
{
  "stats": [
    {
      "url": "https://example.com/api/v1/resource",
      "name": "Example API",
      "averageLatency": 132.5,
      "minLatency": 98,
      "maxLatency": 215,
      "availability": 99.95,
      "lastChecked": "2023-10-25T14:35:00Z",
      "totalRequests": 1000,
      "successRequests": 999,
      "errorRequests": 1
    }
  ]
}
```

- **averageLatency** (number): Average latency over the specified period.
- **minLatency** (number): Minimum recorded latency.
- **maxLatency** (number): Maximum recorded latency.
- **availability** (number): Percentage of successful requests.
- **totalRequests** (number): Total number of requests made.
- **successRequests** (number): Number of successful requests (status code 2xx or 3xx).
- **errorRequests** (number): Number of failed requests (status code 4xx or 5xx).

### Data Models

#### BenchmarkTarget

TypeScript interface representing a target to benchmark.

```typescript
interface BenchmarkTarget {
  url: string;
  name: string;
  method?: string;
  headers?: { [key: string]: string };
  body?: string;
  timeout?: number;
}
```

#### BenchmarkResult

Represents the result of a single benchmark execution.

```typescript
interface BenchmarkResult {
  url: string;
  name: string;
  latency: number;
  status: number;
  region: string;
  timestamp: string;
}
```

### Request Validation

All incoming requests are validated using Zod schemas to ensure data integrity.

**Example Zod Schema for BenchmarkTarget:**

```typescript
import { z } from 'zod';

const benchmarkTargetSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  method: z.string().optional().default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeout: z.number().positive().optional(),
});
```

Validation errors will result in a `400 Bad Request` response with details about the validation failure.

### Response Format

Responses are returned in JSON format with appropriate HTTP status codes.

- **2xx**: Successful requests.
- **4xx**: Client errors, such as validation failures.
- **5xx**: Server errors.

### Error Handling

Errors are handled gracefully and returned in a standardized format.

**Error Response Example:**

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid URL format in request payload.",
    "details": [
      {
        "path": ["0", "url"],
        "message": "Invalid URL format."
      }
    ]
  }
}
```

- **code** (string): Machine-readable error code.
- **message** (string): Human-readable error message.
- **details** (array, optional): Additional details about the error.

## Integration with Axiom

All latency data and logs are streamed to Axiom for storage and analysis.

### Configuration

Set the following environment variables:

- **AXIOM_TOKEN**: Your Axiom API token.
- **AXIOM_DATASET**: (Optional) The dataset to which logs will be sent. Defaults to `latency-benchmarks`.

### Data Ingestion

Data is sent to Axiom using their HTTP ingest API. Each benchmark result is structured as a log entry with relevant metadata.

**Example Log Entry:**

```json
{
  "timestamp": "2023-10-25T14:30:00Z",
  "region": "DFW",
  "benchmark": {
    "url": "https://example.com",
    "name": "Example Site",
    "latency": 145,
    "status": 200,
    "method": "GET"
  }
}
```

### Querying Data

Use Axiom's query language to perform complex analyses, such as:

- Calculating average latency over time.
- Identifying regions with the highest latency.
- Detecting anomalies or spikes in latency.

### Visualization

Create dashboards in Axiom to visualize:

- Latency trends over time.
- Heatmaps of latency by region.
- Availability percentages.

## Development

### Project Structure

```
latency-benchmarks/
├── src/
│   ├── handlers/
│   │   ├── benchmark.ts        # Handler for POST /benchmark
│   │   └── stats.ts            # Handler for GET /stats
│   ├── models/
│   │   ├── BenchmarkTarget.ts  # TypeScript interfaces and Zod schemas
│   │   └── BenchmarkResult.ts
│   ├── utils/
│   │   ├── axiomClient.ts      # Axiom integration utilities
│   │   ├── httpClient.ts       # HTTP request utilities
│   │   ├── validation.ts       # Request validation logic
│   │   └── errorHandler.ts     # Error handling middleware
│   ├── index.ts                # Entry point for the Worker
│   └── config.ts               # Configuration management
├── tests/
│   ├── handlers/
│   │   ├── benchmark.test.ts
│   │   └── stats.test.ts
│   └── utils/
├── wrangler.toml               # Cloudflare Workers configuration
├── package.json
└── tsconfig.json
```

### Code Generation

Type definitions and schemas are generated using TypeScript and Zod. If you modify the data models, ensure to update the corresponding Zod schemas.

### Logging and Monitoring

All logs are sent to Axiom. Use the `axiomClient` utility to log custom events or errors.

**Example:**

```typescript
import { logEvent } from './utils/axiomClient';

logEvent('BenchmarkCompleted', {
  url: target.url,
  latency: result.latency,
  region: result.region,
});
```

### Adding New Features

1. **Branching Strategy:**

   - Create a new branch from `main`: `git checkout -b feature/your-feature-name`

2. **Implement Feature:**

   - Add new modules or update existing ones.
   - Follow the project's coding standards and patterns.

3. **Update Tests:**

   - Write unit tests for new code in the `tests/` directory.
   - Ensure code coverage remains high.

4. **Documentation:**

   - Update the README and API documentation to reflect your changes.
   - If adding a new endpoint, update the API Reference section.

5. **Commit and Push:**

   - Commit your changes with a descriptive message.
   - Push to your branch: `git push origin feature/your-feature-name`

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

## Contributing

We welcome contributions to the Latency Benchmarks API! Please adhere to the following guidelines:

1. **Fork the Repository:**

   Click the "Fork" button at the top of the repository page.

2. **Clone Your Fork:**

   ```bash
   git clone https://github.com/your-username/latency-benchmarks.git
   ```

3. **Set Upstream Remote:**

   ```bash
   git remote add upstream https://github.com/SolomonAIEngineering/latency-benchmarks.git
   ```

4. **Create a Feature Branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Commit Changes:**

   ```bash
   git commit -am 'Add new feature'
   ```

6. **Push to Origin:**

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request:**

   Open a PR against the `main` branch of the upstream repository.

**Code of Conduct:**

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Security

Security is a top priority for the Latency Benchmarks API. If you discover a security vulnerability, please report it immediately.

- **Contact:** security@solomon-ai.co
- **PGP Key:** Available upon request.

All security vulnerabilities will be promptly addressed in accordance with our [Security Policy](SECURITY.md).

**Note:** Do not open public issues for security vulnerabilities.

## License

This project is licensed under the **AGPL License**. See the [LICENSE](LICENSE) file for detailed terms.

## Support

For support, please:

- **Open an Issue:** Use the GitHub issue tracker for bug reports and feature requests.
- **Contact Support:** Email support@solomon-ai.co for direct assistance.
- **Community Discussions:** Join our [Slack Channel](https://join.slack.com/t/solomon-ai/shared_invite/).

---

Made with ❤️ by the **Solomon AI Engineering Team**

[![Solomon AI Logo](solomon-ai-logo.png)](https://www.solomon-ai.co)

---