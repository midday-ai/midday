import { Context } from "hono";

export async function handleServiceDurableObjectRequest(c: Context) {
  const { slug, pathname } = c.req.param();
  const { SERVICE_DURABLE_OBJECT } = c.env;

  try {
    const id = SERVICE_DURABLE_OBJECT.idFromName(pathname);
    const service = SERVICE_DURABLE_OBJECT.get(id);

    // Reconstruct the original request URL
    const url = new URL(c.req.url);
    url.pathname = pathname;

    // Create a new request with the original method, headers, and body
    const request = new Request(url.toString(), {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.raw.body,
    });

    const response = await service.fetch(request);

    // Forward the response from the Durable Object
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`Error handling Service Durable Object request: ${error}`);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
