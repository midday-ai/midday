export type RequestTraceHeaders = {
  cfRay?: string;
  requestId: string;
};

export function getRequestTraceHeaders(
  headersList: Headers,
): RequestTraceHeaders {
  const cfRay = headersList.get("cf-ray") ?? undefined;
  const requestId =
    headersList.get("x-request-id") ?? cfRay ?? crypto.randomUUID();

  return { cfRay, requestId };
}
