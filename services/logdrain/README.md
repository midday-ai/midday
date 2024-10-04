# Logdrain

<div align="center">
  <img src="../../saasfly-logo.svg" width="128" alt="Saasfly Logo" />
</div>

## Overview

Logdrain is a high-performance, globally distributed service designed to collect, process, and store logs from various applications. Built with TypeScript and deployed on Cloudflare Workers, this service provides a robust solution for centralized log management. It offers real-time log ingestion and processing, enabling developers and operations teams to gain insights into their applications' behavior and performance.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Running Locally](#running-locally)
  - [Deployment](#deployment)
- [API Reference](#api-reference)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Adding New Features](#adding-new-features)
  - [Coding Standards](#coding-standards)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Support](#support)

## Features

- **Cloudflare Workers Integration**: Leverages edge computing for low-latency, globally distributed log ingestion.
- **Axiom Integration**: Seamlessly stores logs in Axiom for advanced querying and visualization.
- **TypeScript Support**: Full TypeScript support for improved developer experience, code quality, and maintainability.
- **Zod Validation**: Robust log payload validation using Zod schema, ensuring data integrity and reducing errors.
- **Comprehensive Error Handling**: Detailed error catching and reporting for easier debugging and troubleshooting.
- **Flexible Log Processing**: Supports various log types including application logs and metrics.
- **Secure**: Built-in authorization checks to ensure only authorized sources can send logs.

## Quick Start

To quickly get started with Logdrain:

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/logdrain.git
   cd logdrain
   npm install
   ```

2. Set up your environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   # Edit .dev.vars with your Axiom token and other configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
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
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/logdrain.git
   cd logdrain
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .dev.vars-example .dev.vars
   ```
   Edit `.dev.vars` and add your Axiom API token and other necessary configuration.

### Configuration

Logdrain uses environment variables for configuration. Key variables include:

- `AXIOM_TOKEN`: Your Axiom API token
- `AXIOM_ORG_ID`: Your Axiom organization ID
- `AUTHORIZATION`: Authorization token for secure log ingestion

Refer to `wrangler.toml` for additional configuration options.

## Usage

### Running Locally

To start the development server:

```bash
npm run dev
```

The service will be available at `http://localhost:8787`.

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## API Reference

Logdrain processes incoming log data sent via HTTP POST requests. The exact format of the log data depends on the source application, but it generally follows a structure that can be parsed by the defined Zod schemas in the codebase.

## Development

### Project Structure

```
logdrain/
├── src/
│   ├── worker.ts
│   └── ... (other source files)
├── tests/
├── wrangler.toml
└── package.json
```

### Adding New Features

1. Implement the feature in the appropriate file, following existing patterns and coding standards
2. Add tests if applicable
3. Update documentation if necessary

### Coding Standards

- Follow TypeScript best practices and the project's configuration
- Write unit tests for new functions and features when applicable
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Document complex logic and public APIs using JSDoc comments

## Contributing

We welcome contributions to Logdrain! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and write tests if applicable
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Security

Security is a top priority for Logdrain. If you discover a security vulnerability, please send an e-mail to security@solomon-ai.co. All security vulnerabilities will be promptly addressed.

Please refer to our [Security Policy](SECURITY.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact our support team at support@solomon-ai.co.

---

Made with ❤️ by the Solomon AI Engineering Team