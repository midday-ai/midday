/**
 * Transform Midday invoice data to DDD Invoices format
 */

import type {
  BuyerTypeCode,
  DDDInvoice,
  DDDInvoiceItem,
  DDDPayment,
  LegalForm,
  MiddayInvoiceData,
  UnitCode,
} from "./types";

/**
 * Common Peppol participant identifier schemes (ISO 6523 ICD codes)
 * See: https://docs.peppol.eu/edelivery/codelists/
 */
export const PEPPOL_SCHEMES = [
  "0002", // System Information et Repertoire des Entreprise et des Etablissements: SIRENE
  "0007", // Organisationsnummer (Sweden)
  "0009", // SIRET-CODE
  "0037", // FI-OVT
  "0060", // DUNS Number
  "0088", // Global Location Number (GLN)
  "0096", // DANISH CHAMBER OF COMMERCE Scheme
  "0106", // Vereining van Kamers van Koophandel (Netherlands KVK)
  "0130", // Directorates of the European Commission
  "0135", // SIA Object Identifiers
  "0142", // SECETI Object Identifiers
  "0151", // Australian Business Number (ABN)
  "0183", // Swiss Unique Business Identification Number (UIDB)
  "0184", // DIGSTORG
  "0190", // Dutch Originator's Identification Number
  "0191", // Centre of Registers and Information Systems of the Ministry of Justice
  "0192", // Organisasjonsnummer (Norway)
  "0193", // UBL.BE party identifier
  "0195", // Singapore UEN
  "0196", // Icelandic Kennitala
  "0198", // ERSTORG
  "0199", // Legal Entity Identifier (LEI)
  "0200", // Lithuania LT:LEC
  "0201", // Lithuania LT:GOV
  "0204", // GS1 Germany
  "0208", // Belgian Crossroad Bank of Enterprises
  "0209", // GS1 Belgium & Luxembourg
  "0210", // CodeFiscale (Italy)
  "0211", // PARTITA IVA (Italy)
  "0212", // Finnish Organization Identifier
  "0213", // Finnish Organization Value Add Tax Identifier
  "0215", // Net service ID
  "0216", // OVTcode
  "0221", // Japan - LIN
  "0230", // Malaysia - MyKAD
  "9901", // Danish Ministry of the Interior and Health
  "9906", // Italy VAT Number
  "9907", // Italy Fiscal Code
  "9910", // Hungary VAT Number
  "9913", // Business Registers Network
  "9914", // Österreichisches Verwaltungs- bzw. Organisationskennzeichen
  "9915", // Österreichische Umsatzsteuer-Identifikationsnummer
  "9918", // Society for Worldwide Interbank Financial Telecommunication (SWIFT)
  "9919", // Kennziffer des Unternehmensregisters
  "9920", // Spain VAT Number
  "9922", // Andorra VAT Number
  "9923", // Albania VAT Number
  "9924", // Bosnia and Herzegovina VAT Number
  "9925", // Belgium VAT Number
  "9926", // Bulgaria VAT Number
  "9927", // Switzerland VAT Number
  "9928", // Cyprus VAT Number
  "9929", // Czech Republic VAT Number
  "9930", // Germany VAT Number
  "9931", // Estonia VAT Number
  "9932", // United Kingdom VAT Number
  "9933", // Greece VAT Number
  "9934", // Croatia VAT Number
  "9935", // Ireland VAT Number
  "9936", // Liechtenstein VAT Number
  "9937", // Lithuania VAT Number
  "9938", // Luxembourg VAT Number
  "9939", // Latvia VAT Number
  "9940", // Monaco VAT Number
  "9941", // Montenegro VAT Number
  "9942", // Macedonia VAT Number
  "9943", // Malta VAT Number
  "9944", // Netherlands VAT Number
  "9945", // Poland VAT Number
  "9946", // Portugal VAT Number
  "9947", // Romania VAT Number
  "9948", // Serbia VAT Number
  "9949", // Slovenia VAT Number
  "9950", // Slovakia VAT Number
  "9951", // San Marino VAT Number
  "9952", // Turkey VAT Number
  "9953", // Vatican City State VAT Number
  "9957", // France VAT Number
  "9959", // Employer Identification Number (USA)
] as const;

export type PeppolScheme = (typeof PEPPOL_SCHEMES)[number];

/**
 * Peppol ID validation result
 */
export interface PeppolIdValidation {
  valid: boolean;
  scheme?: string;
  identifier?: string;
  error?: string;
}

/**
 * Validate a Peppol participant ID format
 * Format: {scheme}:{identifier} where scheme is a 4-digit ISO 6523 ICD code
 *
 * @example
 * validatePeppolId("0192:123456789") // Norwegian org number
 * validatePeppolId("9930:DE123456789") // German VAT
 * validatePeppolId("0088:1234567890123") // GLN (13 digits)
 */
export function validatePeppolId(peppolId: string): PeppolIdValidation {
  if (!peppolId || typeof peppolId !== "string") {
    return { valid: false, error: "Peppol ID is required" };
  }

  const trimmed = peppolId.trim();

  // Check for colon separator
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex === -1) {
    return {
      valid: false,
      error:
        "Invalid format: must be {scheme}:{identifier} (e.g., 0192:123456789)",
    };
  }

  const scheme = trimmed.substring(0, colonIndex);
  const identifier = trimmed.substring(colonIndex + 1);

  // Validate scheme (should be 4 digits)
  if (!/^\d{4}$/.test(scheme)) {
    return {
      valid: false,
      error: `Invalid scheme "${scheme}": must be a 4-digit code`,
    };
  }

  // Check if scheme is known (warning only, not an error)
  const isKnownScheme = PEPPOL_SCHEMES.includes(scheme as PeppolScheme);

  // Validate identifier (must not be empty, alphanumeric allowed)
  if (!identifier || identifier.length === 0) {
    return {
      valid: false,
      error: "Identifier cannot be empty",
    };
  }

  // Identifier should be alphanumeric (some schemes allow letters)
  if (!/^[A-Za-z0-9]+$/.test(identifier)) {
    return {
      valid: false,
      error: "Identifier must be alphanumeric",
    };
  }

  // Scheme-specific validation
  const schemeValidation = validateSchemeSpecific(scheme, identifier);
  if (!schemeValidation.valid) {
    return schemeValidation;
  }

  return {
    valid: true,
    scheme,
    identifier,
    error: isKnownScheme
      ? undefined
      : `Warning: scheme ${scheme} is not in the common Peppol schemes list`,
  };
}

/**
 * Validate identifier based on specific scheme rules
 */
function validateSchemeSpecific(
  scheme: string,
  identifier: string,
): PeppolIdValidation {
  switch (scheme) {
    case "0088": // GLN - must be 13 digits
      if (!/^\d{13}$/.test(identifier)) {
        return {
          valid: false,
          error: "GLN (0088) must be exactly 13 digits",
        };
      }
      break;

    case "0060": // DUNS - must be 9 digits
      if (!/^\d{9}$/.test(identifier)) {
        return {
          valid: false,
          error: "DUNS (0060) must be exactly 9 digits",
        };
      }
      break;

    case "0007": // Swedish org number - 10 digits
      if (!/^\d{10}$/.test(identifier)) {
        return {
          valid: false,
          error: "Swedish organization number (0007) must be exactly 10 digits",
        };
      }
      break;

    case "0192": // Norwegian org number - 9 digits
      if (!/^\d{9}$/.test(identifier)) {
        return {
          valid: false,
          error:
            "Norwegian organization number (0192) must be exactly 9 digits",
        };
      }
      break;

    case "0151": // Australian Business Number - 11 digits
      if (!/^\d{11}$/.test(identifier)) {
        return {
          valid: false,
          error: "Australian Business Number (0151) must be exactly 11 digits",
        };
      }
      break;

    // VAT numbers (99xx schemes) - format varies by country but generally alphanumeric
    default:
      if (scheme.startsWith("99")) {
        // VAT numbers - at least 5 characters
        if (identifier.length < 5) {
          return {
            valid: false,
            error: "VAT number must be at least 5 characters",
          };
        }
      }
      break;
  }

  return { valid: true, scheme, identifier };
}

/**
 * Determine if a country is domestic relative to the seller
 */
function getBuyerTypeCode(
  buyerCountryCode: string | null,
  sellerCountryCode: string | null,
): BuyerTypeCode {
  if (!buyerCountryCode || !sellerCountryCode) {
    return "Domestic";
  }
  return buyerCountryCode.toUpperCase() === sellerCountryCode.toUpperCase()
    ? "Domestic"
    : "Foreign";
}

/**
 * Map Midday unit to DDD unit code
 */
function mapUnitCode(unit: string | undefined): UnitCode {
  if (!unit) return "piece";

  const unitLower = unit.toLowerCase();

  if (unitLower.includes("hour") || unitLower === "hr" || unitLower === "h") {
    return "hour";
  }
  if (unitLower.includes("day") || unitLower === "d") {
    return "day";
  }
  if (unitLower.includes("kg") || unitLower.includes("kilo")) {
    return "kg";
  }
  if (unitLower.includes("meter") || unitLower === "m") {
    return "meter";
  }
  if (unitLower.includes("liter") || unitLower === "l") {
    return "liter";
  }

  return "piece";
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0] || null;
  } catch {
    return null;
  }
}

/**
 * Transform Midday invoice data to DDD Invoice format
 */
export function transformToDDDInvoice(data: MiddayInvoiceData): DDDInvoice {
  const { invoice, customer, team } = data;

  // Determine legal form (default to LegalEntity for B2B)
  const legalForm: LegalForm =
    (customer.legalForm as LegalForm) || "LegalEntity";

  // Determine buyer type (domestic vs foreign)
  const buyerTypeCode = getBuyerTypeCode(
    customer.countryCode,
    team.countryCode,
  );

  // Transform line items
  const items: DDDInvoiceItem[] = (invoice.lineItems || []).map((item) => ({
    ItemName: item.name || "Item",
    ItemQuantity: item.quantity ?? 1,
    ItemUmcCode: mapUnitCode(item.unit),
    ItemNetPrice: item.price ?? 0,
    ItemRetailPrice: null,
    ItemAllowancePercent: 0,
    ItemVatRate: item.taxRate ?? 0,
    ItemVatCode: item.taxRate ? String(item.taxRate) : "0",
    ItemExciseAmount: 0,
  }));

  // Calculate total amount if not provided
  const totalAmount =
    invoice.amount ??
    items.reduce((sum, item) => sum + item.ItemNetPrice * item.ItemQuantity, 0);

  // Default payment (credit transfer)
  const payments: DDDPayment[] = [
    {
      PayCode: "CREDITTRANSFER",
      PayNumber: null,
      PayAmount: totalAmount,
      PayPayeeAccountType: null,
      PayNetworkProvider: null,
      PayCardHolderOrReference: null,
      PayDocDate: null,
    },
  ];

  return {
    // Buyer information
    BuyerLegalForm: legalForm,
    BuyerTypeCode: buyerTypeCode,
    BuyerCountryCode: customer.countryCode?.toUpperCase() || "US",
    BuyerTaxNum: customer.vatNumber || null,
    BuyerName: customer.name,
    BuyerPostCode: customer.zip || null,
    BuyerStreet: customer.addressLine1 || null,
    BuyerCity: customer.city || null,
    BuyerRegNum: customer.registrationNumber || null,
    BuyerId: customer.peppolId || null, // Peppol participant ID
    BuyerIsBudget: false,
    BuyerBudgetNum: null,

    // Seller (Team) information - required for Peppol
    SellerName: team.name ?? undefined,
    SellerCountryCode: team.countryCode?.toUpperCase() || "US",
    SellerTaxNum: team.taxId || null,
    SellerRegNum: team.registrationNumber || null,
    SellerPostCode: team.zip || null,
    SellerStreet: team.addressLine1 || null,
    SellerCity: team.city || null,
    SellerId: team.peppolId || null,

    // Document information
    DocNumber: invoice.invoiceNumber || null, // DDD will auto-generate if null
    DocIssueDate: formatDate(invoice.issueDate),
    DocDueDate: formatDate(invoice.dueDate),
    DocTotalAmount: totalAmount,
    DocTotalVatAmount: invoice.vat ?? 0,
    DocCurrencyCode: invoice.currency?.toUpperCase() || "USD",
    DocExchangeRate: 1.0,
    DocAllowPercent: 0,
    DocSigner: null,
    DocNote: invoice.note || null,
    DocBuyerOrderRef: null,
    OriginalInvNumber: null,
    OriginalInvIssueDate: null,
    DocTypeCode: "INVOICE",
    DocSaleTypeCode: "Wholesale",
    DocPaymentTypeCode: "NONCASH",
    OperatorTAPRegistration: null,
    PDFOriginal: null,

    // Line items and payments
    _details: {
      Items: items,
      Payments: payments,
    },
  };
}

/**
 * Validate that required fields are present for Peppol delivery
 */
export function validateForPeppol(data: MiddayInvoiceData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Customer must have Peppol ID
  if (!data.customer.peppolId) {
    errors.push("Customer Peppol ID is required");
  } else {
    // Validate Peppol ID format
    const peppolValidation = validatePeppolId(data.customer.peppolId);
    if (!peppolValidation.valid) {
      errors.push(`Invalid customer Peppol ID: ${peppolValidation.error}`);
    } else if (peppolValidation.error) {
      // This is a warning (unknown scheme)
      warnings.push(peppolValidation.error);
    }
  }

  // Validate seller's Peppol ID if present
  if (data.team.peppolId) {
    const sellerPeppolValidation = validatePeppolId(data.team.peppolId);
    if (!sellerPeppolValidation.valid) {
      errors.push(`Invalid seller Peppol ID: ${sellerPeppolValidation.error}`);
    } else if (sellerPeppolValidation.error) {
      warnings.push(`Seller: ${sellerPeppolValidation.error}`);
    }
  }

  // Customer must have country code
  if (!data.customer.countryCode) {
    errors.push("Customer country code is required");
  }

  // Seller (team) must have required fields for Peppol
  if (!data.team.name) {
    errors.push("Team/company name is required");
  }
  if (!data.team.countryCode) {
    errors.push("Team/company country code is required");
  }
  if (!data.team.zip) {
    warnings.push("Team/company postal code is recommended for Peppol");
  }
  if (!data.team.addressLine1) {
    warnings.push("Team/company address is recommended for Peppol");
  }
  if (!data.team.city) {
    warnings.push("Team/company city is recommended for Peppol");
  }

  // Invoice must have amount
  if (
    !data.invoice.amount &&
    (!data.invoice.lineItems || data.invoice.lineItems.length === 0)
  ) {
    errors.push("Invoice must have amount or line items");
  }

  // Invoice must have currency
  if (!data.invoice.currency) {
    errors.push("Invoice currency is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if an invoice can be sent via e-invoice
 * Returns true if customer has Peppol ID and all required fields
 */
export function canSendEInvoice(data: MiddayInvoiceData): boolean {
  // Customer must have Peppol ID
  if (!data.customer.peppolId) {
    return false;
  }

  // Basic validation
  const validation = validateForPeppol(data);
  return validation.valid;
}
