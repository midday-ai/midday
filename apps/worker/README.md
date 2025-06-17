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

// Simple trigger
await myJob.trigger({
  userId: "user_123",
  action: "email",
});

// With options
await myJob.trigger(
  { userId: "user_123", action: "notification" },
  { delay: 5000, priority: 10 }
);

// Batch trigger
await myJob.batchTrigger([
  { payload: { userId: "user_1", action: "email" } },
  { payload: { userId: "user_2", action: "notification" } },
]);

// Delayed trigger
await myJob.triggerDelayed(data, 30000); // 30 seconds

// Recurring trigger
await myJob.triggerRecurring(data, "0 9 * * *"); // Daily at 9 AM
```

### 3. Export Your Jobs

```typescript
// apps/worker/src/jobs/index.ts
export { myJob, type MyJobData } from "./my-job";
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
│   ├── index.ts           # Queue initialization
│   ├── base.ts           # Queue registry
│   └── documents/        # Queue-specific config
├── workers/
│   └── index.ts          # Worker processes
└── main.ts               # Application entry point
```

## 🔧 Environment Setup

Create `.env` file:

```bash
# Redis Configuration (required for BullMQ)
REDIS_URL=redis://localhost:6379

# Database Configuration  
DATABASE_PRIMARY_URL=postgresql://user:password@localhost:5432/midday

# Environment
ENVIRONMENT=development
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
- **BullMQ Dashboard**: Visual queue monitoring
- **Type Safety**: Catch data validation errors early

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
