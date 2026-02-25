type RequestHeaderReader = {
  header: (name: string) => string | undefined;
};

export type RequestTrace = {
  requestId: string;
  cfRay?: string;
};

export function getRequestTrace(request: RequestHeaderReader): RequestTrace {
  const cfRay = request.header("cf-ray") ?? undefined;
  const requestId =
    request.header("x-request-id") ?? cfRay ?? crypto.randomUUID();

  return { requestId, cfRay };
}
