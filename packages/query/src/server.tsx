import "server-only";

export { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { cache } from "react";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
