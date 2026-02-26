type SerializableErrorDetails = {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
  address?: string;
  port?: number;
  constraint?: string;
  severity?: string;
  detail?: string;
  hint?: string;
  cause?: SerializableErrorDetails;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = source[key];
  return typeof value === "number" ? value : undefined;
}

function readStringOrNumber(
  source: Record<string, unknown>,
  key: string,
): string | number | undefined {
  const value = source[key];
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function extractErrorDetailsInternal(
  error: unknown,
  depth = 0,
): SerializableErrorDetails {
  if (!isRecord(error)) {
    return {
      message: typeof error === "string" ? error : String(error),
    };
  }

  const details: SerializableErrorDetails = {
    name: readString(error, "name"),
    message: readString(error, "message"),
    stack: readString(error, "stack"),
    code: readString(error, "code"),
    errno: readStringOrNumber(error, "errno"),
    syscall: readString(error, "syscall"),
    address: readString(error, "address"),
    port: readNumber(error, "port"),
    constraint: readString(error, "constraint"),
    severity: readString(error, "severity"),
    detail: readString(error, "detail"),
    hint: readString(error, "hint"),
  };

  if (depth < 2 && "cause" in error && error.cause !== undefined) {
    details.cause = extractErrorDetailsInternal(error.cause, depth + 1);
  }

  return details;
}

export function extractErrorDetails(error: unknown): SerializableErrorDetails {
  return extractErrorDetailsInternal(error);
}
