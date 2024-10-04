import { Context } from "hono";

export async function handleGetRequest(c: Context) {
  const key = c.req.param("key");
  const { KV_NAMESPACE } = c.env;

  try {
    const value = await KV_NAMESPACE.get(key, "stream");
    if (value === null) {
      return new Response(null, { status: 204 });
    }
    return new Response(value, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch (error) {
    console.error(`Error retrieving value from KV: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function handlePutRequest(c: Context) {
  const key = c.req.param("key");
  const { KV_NAMESPACE } = c.env;

  try {
    const value = await c.req.arrayBuffer();
    await KV_NAMESPACE.put(key, value);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error putting value to KV: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
