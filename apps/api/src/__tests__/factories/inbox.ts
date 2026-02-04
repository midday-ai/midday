/**
 * Inbox test data factories.
 */

type InboxStatus =
  | "new"
  | "archived"
  | "deleted"
  | "pending"
  | "processing"
  | "done"
  | "other";

interface InboxResponse {
  id: string;
  fileName: string;
  filePath: string[];
  size: number;
  contentType: string;
  status: InboxStatus;
  transactionId: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  description: string | null;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

interface InboxListMeta {
  cursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createValidInboxResponse(
  overrides: Partial<InboxResponse> = {},
): InboxResponse {
  return {
    id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    fileName: "invoice.pdf",
    filePath: ["team-id", "inbox", "invoice.pdf"],
    size: 1024000,
    contentType: "application/pdf",
    status: "pending",
    transactionId: null,
    amount: null,
    currency: null,
    date: null,
    description: null,
    displayName: "Invoice from Acme",
    createdAt: "2024-05-01T00:00:00.000Z",
    updatedAt: "2024-05-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMinimalInboxResponse(): InboxResponse {
  return createValidInboxResponse({
    transactionId: null,
    amount: null,
    currency: null,
    date: null,
    description: null,
  });
}

export function createMatchedInboxResponse(): InboxResponse {
  return createValidInboxResponse({
    status: "done",
    transactionId: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    amount: 1500,
    currency: "USD",
  });
}

export function createInboxListResponse(
  items: InboxResponse[] = [],
  meta: Partial<InboxListMeta> = {},
): { data: InboxResponse[]; meta: InboxListMeta } {
  return {
    data: items,
    meta: {
      cursor: meta.cursor ?? null,
      hasNextPage: meta.hasNextPage ?? false,
      hasPreviousPage: meta.hasPreviousPage ?? false,
    },
  };
}
