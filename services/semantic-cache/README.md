# Semantic Cache Service for LLM Requests

## Overview

The Semantic Cache Service for LLM Requests is an innovative solution designed to optimize interactions with Large Language Model (LLM) APIs, specifically tailored for OpenAI-compatible interfaces. By implementing advanced semantic caching techniques, this service significantly improves response times and reduces API costs for applications with repetitive or similar queries.

<div align="center" width="100%">
    <img src="../../saasfly-logo.svg" width="128" alt="" />
</div>


## Table of Contents

- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Analytics and Logging](#analytics-and-logging)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Key Features

- 🚀 Semantic caching for faster response times
- 💰 Reduced API costs through efficient caching
- 🌐 Cloudflare Workers integration for global edge computing
- 🔄 Support for both streaming and non-streaming requests
- 🔍 Advanced vector search using Cloudflare Vectorize
- 🔒 Built-in authentication and rate limiting
- 📊 Comprehensive analytics and logging with Tinybird
- 🛠 Customizable configurations for API base URL and similarity thresholds

## How It Works

1. **Request Interception**: The service intercepts requests intended for an OpenAI-compatible API.
2. **Semantic Analysis**: Incoming queries are converted into vector embeddings using Cloudflare's AI models.
3. **Cache Search**: The service searches for semantically similar previous queries in the cache.
4. **Response Handling**:
   - If a similar query is found, the cached response is returned.
   - If no match is found, the request is forwarded to the actual LLM API.
5. **Caching**: New responses are cached along with their query embeddings for future use.

## Getting Started

### Prerequisites

- Cloudflare Workers account
- Access to Cloudflare Vectorize and AI models
- Tinybird account (for analytics)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SolomonAIEngineering/financial-platform-as-a-service/semantic-cache-service.git
   cd semantic-cache-service
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .dev.vars.solomon-ai .dv.vars
   # Edit .dev.vars with your specific values
   ```

### Configuration

Edit `wrangler.toml` to configure:
- Rate limiting settings
- Environment-specific variables
- Cloudflare bindings

## Usage

To use the service as a drop-in replacement for OpenAI API calls:

1. Update your API endpoint to point to this service.
2. Use the same request format as you would for the OpenAI Chat Completions API.
3. Include your API key in the `Authorization` header.

Example:
```bash
curl -X POST https://your-service-url.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

## API Reference

### Main Endpoint

- **Method**: ALL
- **Path**: *
- **Headers**:
  - `Authorization`: Bearer <API_KEY> (Required)
  - `X-Base-Url`: Custom base URL for OpenAI API (Optional)
  - `X-Min-Similarity`: Similarity threshold for cache hits (Optional, default: 0.9)
- **Request Body**: JSON payload matching OpenAI.Chat.Completions.ChatCompletionCreateParams
- **Response**: 
  - Streaming: Server-Sent Events (SSE) stream
  - Non-streaming: JSON response matching OpenAI API format

### Error Responses

- 401: No API key provided
- 404: No gateway found for the given subdomain
- 429: Rate limit exceeded

## Development

To run the service locally:

```bash
pnpm dev
```

## Testing

Use the provided test script:

```bash
tsx scripts/openai.ts
```

## Deployment

The service is designed to be deployed on Cloudflare Workers. Use Wrangler for deployment:

```bash
wrangler deploy
```

## Analytics and Logging

- Analytics events are logged for each request, including latency, cache hits, and token usage.
- Tinybird is used for analytics data storage and processing.
- Comprehensive logging is implemented for debugging and monitoring.

## Security

- API key authentication is required for all requests.
- Rate limiting is implemented to prevent abuse.
- CORS is enabled to allow cross-origin requests.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the [AGPL License](LICENSE).

## Support

For support, please open an issue on the GitHub repository or contact our support team at support@solomon-ai.co.

---

Made with ❤️ by Solomon AI Engineering Team