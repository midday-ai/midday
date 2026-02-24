import type { Database } from "../types/db";

export type Client = {
  from: <T extends keyof Database["public"]["Tables"]>(table: T) => any;
  storage: {
    from(bucket: string): any;
  };
  auth: any;
};

export * from "./db";
