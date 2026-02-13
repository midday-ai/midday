// ---------------------------------------------------------------------------
// Invopop API response types
// ---------------------------------------------------------------------------

export interface InvopopPingResponse {
  ping: "pong";
}

export interface InvopopSiloEntry {
  id: string;
  key?: string;
  folder?: string;
  state?: string;
  doc_schema?: string;
  env_schema?: string;
  signed?: boolean;
  invalid?: boolean;
  draft?: boolean;
  created_at: string;
  updated_at: string;
  snippet?: Record<string, unknown>;
  faults?: InvopopFault[];
  attachments?: InvopopFile[];
  meta?: InvopopMeta[];
  data?: Record<string, unknown>;
}

export interface InvopopFault {
  provider?: string;
  code?: string;
  message?: string;
}

export interface InvopopFile {
  id: string;
  entry_id?: string;
  key?: string;
  name?: string;
  mime?: string;
  size?: number;
  url?: string;
  hash?: string;
  category?: string;
  desc?: string;
  stored?: boolean;
  private?: boolean;
  embeddable?: boolean;
  created_at?: string;
}

export interface InvopopMeta {
  id: string;
  entry_id?: string;
  src?: string;
  key?: string;
  value?: Record<string, unknown>;
  ref?: string;
  link_url?: string;
  link_scope?: string;
  indexed?: boolean;
  owned?: boolean;
  shared?: boolean;
  secure?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InvopopJob {
  id: string;
  workflow_id: string;
  silo_entry_id?: string;
  status?: string;
  key?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  faults?: InvopopFault[];
  attachments?: InvopopFile[];
  intents?: InvopopIntent[];
  envelope?: Record<string, unknown>;
  tags?: string[];
}

export interface InvopopIntent {
  id: string;
  name?: string;
  provider?: string;
  step_id?: string;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  events?: InvopopEvent[];
}

export interface InvopopEvent {
  index?: number;
  status?: string;
  code?: string;
  message?: string;
  at?: string;
  silo_entry_id?: string;
  args?: Record<string, string>;
}

export interface InvopopWorkflow {
  id: string;
  name?: string;
  description?: string;
  schema?: string;
  country?: string;
  draft?: boolean;
  disabled?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InvopopWorkflowCollection {
  list: InvopopWorkflow[] | null;
  limit?: number;
  created_at?: string;
  next_created_at?: string;
}

export interface InvopopValidationError {
  key: string;
  message: string;
  fields?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Invopop webhook payload
// ---------------------------------------------------------------------------

export interface InvopopWebhookPayload {
  id: string;
  event?: string;
  transform_job_id?: string;
  silo_entry_id?: string;
  owner_id?: string;
  key?: string;
  args?: Record<string, string>;
  faults?: InvopopFault[];
}

// ---------------------------------------------------------------------------
// GOBL types (simplified for Midday's needs)
// ---------------------------------------------------------------------------

export interface GOBLInvoice {
  $schema: "https://gobl.org/draft-0/bill/invoice";
  $regime?: string;
  $addons?: string[];
  $tags?: string[];
  uuid?: string;
  type: "standard" | "credit-note" | "corrective" | "debit-note" | "proforma";
  series?: string;
  code?: string;
  issue_date?: string;
  currency: string;
  supplier: GOBLParty;
  customer?: GOBLParty;
  lines: GOBLLine[];
  payment?: GOBLPayment;
  notes?: GOBLNote[];
  totals?: Record<string, unknown>;
}

export interface GOBLParty {
  name: string;
  tax_id?: GOBLTaxIdentity;
  addresses?: GOBLAddress[];
  emails?: GOBLEmail[];
  inboxes?: GOBLInbox[];
  telephones?: GOBLTelephone[];
  identities?: GOBLIdentity[];
  people?: GOBLPerson[];
}

export interface GOBLTaxIdentity {
  country: string;
  code?: string;
}

export interface GOBLAddress {
  num?: string;
  street?: string;
  street_extra?: string;
  locality?: string;
  region?: string;
  state?: string;
  code?: string;
  country?: string;
}

export interface GOBLEmail {
  addr: string;
}

export interface GOBLInbox {
  key: string;
  scheme?: string;
  code?: string;
}

export interface GOBLTelephone {
  num: string;
}

export interface GOBLIdentity {
  key?: string;
  code?: string;
}

export interface GOBLPerson {
  name?: {
    given?: string;
    surname?: string;
  };
}

export interface GOBLLine {
  i?: number;
  quantity: string;
  item: {
    name: string;
    price: string;
    unit?: string;
  };
  taxes?: GOBLLineTax[];
  discounts?: GOBLLineDiscount[];
  sum?: string;
  total?: string;
}

export interface GOBLLineTax {
  cat: string;
  rate?: string;
  percent?: string;
  ext?: Record<string, string>;
}

export interface GOBLLineDiscount {
  reason?: string;
  percent?: string;
  amount?: string;
}

export interface GOBLPayment {
  instructions?: {
    key?: string;
    credit_transfer?: {
      iban?: string;
      name?: string;
    }[];
    ext?: Record<string, string>;
  };
  terms?: {
    detail?: string;
  };
}

export interface GOBLNote {
  key?: string;
  src?: string;
  text?: string;
}

export interface GOBLBuildRequest {
  data: Record<string, unknown>;
  envelop?: boolean;
}

export interface GOBLBuildResponse {
  data: Record<string, unknown>;
}
