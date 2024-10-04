import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Query,
} from "@cloudflare/itty-router-openapi";
import { z } from "zod";
import { TaskSchema } from "../pkg/types/task";

// Define the response schema
const TaskListResponseSchema = z.object({
  success: z.boolean(),
  tasks: z.array(TaskSchema),
});

// You can also define the query parameters schema
const TaskListQuerySchema = z.object({
  page: z.number().default(0),
  isCompleted: z.boolean().optional(),
});

// Infer types from the schemas
type TaskListResponse = z.infer<typeof TaskListResponseSchema>;
type TaskListQuery = z.infer<typeof TaskListQuerySchema>;

export class TaskList extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["Tasks"],
    summary: "List Tasks",
    parameters: {
      page: Query(Number, {
        description: "Page number",
        default: 0,
      }),
      isCompleted: Query(Boolean, {
        description: "Filter by completed flag",
        required: false,
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of tasks",
        schema: {
          success: z.boolean(),
          tasks: z.array(TaskSchema),
        },
      },
    },
  };

  async handle(
    request: Request,
    env: any,
    context: any,
    data: Record<string, any>,
  ) {
    // Validate and parse query parameters
    const { page, isCompleted } = TaskListQuerySchema.parse(data.query);

    // Implement your own object list here

    // Validate the response
    const response: TaskListResponse = TaskListResponseSchema.parse({
      success: true,
      tasks: [
        {
          name: "Clean my room",
          slug: "clean-room",
          description: null,
          completed: false,
          due_date: "2025-01-05",
        },
        {
          name: "Build something awesome with Cloudflare Workers",
          slug: "cloudflare-workers",
          description: "Lorem Ipsum",
          completed: true,
          due_date: "2022-12-24",
        },
      ],
    });

    return response;
  }
}

export { TaskListQuery, TaskListResponse };
