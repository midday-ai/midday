# 🚀 Worker: Type-Safe Job Processing System

A modern, type-safe background job processing system for Midday built on [BullMQ](https://docs.bullmq.io/) with clean abstractions for scalable job management.

## 🎯 Key Features

- **🛡️ Type Safety** - Full Zod validation for all job data
- **🌊 Flow Support** - Parent-child job relationships for complex workflows  
- **⚡ Clean API** - Simple `.trigger()` methods inspired by Trigger.dev
- **📊 Auto-Registry** - Jobs register themselves when imported
- **🔄 Scalable** - Easy to add new jobs (~30 lines each)
- **🧪 Testable** - Isolated job definitions with clear interfaces
- **🎯 Context-Based** - Clean context object with job, db, logger, etc.
- **🚀 Queue Management** - Automatic queue initialization and management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API/Client    │────│   Redis Queue   │────│   Worker App    │
│   (Job Trigger) │    │   (Job Storage) │    │ (Job Executor)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   (Database)    │
                                               └─────────────────┘

Job System Flow:
job() factory → Auto-register → .trigger() → Queue → Worker → Execute
```

## 🚦 Queue System

The worker uses a sophisticated queue management system built on BullMQ with automatic queue registration and intelligent job routing.

### Queue Architecture

```
Queue Registry (Singleton)
├── Email Queue
│   ├── Welcome emails
│   ├── Notifications  
│   └── Marketing campaigns
├── Document Queue
│   ├── PDF processing
│   ├── OCR tasks
│   └── File uploads
└── Custom Queues
    └── (Add your own)

Flow Producer (created on-demand)
├── Parent-child relationships
├── Complex workflows
└── Dependency management
```

### Key Components

- **Queue Registry**: Centralized management of all queues
- **Automatic Initialization**: Queues are registered automatically on startup
- **Metadata-Based Routing**: Jobs specify their queue in metadata
- **Flow Producer**: Created automatically when flows are needed
- **Graceful Shutdown**: Clean queue closure with connection cleanup

### Queue Configuration

Each queue can be customized with specific options:

```typescript
// Base configuration applied to all queues
const baseConfig = {
  removeOnComplete: { count: 50, age: 24 * 3600 }, // Keep 50 jobs or 24 hours
  removeOnFail: { count: 50, age: 7 * 24 * 3600 }, // Keep failed jobs for 7 days
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 }
};

// Queue-specific overrides
const emailQueueConfig = {
  ...baseConfig,
  defaultJobOptions: {
    priority: 1, // High priority for emails
    attempts: 5, // More retries for critical emails
  }
};
```

### Adding New Queues

Simply add to the config object:

```typescript
// apps/worker/src/queues/config.ts
export const queues = {
  email: { /* existing config */ },
  documents: { /* existing config */ },
  
  // Add your new queue here - that's it!
  notifications: {
    name: "notifications" as const,
    concurrency: 8,
    options: createBaseQueueOptions({
      defaultJobOptions: {
        priority: 2,
        attempts: 5,
      }
    })
  }
} as const;
```

The queue will be automatically initialized on startup. No separate files or registration needed!

### Queue Management

```typescript
import { getAllQueues, getQueue, closeQueues } from "@worker/queues";

// Get all registered queues
const queues = getAllQueues();

// Get specific queue by name
const emailQueue = getQueue("email");

// Graceful shutdown (handles flows too)
await closeQueues();
```
## 🚀 Quick Start

### 1. Define a Job

```typescript
// apps/worker/src/jobs/my-job.ts
import { z } from "zod";
import { job } from "../core/job";

export const myJob = job(
  "my-job",
  z.object({
    userId: z.string(),
    action: z.enum(["email", "notification"]),
  }),
  async (data, ctx) => {
    // Clean context object with everything you need
    const { job, db, logger } = ctx;
    
    logger.info(`Processing ${data.action} for user ${data.userId}`);
    
    // Access to database
    const user = await db.select().from(users).where(eq(users.id, data.userId));
    
    // Update job progress
    await job.updateProgress(50);
    
    return { processed: true, userId: data.userId };
  },
  {
    priority: 1,
    attempts: 3,
    removeOnComplete: 50,
  }
);

export type MyJobData = z.infer<typeof myJob.schema>;
```

### 2. Trigger the Job

```typescript
// Anywhere in your application
import { myJob } from "@worker/jobs/my-job";

// ✅ Simple trigger - FULLY TYPED based on schema
await myJob.trigger({
  userId: "user_123",
  action: "email",
});

// ❌ TypeScript will catch these errors at compile time:
// await myJob.trigger({ userId: 123 }); // Error: number not assignable to string
// await myJob.trigger({ wrongField: "value" }); // Error: unknown property
// await myJob.trigger({}); // Error: missing required properties

// With options
await myJob.trigger(
  { userId: "user_123", action: "notification" },
  { delay: 5000, priority: 10 }
);

// Batch trigger - each payload is typed
await myJob.batchTrigger([
  { payload: { userId: "user_1", action: "email" } },
  { payload: { userId: "user_2", action: "notification" } },
]);

// Delayed trigger - payload is typed
await myJob.triggerDelayed(
  { userId: "user_123", action: "email" }, 
  30000 // 30 seconds
);

// Recurring trigger - payload is typed
await myJob.triggerRecurring(
  { userId: "user_123", action: "email" },
  "0 9 * * *" // Daily at 9 AM
);
```

### 3. Export Your Jobs

```typescript
// apps/worker/src/jobs/index.ts
export { myJob, type MyJobData } from "./my-job";
```

## 🛡️ Type Safety & IntelliSense

Our job system provides **complete type safety** from schema to trigger calls:

### Automatic Type Inference
```typescript
// Define once with Zod schema
const orderJob = job(
  "process-order",
  z.object({
    orderId: z.string().uuid(),
    customerId: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    })),
    metadata: z.object({
      priority: z.enum(["low", "normal", "high"]),
      source: z.string(),
    }).optional(),
  }),
  async (data, ctx) => {
    // `data` is fully typed here - no manual type assertions needed!
    ctx.logger.info(`Processing order ${data.orderId} for customer ${data.customerId}`);
    data.items.forEach(item => {
      // TypeScript knows `item` has productId (string) and quantity (number)
    });
  }
);

// Trigger calls are fully typed - IntelliSense and error checking included!
await orderJob.trigger({
  orderId: "550e8400-e29b-41d4-a716-446655440000",
  customerId: "cust_123",
  items: [
    { productId: "prod_1", quantity: 2 },
    { productId: "prod_2", quantity: 1 },
  ],
  metadata: {
    priority: "high",
    source: "web"
  }
});
```

### Compile-Time Error Prevention
```typescript
// ❌ These will be caught by TypeScript BEFORE runtime:

// Wrong property name
await orderJob.trigger({
  orderID: "123", // ❌ Error: Object literal may only specify known properties
  customerId: "cust_123",
  items: []
});

// Wrong type
await orderJob.trigger({
  orderId: 123, // ❌ Error: Type 'number' is not assignable to type 'string'
  customerId: "cust_123", 
  items: []
});

// Missing required properties
await orderJob.trigger({
  orderId: "123"
  // ❌ Error: Property 'customerId' is missing
  // ❌ Error: Property 'items' is missing
});

// Invalid enum value
await orderJob.trigger({
  orderId: "123",
  customerId: "cust_123",
  items: [],
  metadata: {
    priority: "urgent" // ❌ Error: '"urgent"' is not assignable to '"low" | "normal" | "high"'
  }
});
```

### Type Extraction for Reuse
```typescript
// Extract types from your job schemas
type OrderJobData = z.infer<typeof orderJob.schema>;
type OrderItem = OrderJobData['items'][0];
type OrderPriority = NonNullable<OrderJobData['metadata']>['priority'];

// Use in other parts of your application
function createOrder(data: OrderJobData): Promise<void> {
  return orderJob.trigger(data);
}
```

## 🌊 Flows: Complex Workflows

Create parent-child job relationships for complex business processes:

### Simple Parallel Flow
```typescript
// All children run simultaneously, parent waits for completion
await parentJob.triggerFlow({
  data: { orderId: "order_123" },
  children: [
    { job: validatePaymentJob, data: paymentData },
    { job: updateInventoryJob, data: inventoryData },
    { job: sendConfirmationJob, data: emailData },
  ],
});
```

### Serial Chain
```typescript
// Jobs run one after another
await reportJob.triggerFlow({
  data: { reportId: "rpt_789" },
  children: [{
    job: processDataJob,
    data: { reportId: "rpt_789" },
    children: [{
      job: collectDataJob,
      data: { reportId: "rpt_789" },
    }],
  }],
});
// Execution order: collectDataJob → processDataJob → reportJob
```

### Access Children Results
```typescript
const parentJob = job(
  "order-completion",
  z.object({ orderId: z.string() }),
  async (data, ctx) => {
    // Get results from all children
    const childrenValues = await ctx.job.getChildrenValues();
    
    // Process specific results
    const paymentResult = Object.values(childrenValues)
      .find((r: any) => r.transactionId);
    
    return {
      orderId: data.orderId,
      completed: true,
      paymentResult,
      completedAt: new Date()
    };
  }
);
```

## 📧 Real-World Example: Complete Onboarding System

We've implemented a complete user onboarding system (migrated from Trigger.dev) that demonstrates advanced job orchestration:

```typescript
import { onboardTeamJob } from "@worker/jobs/onboarding";

// Start complete email sequence for new user
await onboardTeamJob.trigger({ userId: "user_123" });

// This automatically:
// 1. Sends welcome email immediately  
// 2. Schedules get started email for 3 days later
// 3. Schedules trial expiring email for 14 days later
// 4. Schedules trial ended email for 30 days later
```

**Key Features:**
- **5 separate jobs** for maximum flexibility
- **Individual retry policies** for each email
- **Custom timing per user** (VIP vs standard users)
- **A/B testing support** with different sequences
- **Easy testing** of individual email steps

See [`apps/worker/src/jobs/onboarding/`](./src/jobs/onboarding/) for complete implementation and examples.

## 📁 Project Structure

```
apps/worker/src/
├── core/
│   └── job.ts              # Job factory and registry system
├── jobs/
│   ├── index.ts           # Export all jobs
│   ├── team-invite.ts     # Example job
│   └── onboarding/        # Complete onboarding email sequence
│       ├── onboard-team.ts         # Main orchestrator
│       ├── welcome-email.ts        # Welcome email job
│       ├── get-started-email.ts    # Get started email job
│       ├── trial-expiring-email.ts # Trial expiring email job
│       ├── trial-ended-email.ts    # Trial ended email job
│       ├── usage-example.ts        # Usage examples
│       └── README.md               # Onboarding documentation
├── queues/
│   ├── index.ts           # Queue initialization & registry
│   ├── base.ts           # Queue registry and base config
│   └── config.ts         # All queue configurations
├── workers/
│   └── index.ts          # Worker processes
└── main.ts               # Application entry point
```

## 🔧 Environment Setup

### Prerequisites
- **Redis** - Required for job queues (BullMQ backend)
- **PostgreSQL** - Database for job data and application state

### Quick Setup

```bash
# Start Redis (choose one)
docker run -p 6379:6379 redis:alpine
# OR brew install redis && redis-server
# OR use hosted Redis (Upstash, Redis Cloud, etc.)

# Create .env file
cp .env.example .env
```

### Environment Variables

```bash
# Redis Configuration (REQUIRED)
REDIS_URL=redis://localhost:6379

# Database Configuration (REQUIRED)
DATABASE_PRIMARY_URL=postgresql://user:password@localhost:5432/midday

# Optional Configuration
ENVIRONMENT=development
WORKER_CONCURRENCY=10
```

## 🚀 Development

### Start the Worker
```bash
# From monorepo root
bun dev:worker

# Or from worker directory
cd apps/worker && bun dev
```

### Add a New Job
1. Create job file: `apps/worker/src/jobs/my-new-job.ts`
2. Define with `job()` factory
3. Export from `apps/worker/src/jobs/index.ts`
4. Auto-registered and ready to use!

### Add a New Queue
1. Add entry to `queues` in `apps/worker/src/queues/config.ts`
2. That's it! Auto-initialized on startup

### Create Complex Workflows
1. Define individual jobs
2. Use `.triggerFlow()` to create parent-child relationships
3. Access children results in parent job handlers

## 🧪 Testing Jobs

```typescript
// Test job execution directly
import { executeJob } from "@worker/jobs";
import { myJob } from "@worker/jobs/my-job";

// Mock BullMQ job and database
const mockJob = { 
  id: "test", 
  data: { userId: "test_user", action: "email" },
  updateProgress: async () => {} 
};
const mockDb = /* your test database */;

const result = await myJob.execute(mockJob, mockDb);
expect(result.processed).toBe(true);
```

## 🎯 Context Object

Every job handler receives a clean context object:

```typescript
interface JobContext {
  job: Job;           // BullMQ job instance
  db: Database;       // Primary database connection
  logger: Logger;     // Structured logger
}

// Usage in job handlers:
async (data, ctx) => {
  const { job, db, logger } = ctx;
  
  // Update progress
  await job.updateProgress(25);
  
  // Query database
  const user = await getUserById(db, data.userId);
  
  // Log with context
  logger.info("Processing user", { userId: data.userId });
}
```

## 📊 Monitoring & Observability

- **Logging**: Structured logging with job context
- **Metrics**: Built-in job success/failure tracking  
- **BullMQ Dashboard**: Visual queue monitoring at `/admin`
- **Type Safety**: Catch data validation errors early

### Health Check

- **`GET /health`** - Lightweight health check (only 1 Redis call)
  - Verifies Redis connectivity with simple ping
  - Lists registered queues without additional Redis calls
  - Optimized for frequent health checks (every 60 seconds)

```typescript
// Health check response
{
  "status": "healthy",
  "redis": "connected", 
  "queues": ["email", "documents"],
  "queueCount": 2
}
```

Use the BullMQ dashboard at `/admin` for detailed queue monitoring and job statistics.

## 🎨 API Reference

### `job(id, schema, handler, options?)`
Creates a new job with automatic registration.

**Parameters:**
- `id` - Unique job identifier
- `schema` - Zod schema for validation
- `handler` - Job execution function `(data, ctx) => Promise<any>`
- `options` - Job configuration (priority, attempts, etc.)

### Job Instance Methods
- `.trigger(data, options?)` - Trigger single job
- `.batchTrigger(payloads)` - Trigger multiple jobs
- `.triggerDelayed(data, delayMs)` - Trigger with delay
- `.triggerRecurring(data, cron)` - Trigger on schedule
- `.triggerFlow(flowDef)` - Create parent-child relationships

### Flow Helpers
- `ctx.job.getChildrenValues()` - Get children results
- `ctx.job.getDependencies()` - Get job dependencies
- `ctx.job.updateProgress(percent)` - Update job progress

## 📚 Further Reading

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Onboarding System](./src/jobs/onboarding/) - Complete real-world example

---

**Built with ❤️ for scalable, type-safe job processing** 🚀