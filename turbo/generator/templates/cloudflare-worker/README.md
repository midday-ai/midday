# Cloudflare Worker Template OpenAPI Service

This project demonstrates a Cloudflare Worker implementation using OpenAPI 3.1 with [@hono/zod-openapi](https://github.com/honojs/hono). It serves as a template for building OpenAPI-compliant Workers that automatically generate the `openapi.json` schema from code and validate incoming requests against defined parameters and request bodies.

## Features

- OpenAPI 3.1 compliant
- Automatic `openapi.json` schema generation
- Request validation
- Swagger UI for easy API exploration
- Support for R2, KV, and Durable Objects
- Structured project layout for scalability

## Getting Started

1. Sign up for [Cloudflare Workers](https://workers.dev) (free tier available)
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Log in to your Cloudflare account:
   ```
   wrangler login
   ```
5. Deploy the API:
   ```
   wrangler deploy
   ```

## Project Structure

- `src/index.ts`: Main application entry point
- `src/endpoints/`: Individual endpoint definitions
- `src/pkg/`: Shared utilities and configurations
- `test/`: Test files

## Development

1. Start the local development server:
   ```
   wrangler dev
   ```
2. Open `http://localhost:9000/` in your browser to access the Swagger UI
3. Make changes in the `src/` directory; the server will automatically reload

## Adding New Endpoints

1. Create a new file in `src/endpoints/`
2. Define your route using `createRoute` from `@hono/zod-openapi`
3. Implement the handler function
4. Register the route in `src/index.ts`

Example:

```typescript:src/endpoints/r2/routes.ts
import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { RecordSchema } from "./types";

export const getRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.get",
  method: "get",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "The requested record",
      content: {
        "application/json": {
          schema: RecordSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const putRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.put",
  method: "put",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: RecordSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Record stored successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            id: z.string().uuid(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const deleteRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.delete",
  method: "delete",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Record deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});
```

## Documentation

For more detailed information on using `@hono/zod-openapi`, refer to the [official Hono documentation](https://hono.dev/guides/zod-openapi).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [AGPL License](LICENSE).

## OpenAPI Definition Generation

This project includes a script to automatically generate the OpenAPI definition from the code. Here's how it works:

1. The OpenAPI definition is generated using a custom script located at `scripts/openapi.ts`.

2. To run the script, use the following command:
   ```
   bun run openapi
   ```

3. This script does the following:
   - Imports the main application from `src/index.ts`
   - Generates the OpenAPI document using Hono's built-in functionality
   - Writes the resulting schema to `api.json` in the project root

4. The generation script is automatically run as part of the pre-commit hook to ensure the API definition is always up-to-date.

5. You can find the script configuration in `package.json`:
   ```json
   "scripts": {
     "openapi": "bun scripts/openapi.ts",
     "precommit": "npm run openapi && npm run format"
   }
   ```

This approach ensures that your OpenAPI definition always reflects the current state of your API implementation.

## Setting Up Cloudflare Components

This project utilizes various Cloudflare components. Follow these steps to set them up:

### R2 Storage

1. Log in to the Cloudflare dashboard
2. Navigate to "R2" in the sidebar
3. Click "Create bucket"
4. Name your bucket (e.g., "my-api-bucket")
5. Click "Create bucket" to finalize
6. In your `wrangler.toml`, add:
   ```toml
   [[r2_buckets]]
   binding = "MY_BUCKET"
   bucket_name = "my-api-bucket"
   ```

### KV Namespace

1. In the Cloudflare dashboard, go to "Workers & Pages"
2. Click on "KV" in the sidebar
3. Click "Create namespace"
4. Name your namespace (e.g., "my-api-kv")
5. Click "Add" to create the namespace
6. In your `wrangler.toml`, add:
   ```toml
   kv_namespaces = [
     { binding = "MY_KV", id = "your-namespace-id" }
   ]
   ```

### Durable Objects

1. Create a Durable Object class in your project (e.g., `src/durable_objects/MyObject.ts`)
2. In `wrangler.toml`, add:
   ```toml
   [durable_objects]
   bindings = [
     { name = "MY_OBJECT", class_name = "MyObject" }
   ]

   [[migrations]]
   tag = "v1"
   new_classes = ["MyObject"]
   ```
3. Deploy your Worker to create the Durable Object:
   ```
   wrangler deploy
   ```

### Queues

1. In the Cloudflare dashboard, go to "Workers & Pages"
2. Click on "Queues" in the sidebar
3. Click "Create queue"
4. Name your queue (e.g., "my-api-queue")
5. Choose your queue settings and click "Create"
6. In your `wrangler.toml`, add:
   ```toml
   [[queues.producers]]
   binding = "MY_QUEUE"
   queue = "my-api-queue"
   ```
7. To create a consumer, add:
   ```toml
   [[queues.consumers]]
   queue = "my-api-queue"
   max_batch_size = 10
   max_batch_timeout = 30
   ```

### Environment Variables

1. For local development, create a `.dev.vars` file in your project root:
   ```
   MY_SECRET=mysecretvalue
   ```
2. For production, use Cloudflare's secret management:
   ```
   wrangler secret put MY_SECRET
   ```
3. In your `wrangler.toml`, declare the variable:
   ```toml
   [vars]
   MY_PUBLIC_VARIABLE = "public-value"
   ```

## Using Cloudflare Components in Your Code

After setting up the components, you can use them in your Worker code:

```typescript
interface Env {
  MY_BUCKET: R2Bucket;
  MY_KV: KVNamespace;
  MY_OBJECT: DurableObjectNamespace;
  MY_QUEUE: Queue;
  MY_SECRET: string;
  MY_PUBLIC_VARIABLE: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Use R2
    await env.MY_BUCKET.put("key", "value");

    // Use KV
    await env.MY_KV.put("key", "value");

    // Use Durable Object
    const id = env.MY_OBJECT.newUniqueId();
    const obj = env.MY_OBJECT.get(id);
    const resp = await obj.fetch(request.url);

    // Use Queue
    await env.MY_QUEUE.send({ message: "Hello" });

    // Use environment variables
    console.log(env.MY_SECRET);
    console.log(env.MY_PUBLIC_VARIABLE);

    // ... rest of your Worker logic
    return resp;
  }
};
```