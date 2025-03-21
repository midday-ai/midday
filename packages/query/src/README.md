# Domain-Driven Router Structure

This folder contains a domain-driven approach to organizing queries and mutations in the application. Each domain has its own folder with a combined router file that uses Supabase database types directly.

## Structure

```
routes/
├── _app.ts             # Main entry point that combines all domain routers
├── transactions/       # Transaction domain
│   └── index.ts        # Transaction router with queries and mutations
├── users/              # Users domain
│   └── index.ts        # User router with queries and mutations
└── [other domains]/    # Other domain folders
```

## Using Supabase Database Types

We leverage Supabase's generated types directly to ensure type safety without redefining schemas. This approach provides:

1. **Type safety**: Your TypeScript code is checked against the actual database schema
2. **Single source of truth**: Database types are the source of truth
3. **Automatic updates**: When the database schema changes, your types update automatically

The key type helpers:

```typescript
// Import types from Supabase
import type { TableRow, TableInsert, TableUpdate, TableEnum } from "../../utils/supabase-schema";

// Export types directly from the Supabase schema
export type User = TableRow<"users">;
export type UserInsert = TableInsert<"users">;
export type UserUpdate = TableUpdate<"users">;
export type UserRole = TableEnum<"user_role">;
```

## How to Add a New Domain

1. Create a new folder for your domain in the `routes` directory.
2. Create the following file:

### index.ts
```typescript
import { z } from "zod";
import { t } from "../../strpc";
import type { TableRow, TableInsert, TableUpdate, TableEnum } from "../../utils/supabase-schema";

// Export types directly from the Supabase schema
export type Entity = TableRow<"your_table_name">;
export type EntityInsert = TableInsert<"your_table_name">;
export type EntityUpdate = TableUpdate<"your_table_name">;
export type EntityStatus = TableEnum<"entity_status">;

// Define API input schemas - only include fields you want to expose
const getEntitySchema = z.object({
  id: z.string().uuid(),
});

const createEntitySchema = z.object({
  // Define your input properties with explicit validators
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  // ...other fields with explicit validation
});

// Export input types
export type GetEntityInput = z.infer<typeof getEntitySchema>;
export type CreateEntityInput = z.infer<typeof createEntitySchema>;

// Create the domain router
export const domainRouter = t.router({
  // Queries
  getEntity: t.procedure
    .input(getEntitySchema)
    .query(async ({ ctx, input }) => {
      // Transform input if needed to match database fields
      
      // Implementation of the query
      const { data, error } = await ctx.supabase
        .from("your_table_name")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch entity: ${error.message}`);
      }

      return data as Entity;
    }),

  // Mutations
  createEntity: t.procedure
    .input(createEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // Transform input if needed to match database fields
      
      // Implementation of the mutation
      const { data, error } = await ctx.supabase
        .from("your_table_name")
        .insert({
          // Map input to database fields
          name: input.name,
          // ...other fields
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create entity: ${error.message}`);
      }

      return data as Entity;
    }),
});
```

3. Update `_app.ts` to include your new domain router:

```typescript
import { domainRouter } from "./domain";

export const appRouter = t.router({
  // Existing routers
  domain: domainRouter,
});
```

## Input Transformation Pattern

When your API input structure differs from the database structure, you can transform the input:

```typescript
// Option 1: Transform inside the handler
createEntity: t.procedure
  .input(createEntitySchema)
  .mutation(async ({ ctx, input }) => {
    // Transform API input to database structure
    const { userId, ...rest } = input;
    const dbData = {
      ...rest,
      user_id: userId, // Map camelCase to snake_case
    };
    
    const { data, error } = await ctx.supabase
      .from("your_table_name")
      .insert(dbData)
      .select()
      .single();
      
    // ...
  }),
```

## Best Practices

1. Keep each domain separate and focused on a specific business entity.
2. Use Supabase types directly for output types.
3. Define explicit Zod schemas for API input validation with clear validation rules.
4. Handle data transformation between API format and database format in the handlers.
5. Use descriptive names for your procedures and schemas.
6. Explicitly handle and throw errors with meaningful messages. 