export function isError(error: unknown) {
  if (!error) return false;
  if (typeof error !== "object") return false;

  const tellerError = error as {
    error: { code: string; message: string };
  };

  if (!("error" in tellerError)) {
    return false;
  }

  return {
    code: tellerError.error.code,
    message: tellerError.error.message,
  };
}
