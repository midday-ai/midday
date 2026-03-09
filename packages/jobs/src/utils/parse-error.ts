export function parseAPIError(error: unknown) {
  if (typeof error === "object" && error !== null && "error" in error) {
    const apiError = error as { error: { code: string; message: string } };

    return {
      code: apiError.error.code,
      message: apiError.error.message,
    };
  }

  // Handle TRPCClientError shape where providerCode is embedded in the message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: string }).message;

    try {
      const parsed = JSON.parse(message);
      if (parsed.providerCode) {
        return {
          code: parsed.providerCode,
          message: parsed.message ?? message,
        };
      }
    } catch {
      // Not JSON, fall through
    }
  }

  return { code: "unknown", message: "An unknown error occurred" };
}
