import { Env } from "@/env";
import Typesense from "typesense";

export function SearchClient(envs: Env) {
  return new Typesense.Client({
    nearestNode: {
      host: envs.TYPESENSE_ENDPOINT!,
      port: 443,
      protocol: "https",
    },
    nodes: [
      { host: envs.TYPESENSE_ENDPOINT_US!, port: 443, protocol: "https" },
      { host: envs.TYPESENSE_ENDPOINT_EU!, port: 443, protocol: "https" },
      { host: envs.TYPESENSE_ENDPOINT_AU!, port: 443, protocol: "https" },
    ],
    apiKey: envs.TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 2,
  });
}

export async function getHealthCheck(envs: Env) {
  const typesense = SearchClient(envs);
  const searchResponse = await typesense.health.retrieve();

  return {
    healthy:
      typeof searchResponse === "string" && JSON.parse(searchResponse).ok,
  };
}
