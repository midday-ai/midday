import { sql } from "drizzle-orm";
import type { Database } from "..";

export type GlobalSearchReturnType = {
  id: string;
  type: string;
  relevance: number;
  created_at: string;
  data: any;
};

export type GlobalSemanticSearchParams = {
  teamId: string;
  searchTerm: string;
  itemsPerTableLimit?: number;
  language?: string;
  types?: string[];
  amount?: number;
  amount_min?: number;
  amount_max?: number;
  status?: string;
  currency?: string;
  start_date?: string;
  end_date?: string;
  due_date_start?: string;
  due_date_end?: string;
};

export async function globalSemanticSearchQuery(
  db: Database,
  params: GlobalSemanticSearchParams,
): Promise<GlobalSearchReturnType[]> {
  const result: GlobalSearchReturnType[] = await db.execute(
    sql`SELECT * FROM global_semantic_search(
      ${params.searchTerm ?? null},
      ${params.teamId ?? null},
      ${params.language ?? null},
      ${params.types ?? null},
      ${params.itemsPerTableLimit ?? null},
      ${params.amount ?? null},
      ${params.amount_min ?? null},
      ${params.amount_max ?? null},
      ${params.status ?? null},
      ${params.currency ?? null},
      ${params.start_date ?? null},
      ${params.end_date ?? null},
      ${params.due_date_start ?? null},
      ${params.due_date_end ?? null}
    )`,
  );

  return result;
}

type GlobalSearchParams = {
  teamId: string;
  searchTerm?: string;
  limit?: number;
  itemsPerTableLimit?: number;
  language?: string;
  relevanceThreshold?: number;
};

export async function globalSearchQuery(
  db: Database,
  params: GlobalSearchParams,
) {
  try {
    const result: GlobalSearchReturnType[] = await db.execute(
      sql`SELECT * FROM global_search(
        ${params.searchTerm ?? null},
        ${params.teamId ?? null},
        ${params.language ?? null},
        ${params.limit ?? null},
        ${params.itemsPerTableLimit ?? null},
        ${params.relevanceThreshold ?? null}
      )`,
    );

    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}
