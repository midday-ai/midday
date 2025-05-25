import { getTeamsByUserId } from "@api/db/queries/users-on-team";
import { teamsResponseSchema } from "@api/schemas/team";
import { withTransform } from "@api/utils/with-transform";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Get all teams",
    tags: ["Teams"],
    responses: {
      200: {
        description: "Teams",
        content: {
          "application/json": {
            schema: resolver(teamsResponseSchema.snake),
          },
        },
      },
    },
  }),
  withTransform(
    {
      output: teamsResponseSchema,
    },
    async (c) => {
      const db = c.get("db");
      const session = c.get("session");

      const result = await getTeamsByUserId(db, session.user.id);
      return { data: result };
    },
  ),
);

app.post(
  "/",
  describeRoute({
    description: "Create a new team",
    tags: ["Teams"],
  }),
);

app.get(
  "/:id",
  describeRoute({
    description: "Get a team by ID",
    tags: ["Teams"],
  }),
);

app.put(
  "/:id",
  describeRoute({
    description: "Update a team by ID",
    tags: ["Teams"],
  }),
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete a team by ID",
    tags: ["Teams"],
  }),
);

app.get(
  "/:id/members",
  describeRoute({
    description: "Get all members of a team by ID",
    tags: ["Teams"],
  }),
);

app.post(
  "/:id/members",
  describeRoute({
    description: "Add a member to a team by ID",
    tags: ["Teams"],
  }),
);

app.delete(
  "/:id/members/:memberId",
  describeRoute({
    description: "Remove a member from a team by ID",
    tags: ["Teams"],
  }),
);

app.get(
  "/:id/members/:memberId",
  describeRoute({
    description: "Get a member of a team by ID",
    tags: ["Teams"],
  }),
);

app.put(
  "/:id/members/:memberId",
  describeRoute({
    description: "Update a member of a team by ID",
    tags: ["Teams"],
  }),
);

export const teamsRouter = app;
