import * as z from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z);

export default z;
export * from "./schemas";
export * from "./types";
