export function isError(
  data: unknown,
): false | { code: string; message: string } {
  if (typeof data !== "object" || data === null || !("error" in data)) {
    return false;
  }

  const tellerError = data as { error: { code: string; message: string } };

  return {
    code: tellerError.error.code,
    message: tellerError.error.message,
  };
}
