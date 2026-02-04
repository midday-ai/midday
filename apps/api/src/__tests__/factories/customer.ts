/**
 * Customer test data factories.
 */

interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  countryCode: string | null;
  vatNumber: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerInput {
  name: string;
  email: string;
}

interface CustomerListMeta {
  cursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function createValidCustomerResponse(
  overrides: Partial<CustomerResponse> = {},
): CustomerResponse {
  return {
    id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    name: "Acme Corporation",
    email: "billing@acme.com",
    phone: "+1234567890",
    website: "https://acme.com",
    addressLine1: "123 Main Street",
    addressLine2: null,
    city: "San Francisco",
    state: "CA",
    zip: "94102",
    country: "US",
    countryCode: "US",
    vatNumber: null,
    note: null,
    createdAt: "2024-05-01T00:00:00.000Z",
    updatedAt: "2024-05-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMinimalCustomerResponse(): CustomerResponse {
  return createValidCustomerResponse({
    phone: null,
    website: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zip: null,
    country: null,
    countryCode: null,
    vatNumber: null,
    note: null,
  });
}

export function createCustomerInput(
  overrides: Partial<CustomerInput> = {},
): CustomerInput {
  return {
    name: "New Customer",
    email: "contact@newcustomer.com",
    ...overrides,
  };
}

export function createCustomersListResponse(
  customers: CustomerResponse[] = [],
  meta: Partial<CustomerListMeta> = {},
): { data: CustomerResponse[]; meta: CustomerListMeta } {
  return {
    data: customers,
    meta: {
      cursor: meta.cursor ?? null,
      hasNextPage: meta.hasNextPage ?? false,
      hasPreviousPage: meta.hasPreviousPage ?? false,
    },
  };
}
