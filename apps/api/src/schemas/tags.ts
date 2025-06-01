import { z } from "@hono/zod-openapi";

export const createTagSchema = z
  .object({
    name: z.string().openapi({
      description: "The name of the tag.",
      example: "Important",
    }),
  })
  .openapi("CreateTag");

export const deleteTagSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "The UUID of the tag to delete.",
        example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        param: {
          in: "path",
          name: "id",
        },
      }),
  })
  .openapi("DeleteTag");

export const updateTagSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "The ID of the tag to update.",
        example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        param: {
          in: "path",
          name: "id",
        },
      }),
    name: z.string().openapi({
      description: "The new name of the tag.",
      example: "Urgent",
    }),
  })
  .openapi("UpdateTag");

export const tagResponseSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .openapi({
        description: "The UUID of the tag.",
        example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        param: {
          in: "path",
        },
      }),
    name: z.string().openapi({
      description: "The name of the tag.",
      example: "Important",
    }),
  })
  .openapi("TagResponse");

export const tagsResponseSchema = z
  .object({
    data: z.array(tagResponseSchema).openapi({
      description: "List of tags.",
    }),
  })
  .openapi("TagsResponse");
