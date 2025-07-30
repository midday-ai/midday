import type { Context } from "@api/rest/types";
import {
  getTeamByIdSchema,
  teamMembersResponseSchema,
  teamResponseSchema,
  teamsResponseSchema,
  updateTeamByIdSchema,
} from "@api/schemas/team";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  getTeamById,
  getTeamMembers,
  getTeamsByUserId,
  updateTeamById,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all teams",
    operationId: "listTeams",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of teams for the authenticated user.",
    tags: ["Teams"],
    responses: {
      200: {
        description: "Retrieve a list of teams for the authenticated user.",
        content: {
          "application/json": {
            schema: teamsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const session = c.get("session");

    const result = await getTeamsByUserId(db, session.user.id);

    return c.json(validateResponse({ data: result }, teamsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a team",
    operationId: "getTeamById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a team by its ID for the authenticated team.",
    tags: ["Teams"],
    request: {
      params: getTeamByIdSchema,
    },
    responses: {
      200: {
        description: "Team details",
        content: {
          "application/json": {
            schema: teamResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.req.param("id");

    const result = await getTeamById(db, teamId);

    return c.json(validateResponse(result, teamResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a team",
    operationId: "updateTeamById",
    "x-speakeasy-name-override": "update",
    description:
      "Update a team for the authenticated workspace. If there’s no change, returns it as it is.",
    tags: ["Teams"],
    request: {
      params: getTeamByIdSchema,
      body: {
        content: {
          "application/json": {
            schema: updateTeamByIdSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Team updated",
        content: {
          "application/json": {
            schema: teamResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.req.param("id");
    const params = c.req.valid("json");

    const result = await updateTeamById(db, {
      id: teamId,
      data: params,
    });

    return c.json(validateResponse(result, teamResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}/members",
    summary: "List all team members",
    operationId: "listTeamMembers",
    "x-speakeasy-name-override": "members",
    description: "List all team members for the authenticated team.",
    tags: ["Teams"],
    request: {
      params: getTeamByIdSchema,
    },
    responses: {
      200: {
        description: "Team members",
        content: {
          "application/json": {
            schema: teamMembersResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("teams.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.req.param("id");

    const result = await getTeamMembers(db, teamId);

    return c.json(
      validateResponse({ data: result }, teamMembersResponseSchema),
    );
  },
);

export const teamsRouter = app;
