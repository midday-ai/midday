import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const app = new Hono();

app.get(
  "/",
  describeRoute({
    description: "Say hello to the user",
    tags: ["Documents"],
  }),
);

// app.post(
//   "/",
//   describeRoute({
//     description: "Upload new document",
//     tags: ["Documents"],
//   }),
// );

// app.get(
//   "/:id",
//   describeRoute({
//     description: "Get a document by ID",
//     tags: ["Documents"],
//   }),
// );

// app.put(
//   "/:id",
//   describeRoute({
//     description: "Update a document by ID",
//     tags: ["Documents"],
//   }),
// );

// app.delete(
//   "/:id",
//   describeRoute({
//     description: "Delete a document by ID",
//     tags: ["Documents"],
//   }),
// );

export const documentsRouter = app;
