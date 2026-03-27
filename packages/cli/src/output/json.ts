interface JsonEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
  pagination?: {
    has_more: boolean;
    cursor?: string | null;
    total?: number;
    page_size?: number;
  };
}

export function printJson<T>(data: T, meta?: Record<string, unknown>): void {
  const envelope: JsonEnvelope<T> = { data };
  if (meta) envelope.meta = meta;
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
}

export function printJsonList<T>(
  data: T[],
  pagination?: {
    hasMore: boolean;
    cursor?: string | null;
    total?: number;
    pageSize?: number;
  },
): void {
  const envelope: JsonEnvelope<T[]> = {
    data,
    pagination: pagination
      ? {
          has_more: pagination.hasMore,
          cursor: pagination.cursor,
          total: pagination.total,
          page_size: pagination.pageSize,
        }
      : undefined,
  };
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
}

export function printJsonError(code: string, message: string): void {
  const envelope = {
    error: { code, message },
    data: null,
  };
  process.stderr.write(`${JSON.stringify(envelope, null, 2)}\n`);
}
