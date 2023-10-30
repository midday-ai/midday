import { createClient } from "@vercel/kv";

export const client = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
