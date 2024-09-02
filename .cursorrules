You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI, Radix UI and Tailwind.
  
Code Style and Structure
  - Write concise, technical TypeScript code with accurate examples.
  - Use functional and declarative programming patterns; avoid classes.
  - Prefer iteration and modularization over code duplication.
  - Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
  - Structure files: exported component, subcomponents, helpers, static content, types.
  
Naming Conventions
  - Use lowercase with dashes for directories (e.g., components/auth-wizard).
  - Favor named exports for components.
  
TypeScript Usage
  - Use TypeScript for all code; prefer interfaces over types.
  - Avoid enums; use maps instead.
  - Use functional components with TypeScript interfaces.
  
Syntax and Formatting
  - Use the "function" keyword for pure functions.
  - Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
  - Use declarative JSX.
  
UI and Styling
  - Use Shadcn UI, Radix, and Tailwind for components and styling.
  - Implement responsive design with Tailwind CSS; use a mobile-first approach.
  
Performance Optimization
  - Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
  - Wrap client components in Suspense with fallback.
  - Use dynamic loading for non-critical components.
  - Optimize images: use WebP format, include size data, implement lazy loading.

Next.js Specifics
  - Use next-safe-action for all server actions:
  - Implement type-safe server actions with proper validation.
  - Utilize the `action` function from next-safe-action for creating actions.
  - Define input schemas using Zod for robust type checking and validation.
  - Handle errors gracefully and return appropriate responses.
  - Use import type { ActionResponse } from '@/types/actions'
  - Ensure all server actions return the ActionResponse type
  - Implement consistent error handling and success responses using ActionResponse
  - Example:
    ```typescript
    'use server'

    import { createSafeActionClient } from 'next-safe-action'
    import { z } from 'zod'
    import type { ActionResponse } from '@/app/actions/actions'

    const schema = z.object({
      value: z.string()
    })

    export const someAction = createSafeActionClient()
      .schema(schema)
      .action(async (input): Promise<ActionResponse> => {
        try {
          // Action logic here
          return { success: true, data: /* result */ }
        } catch (error) {
          return { success: false, error: error instanceof AppError ? error : appErrors.UNEXPECTED_ERROR, }
        }
      })
    ```
  - Use useQueryState for all query state management.
  - Example:
    ```typescript
    'use client'
 
    import { useQueryState } from 'nuqs'
    
    export function Demo() {
      const [name, setName] = useQueryState('name')
      return (
        <>
          <input value={name || ''} onChange={e => setName(e.target.value)} />
          <button onClick={() => setName(null)}>Clear</button>
          <p>Hello, {name || 'anonymous visitor'}!</p>
        </>
      )
    }
    ```
  
Key Conventions
  - Use 'nuqs' for URL search parameter state management.
  - Optimize Web Vitals (LCP, CLS, FID).
  - Limit 'use client':
    - Favor server components and Next.js SSR.
    - Use only for Web API access in small components.
    - Avoid for data fetching or state management.
  
  Follow Next.js docs for Data Fetching, Rendering, and Routing.
  