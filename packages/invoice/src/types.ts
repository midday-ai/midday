export type LineItem = {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
};

export type Invoice = {
  id: string;
  dueDate: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  amount: number | null;
  currency: string | null;
  lineItems: LineItem[];
  paymentDetails: EditorDoc | null;
  customerDetails: EditorDoc | null;
  reminderSentAt: string | null;
  updatedAt: string | null;
  note: string | null;
  internalNote: string | null;
  paidAt: string | null;
  vat: number | null;
  tax: number | null;
  filePath: string[] | null;
  status: "draft" | "overdue" | "paid" | "unpaid" | "canceled";
  viewedAt: string | null;
  fromDetails: EditorDoc | null;
  issueDate: string | null;
  sentAt: string | null;
  template: Template;
  noteDetails: EditorDoc | null;
  customerName: string | null;
  token: string;
  sentTo: string | null;
  discount: number | null;
  subtotal: number | null;
  topBlock: EditorDoc | null;
  bottomBlock: EditorDoc | null;
  customer: {
    name: string | null;
    website: string | null;
    email: string | null;
  } | null;
  customerId: string | null;
  team: {
    name: string | null;
  } | null;
};

export type Template = {
  customerLabel: string;
  title: string;
  fromLabel: string;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  descriptionLabel: string;
  priceLabel: string;
  quantityLabel: string;
  totalLabel: string;
  totalSummaryLabel: string;
  vatLabel: string;
  subtotalLabel: string;
  taxLabel: string;
  discountLabel: string;
  timezone: string;
  paymentLabel: string;
  noteLabel: string;
  logoUrl: string | null;
  currency: string;
  paymentDetails: EditorDoc | null;
  fromDetails: EditorDoc | null;
  dateFormat: string;
  includeVat: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  includeDecimals: boolean;
  includeUnits: boolean;
  includeQr: boolean;
  taxRate: number;
  vatRate: number;
  size: "a4" | "letter";
  deliveryType: "create" | "create_and_send";
  locale: string;
};

export interface EditorDoc {
  type: "doc";
  content: EditorNode[];
}

export interface EditorNode {
  type: string;
  content?: InlineContent[];
}

interface InlineContent {
  type: string;
  text?: string;
  marks?: Mark[];
}

export interface Mark {
  type: string;
  attrs?: {
    href?: string;
  };
}

export interface TextStyle {
  fontSize: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic" | "oblique";
  color?: string;
  textDecoration?: string;
}
