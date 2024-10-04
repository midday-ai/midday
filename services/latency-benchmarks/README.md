# Latency Benchmarks API

![SaasFly Logo](../../saasfly-logo.svg)

## Overview

The Latency Benchmarks API is a high-performance, globally distributed service designed to measure and log latency for specified URLs. Built with TypeScript and deployed on Cloudflare Workers, this API provides a robust solution for monitoring network performance across different regions. It offers real-time insights into website and API responsiveness, enabling developers and operations teams to identify and address performance bottlenecks quickly.

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
  - [Endpoints](#endpoints)
  - [Request Format](#request-format)
  - [Response Format](#response-format)
  - [Error Handling](#error-handling)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding New Features](#adding-new-features)
  - [Coding Standards](#coding-standards)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

## Features

- **Multi-region Latency Testing**: Measure latency from various global regions, providing a comprehensive view of your application's performance worldwide.
- **Cloudflare Workers Integration**: Leverages edge computing for low-latency, globally distributed API access, ensuring fast and reliable benchmarking.
- **Axiom Integration**: Seamlessly log latency data to Axiom for in-depth analysis and visualization, enabling data-driven performance optimization.
- **TypeScript Support**: Full TypeScript support for improved developer experience, code quality, and maintainability.
- **Zod Validation**: Robust request payload validation using Zod schema, ensuring data integrity and reducing errors.
- **Comprehensive Error Handling**: Detailed error catching and reporting for easier debugging and troubleshooting.
- **Customizable Benchmarks**: Define custom benchmarks with configurable parameters such as request intervals, timeout thresholds, and more.
- **Historical Data Analysis**: Store and analyze historical latency data to identify trends and patterns over time.
- **Alert Integration**: Set up custom alerts based on latency thresholds to proactively address performance issues.

## Quick Start

To quickly get started with the Latency Benchmarks API:

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/your-organization/latency-benchmarks.git
   cd latency-benchmarks
   npm install
   ```

2. Set up your environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   # Edit .dev.vars with your Axiom token
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Make your first API call:
   ```bash
   curl -X POST http://localhost:8787 -H "Content-Type: application/json" -d '[{"url": "https://example.com", "name": "Example"}]'
   ```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Wrangler CLI (for Cloudflare Workers development)
- Axiom account and API token

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/latency-benchmarks.git
   cd latency-benchmarks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   ```
   Edit `.dev.vars` and add your Axiom API token.

### Configuration

The Latency Benchmarks API uses environment variables for configuration. Key variables include:

- `AXIOM_TOKEN`: Your Axiom API token
- `BENCHMARK_INTERVAL`: Interval between benchmark runs (in milliseconds)
- `TIMEOUT_THRESHOLD`: Maximum allowed time for a request before timing out (in milliseconds)
- `MAX_CONCURRENT_REQUESTS`: Maximum number of concurrent requests allowed

Refer to `wrangler.toml` for additional configuration options.

## Usage

### Running Locally

To start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:8787`.

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

### Endpoints

#### POST /benchmark

Initiate a latency benchmark for specified URLs.

##### Request Format

```json
[
  {
    "url": "https://example.com",
    "name": "Example Site",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer token123"
    },
    "body": "{\"key\": \"value\"}"
  }
]
```

##### Response Format

```json
{
  "results": [
    {
      "url": "https://example.com",
      "name": "Example Site",
      "latency": 145,
      "status": 200,
      "region": "DFW",
      "timestamp": "2023-04-15T14:30:00Z"
    }
  ]
}
```

#### GET /stats

Retrieve aggregated statistics for benchmarked URLs.

##### Response Format

```json
{
  "stats": [
    {
      "url": "https://example.com",
      "name": "Example Site",
      "averageLatency": 132,
      "minLatency": 98,
      "maxLatency": 215,
      "availability": 99.9,
      "lastChecked": "2023-04-15T14:35:00Z"
    }
  ]
}
```

### Error Handling

The API uses standard HTTP status codes and returns error messages in JSON format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid URL format in request payload."
  }
}
```

## Development

### Project Structure

```
latency-benchmarks/
├── src/
│   ├── handlers/
│   │   ├── benchmark.ts
│   │   └── stats.ts
│   ├── utils/
│   │   ├── axiom.ts
│   │   └── validation.ts
│   └── index.ts
├── tests/
├── wrangler.toml
└── package.json
```

### Adding New Features

1. Create a new file in the appropriate directory (e.g., `src/handlers/` for new endpoints)
2. Implement the feature, following the existing patterns and coding standards
3. Add tests in the `tests/` directory
4. Update the README and API documentation if necessary

### Coding Standards

- Follow TypeScript best practices and the project's ESLint configuration
- Write unit tests for all new functions and features
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Document complex logic and public APIs using JSDoc comments

## Contributing

We welcome contributions to the Latency Benchmarks API! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and write tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Security

Security is a top priority for the Latency Benchmarks API. If you discover a security vulnerability, please send an e-mail to security@solomon-ai.co. All security vulnerabilities will be promptly addressed.

Please refer to our [Security Policy](SECURITY.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact our support team at support@solomon-ai.co.

---

Made with ❤️ by the Solomon AI Engineering Team