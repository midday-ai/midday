import { z } from "@hono/zod-openapi";
import { RecordSchema } from "./types";
import { Context } from "hono";

export async function handleGetRequest(c: Context) {
  const key = c.req.param("key");
  const { R2_BUCKET } = c.env;

  try {
    const object = await R2_BUCKET.get(key);
    if (!object) {
      return c.json({ error: "Record not found" }, 404);
    }

    const record = RecordSchema.parse(JSON.parse(await object.text()));
    return c.json(record, 200);
  } catch (error) {
    console.error(`Error retrieving object from R2: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function handlePutRequest(c: Context) {
  const key = c.req.param("key");
  const { R2_BUCKET } = c.env;

  try {
    const body = await c.req.json();
    const record = RecordSchema.parse(body);

    await R2_BUCKET.put(key, JSON.stringify(record), {
      customMetadata: {
        recordId: record.id,
      },
    });

    return c.json(
      { message: "Record stored successfully", id: record.id },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { error: "Invalid record format", details: error.errors },
        400,
      );
    }
    console.error(`Error putting object to R2: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function handleDeleteRequest(c: any) {
  const key = c.req.param("key");
  const { R2_BUCKET } = c.env;

  try {
    await R2_BUCKET.delete(key);
    return c.json({ message: "Record deleted successfully" }, 200);
  } catch (error) {
    console.error(`Error deleting object from R2: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
