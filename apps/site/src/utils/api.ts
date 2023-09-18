import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@midday/api";

export const api = createTRPCReact<AppRouter>();

export { type RouterInputs, type RouterOutputs } from "@midday/api";
