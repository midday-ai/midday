import type { Database } from "@midday/supabase/types";

/**
 * Type helper to extract table Row type from Database
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Type helper to extract table Insert type from Database
 */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Type helper to extract table Update type from Database
 */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/**
 * Type helper to extract table Enum type from Database
 */
export type TableEnum<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
