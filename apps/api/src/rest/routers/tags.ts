import type { Context } from "@api/rest/types";
import {
  createTagSchema,
  deleteTagSchema,
  tagResponseSchema,
  tagsResponseSchema,
  updateTagSchema,
} from "@api/schemas/tags";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  createTag,
  deleteTag,
  getTagById,
  getTags,
  updateTag,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all tags",
    operationId: "listTags",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of tags for the authenticated team.",
    tags: ["Tags"],
    responses: {
      200: {
        description: "Retrieve a list of tags for the authenticated team.",
        content: {
          "application/json": {
            schema: tagsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const result = await getTags(db, { teamId });

    return c.json(
      validateResponse(
        {
          data: result,
        },
        tagsResponseSchema,
      ),
    );
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a tag",
    operationId: "getTagById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a tag by ID for the authenticated team.",
    tags: ["Tags"],
    request: {
      params: tagResponseSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description: "Retrieve a tag by ID for the authenticated team.",
        content: {
          "application/json": {
            schema: tagResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getTagById(db, { id, teamId });

    return c.json(validateResponse(result, tagResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create a new tag",
    operationId: "createTag",
    "x-speakeasy-name-override": "create",
    description: "Create a new tag for the authenticated team.",
    tags: ["Tags"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createTagSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Tag created",
        content: {
          "application/json": {
            schema: tagsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");

    const result = await createTag(db, { teamId, ...body });

    return c.json(validateResponse(result, tagResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a tag",
    operationId: "updateTag",
    "x-speakeasy-name-override": "update",
    description: "Update a tag by ID for the authenticated team.",
    tags: ["Tags"],
    request: {
      params: updateTagSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: updateTagSchema.pick({ name: true }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Tag updated",
        content: {
          "application/json": {
            schema: tagResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");
    const { name } = c.req.valid("json");

    const result = await updateTag(db, {
      id,
      name,
      teamId,
    });

    return c.json(validateResponse(result, tagResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a tag",
    operationId: "deleteTag",
    "x-speakeasy-name-override": "delete",
    description: "Delete a tag by ID for the authenticated team.",
    tags: ["Tags"],
    request: {
      params: deleteTagSchema.pick({ id: true }),
    },
    responses: {
      204: {
        description: "Tag deleted",
      },
    },
    middleware: [withRequiredScope("tags.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteTag(db, { id, teamId });

    return c.json(validateResponse(result, tagResponseSchema));
  },
);

export const tagsRouter = app;
