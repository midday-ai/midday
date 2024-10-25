# Semantic Cache Service for LLM Requests

<div align="center">
    <img src="../../saasfly-logo.svg" width="128" alt="SaaSfly Logo" />
</div>

## Overview

The **Semantic Cache Service for LLM Requests** is an innovative, high-performance solution designed to optimize interactions with Large Language Model (LLM) APIs, specifically tailored for OpenAI-compatible interfaces. By implementing advanced semantic caching techniques and leveraging edge computing via [Cloudflare Workers](https://workers.cloudflare.com/), this service significantly improves response times, reduces API costs, and enhances scalability for applications with repetitive or semantically similar queries.

Built with [TypeScript](https://www.typescriptlang.org/) and integrating with cutting-edge technologies such as [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) and [Tinybird](https://www.tinybird.co/), the service offers a robust and extensible platform for efficient LLM API consumption.

## Table of Contents

- [Key Features](#key-features)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
  - [Request Format](#request-format)
  - [Response Handling](#response-handling)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
    - [Main Endpoint](#main-endpoint)
  - [Headers](#headers)
  - [Error Responses](#error-responses)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Local Development](#local-development)
  - [Testing](#testing)
  - [Deployment](#deployment)
- [Analytics and Logging](#analytics-and-logging)
  - [Integration with Tinybird](#integration-with-tinybird)
  - [Logging Mechanisms](#logging-mechanisms)
- [Security](#security)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Rate Limiting](#rate-limiting)
  - [CORS Policy](#cors-policy)
  - [Data Privacy](#data-privacy)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Key Features

- **Semantic Caching for Faster Response Times**: Utilizes vector embeddings to cache and retrieve semantically similar responses, drastically reducing latency.

- **Cost Efficiency**: Reduces API costs by minimizing redundant requests to the LLM API through effective caching strategies.

- **Edge Computing with Cloudflare Workers**: Deployed on Cloudflare's global edge network for low-latency processing and high availability.

- **Support for Streaming and Non-Streaming Requests**: Handles both streaming (Server-Sent Events) and standard HTTP responses.

- **Advanced Vector Search using Cloudflare Vectorize**: Employs high-performance vector databases for efficient similarity searches.

- **Built-in Authentication and Rate Limiting**: Ensures secure access and prevents abuse through API key authentication and configurable rate limits.

- **Comprehensive Analytics and Logging with Tinybird**: Provides real-time analytics and monitoring for insights into service performance and usage patterns.

- **Customizable Configurations**: Allows fine-tuning of API base URLs, similarity thresholds, and other operational parameters.

## Architecture

The service is architected as a serverless application utilizing Cloudflare Workers, integrating with Cloudflare Vectorize for vector operations, and Tinybird for analytics.

![Architecture Diagram](architecture-diagram.png)

**Components:**

- **Client Applications**: Send requests intended for OpenAI-compatible APIs.

- **Semantic Cache Service**: Intercepts requests, performs semantic analysis, and handles caching logic.

- **Cloudflare Workers**: Provides the execution environment at the edge.

- **Cloudflare Vectorize**: Manages vector embeddings and similarity searches.

- **LLM APIs**: Actual Large Language Model APIs (e.g., OpenAI GPT-3.5 Turbo).

- **Tinybird**: Collects analytics data for monitoring and optimization.

**Data Flow:**

1. Client sends a request to the Semantic Cache Service.
2. Service generates a vector embedding of the request.
3. Checks the cache for semantically similar requests.
4. If a match is found, returns the cached response.
5. If not, forwards the request to the LLM API, caches the response, and returns it to the client.
6. Logs analytics data to Tinybird.

## How It Works

1. **Request Interception**: The service acts as a proxy, intercepting requests intended for an OpenAI-compatible API endpoint.

2. **Semantic Analysis**:
   - **Vector Embedding**: Converts incoming queries into vector embeddings using Cloudflare's AI models.
   - **Normalization**: Preprocesses text to ensure consistency in embeddings.

3. **Cache Search**:
   - **Vector Similarity Search**: Utilizes Cloudflare Vectorize to search for semantically similar queries within a specified similarity threshold.
   - **Threshold Configuration**: Allows customization of the similarity threshold (default is `0.9`).

4. **Response Handling**:
   - **Cache Hit**:
     - Retrieves the cached response associated with the similar query.
     - Updates analytics data for cache hits.
   - **Cache Miss**:
     - Forwards the request to the actual LLM API.
     - Receives and returns the response to the client.
     - Stores the new response and its embedding in the cache for future use.

5. **Caching Mechanism**:
   - **Storage**: Uses Cloudflare KV storage or Durable Objects for caching responses and embeddings.
   - **Expiration**: Configurable TTL (Time-To-Live) settings for cached entries.

6. **Analytics Logging**:
   - **Event Tracking**: Logs events such as cache hits, misses, response times, and token usage.
   - **Data Storage**: Sends analytics data to Tinybird for real-time analysis.

## Getting Started

### Prerequisites

- **Cloudflare Account**: With Workers and Vectorize enabled.
- **Access to Cloudflare AI Models**: For vector embedding generation.
- **Tinybird Account**: For analytics data ingestion and visualization.
- **Node.js**: Version 14 or later.
- **pnpm**: For package management (can be installed via `npm install -g pnpm`).

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/semantic-cache-service.git
   cd semantic-cache-service
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

   Edit `.dev.vars` with your specific values:

   - **API Keys and Tokens**:
     - `CLOUDFLARE_API_TOKEN`
     - `TINYBIRD_API_TOKEN`
   - **Configuration Settings**:
     - `BASE_URL`: Default base URL for the LLM API.
     - `MIN_SIMILARITY`: Default similarity threshold.
     - `RATE_LIMIT`: Requests per time window.
     - `RATE_LIMIT_WINDOW`: Time window in seconds.

### Configuration

Edit `wrangler.toml` to configure:

- **Account Details**:

  ```toml
  account_id = "your-cloudflare-account-id"
  name = "semantic-cache-service"
  main = "src/index.ts"
  compatibility_date = "2023-10-25"
  ```

- **KV Namespaces**:

  ```toml
  [[kv_namespaces]]
  binding = "CACHE"
  id = "your-kv-namespace-id"
  ```

- **Durable Objects**:

  ```toml
  [[durable_objects]]
  name = "CACHE_MANAGER"
  class_name = "CacheManager"
  ```

- **Environment Variables**:

  ```toml
  [vars]
  BASE_URL = "https://api.openai.com"
  MIN_SIMILARITY = "0.9"
  ```

- **Bindings for Vectorize**:

  ```toml
  [ai]
  models = [
    { binding = "EMBEDDING_MODEL", type = "embedding", name = "text-embedding-ada-002" }
  ]
  vectorize = { binding = "VECTORIZE", index = "semantic_cache_index" }
  ```

## Usage

### Request Format

To use the service as a drop-in replacement for OpenAI API calls:

- **Endpoint**: Replace `https://api.openai.com` with your service URL (e.g., `https://semantic-cache.yourdomain.com`).
- **Headers**:
  - `Authorization`: Bearer `<YOUR_API_KEY>` (required).
  - `Content-Type`: `application/json`.
  - `X-Base-Url`: (Optional) Custom base URL for the LLM API.
  - `X-Min-Similarity`: (Optional) Similarity threshold for cache hits.
- **Body**: JSON payload matching OpenAI's Chat Completion API.

**Example Request**:

```bash
curl -X POST https://semantic-cache.yourdomain.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, how are you?"}],
    "stream": false
  }'
```

### Response Handling

- **Streaming Responses**:
  - If the request includes `"stream": true`, the service will handle streaming via Server-Sent Events (SSE).
  - The cached response will be streamed if available; otherwise, the stream from the LLM API will be forwarded.

- **Non-Streaming Responses**:
  - Standard JSON responses will be returned, matching the OpenAI API format.

## API Reference

### Authentication

The service uses API key authentication. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### Main Endpoint

- **Method**: `POST`
- **Path**: `/v1/chat/completions` (and any other OpenAI-compatible paths)
- **Description**: Handles OpenAI Chat Completion requests with semantic caching.

### Headers

- **Required**:

  - `Authorization`: Bearer `<YOUR_API_KEY>`
  - `Content-Type`: `application/json`

- **Optional**:

  - `X-Base-Url`: Override the default LLM API base URL.
  - `X-Min-Similarity`: Override the default similarity threshold for cache hits.

### Error Responses

- **401 Unauthorized**: Missing or invalid API key.
- **404 Not Found**: Invalid endpoint.
- **429 Too Many Requests**: Rate limit exceeded.
- **500 Internal Server Error**: Unexpected server error.

**Error Response Format**:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message details."
  }
}
```

## Development

### Project Structure

```
semantic-cache-service/
├── src/
│   ├── handlers/
│   │   ├── mainHandler.ts         # Main request handler
│   │   └── errorHandler.ts        # Error handling middleware
│   ├── services/
│   │   ├── cacheService.ts        # Caching logic and interactions
│   │   ├── embeddingService.ts    # Vector embedding generation
│   │   └── llmService.ts          # Communication with the LLM API
│   ├── utils/
│   │   ├── requestValidator.ts    # Validates incoming requests
│   │   ├── logger.ts              # Logging utilities
│   │   └── config.ts              # Configuration management
│   ├── models/
│   │   ├── requestModels.ts       # TypeScript interfaces for requests
│   │   └── cacheModels.ts         # Interfaces for cache entries
│   ├── index.ts                   # Entry point for Cloudflare Worker
│   └── bindings.d.ts              # Type definitions for environment bindings
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   └── openai.ts                  # Test script for sending requests
├── wrangler.toml                  # Cloudflare Workers configuration
├── package.json
├── tsconfig.json
└── .dev.vars.example              # Example environment variables
```

### Local Development

To run the service locally using Wrangler:

```bash
pnpm dev
```

This command runs `wrangler dev`, which starts a local server emulating the Cloudflare Workers environment on `http://localhost:8787`.

### Testing

Use the provided test script to simulate requests:

```bash
tsx scripts/openai.ts
```

- Ensure that `tsx` is installed globally (`npm install -g tsx`).
- The script sends test requests to the local service and logs responses.

### Deployment

Deploy the service to Cloudflare Workers using Wrangler:

```bash
wrangler publish
```

For staging deployment:

```bash
wrangler publish --env staging
```

Ensure that the `wrangler.toml` file is correctly configured for each environment.

## Analytics and Logging

### Integration with Tinybird

- **Purpose**: Collects and analyzes metrics such as request counts, cache hits/misses, response times, and token usage.
- **Data Ingestion**: Analytics events are sent to Tinybird via their ingestion API.
- **Visualization**: Use Tinybird's dashboards to monitor service performance.

### Logging Mechanisms

- **Structured Logging**: Logs are formatted in JSON for easy parsing and analysis.
- **Levels**: Supports different log levels (`info`, `warn`, `error`, `debug`).
- **Error Tracking**: Errors are logged with stack traces and contextual information.

**Example Log Entry**:

```json
{
  "timestamp": "2023-10-25T14:30:00Z",
  "level": "info",
  "message": "Cache hit for query embedding",
  "requestId": "req_12345",
  "clientIp": "203.0.113.42",
  "cacheStatus": "hit",
  "responseTimeMs": 15
}
```

## Security

### Authentication and Authorization

- **API Key Management**: API keys are required for all requests and should be securely stored and transmitted.
- **Key Validation**: The service validates API keys against a secure store (e.g., Cloudflare KV or Durable Objects).

### Rate Limiting

- **Configuration**: Rate limits are configurable per API key.
- **Enforcement**: Exceeded limits result in `429 Too Many Requests` responses.

### CORS Policy

- **Default Policy**: Cross-origin requests are allowed (`Access-Control-Allow-Origin: *`).
- **Customization**: CORS settings can be modified based on security requirements.

### Data Privacy

- **Sensitive Data Handling**: No sensitive user data is stored permanently.
- **Encryption**: Data in transit is encrypted via HTTPS.
- **Compliance**: Adheres to data protection regulations and best practices.

## Contributing

We welcome contributions from the community!

1. **Fork the Repository**

2. **Create a Feature Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Implement Changes and Write Tests**

4. **Run Tests**:

   ```bash
   pnpm test
   ```

5. **Commit Changes**:

   ```bash
   git commit -am 'Add new feature: description'
   ```

6. **Push to Your Branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the **AGPL License**. See the [LICENSE](LICENSE) file for detailed terms.

## Support

For support:

- **Issue Tracker**: Use the GitHub [Issues](https://github.com/SolomonAIEngineering/semantic-cache-service/issues) for bug reports and feature requests.
- **Email**: Contact us at [support@solomon-ai.co](mailto:support@solomon-ai.co)
- **Documentation**: Refer to the project [Wiki](https://github.com/SolomonAIEngineering/semantic-cache-service/wiki) for detailed guides and FAQs.
- **Community Discussions**: Join our [Slack Channel](https://join.slack.com/t/solomon-ai/shared_invite/).

---

Made with ❤️ by the **Solomon AI Engineering Team**

[![Solomon AI Logo](solomon-ai-logo.png)](https://www.solomon-ai.co)

---