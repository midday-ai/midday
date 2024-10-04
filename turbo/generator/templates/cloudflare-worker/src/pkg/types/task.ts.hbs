import { z } from "zod";

export const TaskSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  completed: z.boolean(),
  due_date: z.string().datetime(),
});

export type TaskType = z.infer<typeof TaskSchema>;

export const createTaskSchema = TaskSchema.omit({ completed: true });

export const taskResponseSchema = z.object({
  success: z.boolean(),
  task: TaskSchema,
});

export const tasksListResponseSchema = z.object({
  success: z.boolean(),
  tasks: z.array(TaskSchema),
});

export const deleteTaskResponseSchema = z.object({
  success: z.boolean(),
  result: z.object({
    task: TaskSchema,
  }),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
