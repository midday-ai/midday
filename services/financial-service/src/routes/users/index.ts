import { UserRepository } from "@/data/userRepository";
import { users } from '@/db/schema';
import { HonoEnv } from "@/hono/env";
import { createErrorResponse } from "@/utils/error";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono<HonoEnv>();

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });

const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User created successfully",
    },
    400: {
      description: "Bad request",
    },
  },
});

app.openapi(createUserRoute, async (c) => {
  const { db } = c.get('services');
  const userData = c.req.valid("json");

  try {
    const [user] = await db.insert(users).values(userData).returning();
    return c.json(user, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 400);
  }
});

// Read User Route
const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User retrieved successfully",
    },
    404: {
      description: "User not found",
    },
  },
});

app.openapi(getUserRoute, async (c) => {
  const { db } = c.get('services');
  const { id } = c.req.valid('param');

  try {
      const user = new UserRepository(db).getById(id)
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(user, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 500);
  }
});

// Update User Route
const updateUserRoute = createRoute({
  method: "put",
  path: "/users/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User updated successfully",
    },
    404: {
      description: "User not found",
    },
  },
});

app.openapi(updateUserRoute, async (c) => {
  const { db } = c.get('services');
  const { id } = c.req.valid('param');
  const updateData = c.req.valid('json');

  try {
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(users.id.equals(id))
      .returning();
    
    if (!updatedUser) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(updatedUser, 200);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 500);
  }
});

// Delete User Route
const deleteUserRoute = createRoute({
  method: "delete",
  path: "/users/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: "User deleted successfully",
    },
    404: {
      description: "User not found",
    },
  },
});

app.openapi(deleteUserRoute, async (c) => {
  const { db } = c.get('services');
  const { id } = c.req.valid('param');

  try {
    const result = await db.delete(users).where(users.id.equals(id));
    if (result.rowCount === 0) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.newResponse(null, 204);
  } catch (error) {
    const errorResponse = createErrorResponse(error, c.get("requestId"));
    return c.json(errorResponse, 500);
  }
});

export default app;