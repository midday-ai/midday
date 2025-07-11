import {
	deleteTrackerEntry,
	getTrackerRecordsByRange,
	upsertTrackerEntries,
} from "@api/db/queries/tracker-entries";
import type { Context } from "@api/rest/types";
import {
	createTrackerEntriesResponseSchema,
	deleteTrackerEntrySchema,
	getTrackerRecordsByRangeSchema,
	trackerEntriesResponseSchema,
	upsertTrackerEntriesSchema,
} from "@api/schemas/tracker-entries";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
	createRoute({
		method: "get",
		path: "/",
		summary: "List all tracker entries",
		operationId: "listTrackerEntries",
		"x-speakeasy-name-override": "list",
		description: "List all tracker entries for the authenticated team.",
		tags: ["Tracker Entries"],
		request: {
			query: getTrackerRecordsByRangeSchema,
		},
		responses: {
			200: {
				description: "List all tracker entries for the authenticated team.",
				content: {
					"application/json": {
						schema: trackerEntriesResponseSchema,
					},
				},
			},
		},
		middleware: [withRequiredScope("tracker-entries.read")],
	}),
	async (c) => {
		const db = c.get("db");
		const teamId = c.get("teamId");

		const result = await getTrackerRecordsByRange(db, {
			teamId,
			...c.req.valid("query"),
		});

		return c.json(validateResponse(result, trackerEntriesResponseSchema));
	},
);

app.openapi(
	createRoute({
		method: "post",
		path: "/",
		summary: "Create a tracker entry",
		operationId: "createTrackerEntry",
		"x-speakeasy-name-override": "create",
		description: "Create a tracker entry for the authenticated team.",
		tags: ["Tracker Entries"],
		request: {
			body: {
				content: {
					"application/json": {
						schema: upsertTrackerEntriesSchema.omit({ id: true }),
					},
				},
			},
		},
		responses: {
			201: {
				description: "Tracker entry created successfully.",
				content: {
					"application/json": {
						schema: createTrackerEntriesResponseSchema,
					},
				},
			},
		},
		middleware: [withRequiredScope("tracker-entries.write")],
	}),
	async (c) => {
		const db = c.get("db");
		const teamId = c.get("teamId");
		const session = c.get("session");
		const { assignedId, ...rest } = c.req.valid("json");

		const result = await upsertTrackerEntries(db, {
			teamId,
			assignedId: assignedId ?? session.user.id,
			...rest,
		});

		// Map trackerProject to project to match the response schema
		const dataWithProject = result.map((item) => ({
			...item,
			project: item.trackerProject,
		}));

		return c.json(
			validateResponse(
				{ data: dataWithProject },
				createTrackerEntriesResponseSchema,
			),
		);
	},
);

app.openapi(
	createRoute({
		method: "patch",
		path: "/{id}",
		summary: "Update a tracker entry",
		operationId: "updateTrackerEntry",
		"x-speakeasy-name-override": "update",
		description: "Update a tracker entry for the authenticated team.",
		tags: ["Tracker Entries"],
		request: {
			params: deleteTrackerEntrySchema.pick({ id: true }),
			body: {
				content: {
					"application/json": {
						schema: upsertTrackerEntriesSchema.omit({ id: true }),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Tracker entry updated successfully.",
				content: {
					"application/json": {
						schema: createTrackerEntriesResponseSchema,
					},
				},
			},
		},
		middleware: [withRequiredScope("tracker-entries.write")],
	}),
	async (c) => {
		const db = c.get("db");
		const teamId = c.get("teamId");
		const { id } = c.req.valid("param");
		const { assignedId, ...rest } = c.req.valid("json");

		const result = await upsertTrackerEntries(db, {
			id,
			teamId,
			...rest,
			...(assignedId !== undefined && { assignedId }),
		});

		// Map trackerProject to project to match the response schema
		const dataWithProject = result.map((item) => ({
			...item,
			project: item.trackerProject,
		}));

		return c.json(
			validateResponse(
				{ data: dataWithProject },
				createTrackerEntriesResponseSchema,
			),
		);
	},
);

app.openapi(
	createRoute({
		method: "delete",
		path: "/{id}",
		summary: "Delete a tracker entry",
		operationId: "deleteTrackerEntry",
		"x-speakeasy-name-override": "delete",
		description: "Delete a tracker entry for the authenticated team.",
		tags: ["Tracker Entries"],
		request: {
			params: deleteTrackerEntrySchema.pick({ id: true }),
		},
		responses: {
			200: {
				description: "Tracker entry deleted successfully.",
				content: {
					"application/json": {
						schema: deleteTrackerEntrySchema,
					},
				},
			},
		},
		middleware: [withRequiredScope("tracker-entries.write")],
	}),
	async (c) => {
		const db = c.get("db");
		const teamId = c.get("teamId");
		const { id } = c.req.valid("param");

		const result = await deleteTrackerEntry(db, { teamId, id });

		return c.json(validateResponse(result, deleteTrackerEntrySchema));
	},
);

export const trackerEntriesRouter = app;
