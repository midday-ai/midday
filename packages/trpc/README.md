# Client-Side tRPC with Supabase

This package provides an implementation of tRPC that runs directly on the client, using Supabase as the backend.

## Overview

Traditional tRPC setups require a server to handle API requests. This package offers an alternative approach:

✅ Call your tRPC procedures from the client  
✅ But instead of routing over HTTP to a server  
✅ The procedures just use the Supabase SDK (which already runs on the client too)  
✅ So you're basically piggybacking on Supabase as your "backend"

## How it works

1. **Local Link**: Instead of using an HTTP link that sends requests to a server, we use a custom local link that executes tRPC procedures directly in the browser.
2. **Context with Supabase**: We provide each procedure with a Supabase client through the tRPC context.
3. **Direct Data Access**: The procedures use the Supabase client to interact with your database directly from the frontend.

## Installation

```bash
npm install @midday/trpc
```

## Usage

### Define your procedures

Create procedures that use the Supabase client from the context:

```typescript
// appRouter.ts
import { z } from 'zod';
import { router, procedure } from '@midday/trpc';

export const appRouter = router({
  getTodos: procedure
    .input(z.object({ 
      limit: z.number().min(1).max(100).default(10),
      completed: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx;
      
      let query = supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(input.limit);
      
      if (typeof input.completed !== 'undefined') {
        query = query.eq('completed', input.completed);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch todos: ${error.message}`);
      }
      
      return data;
    }),
  
  // Add more procedures...
});

export type AppRouter = typeof appRouter;
```

### Use in your components

```typescript
'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@midday/trpc';

export function TodoList() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setIsLoading(true);
        // This executes directly in the browser and uses Supabase
        const result = await trpc.getTodos.query({ limit: 20 });
        setTodos(result);
      } catch (error) {
        console.error('Failed to fetch todos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, []);
  
  // Rest of your component...
}
```

## Benefits

- **Simplified Architecture**: No need for a separate API server
- **Type Safety**: Full end-to-end type safety from tRPC
- **Reduced Latency**: No HTTP round trips to your server
- **Easier Deployment**: Just deploy your frontend

## Limitations

- **Security**: Since all operations run in the browser, you're relying on Supabase Row Level Security (RLS) policies for data protection
- **Complex Logic**: For more complex business logic, you might still want to use a server

## Best Practices

- Always implement strong Row Level Security (RLS) policies in Supabase
- Use Supabase's authentication system to secure your data
- Keep your procedures simple and focused on data access

## Example

Check out the example component in `src/example-usage.tsx` for a complete implementation of a Todo app using this approach. 