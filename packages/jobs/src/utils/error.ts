export function parseAPIError(error: unknown) {
  if (typeof error === "object" && error !== null && "error" in error) {
    const apiError = error as { error: { code: string; message: string } };
    return {
      code: apiError.error.code,
      message: apiError.error.message,
    };
  }
  return { code: "unknown", message: "An unknown error occurred" };
}
